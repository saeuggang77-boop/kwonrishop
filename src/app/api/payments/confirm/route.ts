import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPaymentSuccess } from "@/lib/kakao-alimtalk";
import { sendPushToUser } from "@/lib/push";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";
import { calculateNextBumpTime } from "@/lib/bump-utils";
import { generateSellerReport } from "@/lib/report-generator";

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(request, 15, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다" },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user
    const order = await prisma.adPurchase.findUnique({
      where: { id: orderId },
      include: {
        product: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "이미 처리된 주문입니다" },
        { status: 409 }
      );
    }

    // 상품 원가와 주문 금액 일치 확인 (DB 변조 방어)
    if (order.product && order.amount !== order.product.price) {
      console.error(`[Security] Order amount mismatch: order=${order.amount}, product=${order.product.price}, orderId=${orderId}`);
      return NextResponse.json(
        { error: "결제 금액 오류가 발생했습니다" },
        { status: 400 }
      );
    }

    // VAT 10% 적용 검증 (10원 단위 반올림)
    const supplyPrice = order.amount;
    const vatAmount = Math.round(supplyPrice * 0.1 / 10) * 10;
    const expectedTotalAmount = supplyPrice + vatAmount;

    if (amount !== expectedTotalAmount) {
      console.error(`[Security] Payment amount mismatch: received=${amount}, expected=${expectedTotalAmount} (supply=${supplyPrice}, vat=${vatAmount})`);
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다" },
        { status: 400 }
      );
    }

    // Confirm payment with Toss Payments API
    const tossSecretKey = process.env.TOSS_SECRET_KEY;

    if (!tossSecretKey) {
      console.error("TOSS_SECRET_KEY not configured");
      return NextResponse.json(
        { error: "결제 시스템 설정 오류" },
        { status: 500 }
      );
    }

    const tossResponse = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${tossSecretKey}:`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    );

    const tossData = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error("Toss payment confirmation failed:", tossData);

      // ALREADY_PROCESSED_PAYMENT: Toss에서 이미 승인된 결제 → 성공으로 처리
      if (tossData.code === "ALREADY_PROCESSED_PAYMENT") {
        // 우리 DB에서 주문 상태 확인
        const recheckOrder = await prisma.adPurchase.findUnique({
          where: { id: orderId },
          include: { product: true },
        });
        if (recheckOrder?.status === "PAID") {
          return NextResponse.json(
            { alreadyProcessed: true },
            { status: 409 }
          );
        }
        // 아직 PAID가 아니면 (다른 요청이 처리 중) → 잠시 대기 후 재확인
        await new Promise((r) => setTimeout(r, 2000));
        const finalCheck = await prisma.adPurchase.findUnique({
          where: { id: orderId },
          select: { status: true },
        });
        if (finalCheck?.status === "PAID") {
          return NextResponse.json(
            { alreadyProcessed: true },
            { status: 409 }
          );
        }
        // 그래도 PENDING이면 에러
        return NextResponse.json(
          { error: "결제 처리 중입니다. 잠시 후 마이페이지에서 확인해주세요." },
          { status: 400 }
        );
      }

      // Toss 내부 에러 메시지를 사용자에게 직접 노출하지 않음
      const userMessage = (() => {
        switch (tossData.code) {
          case "PROVIDER_ERROR": return "결제 서비스에 일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          case "EXCEED_MAX_CARD_INSTALLMENT_PLAN": return "할부 개월 수가 초과되었습니다.";
          case "NOT_ALLOWED_POINT_USE": return "포인트 사용이 불가한 결제입니다.";
          case "INVALID_REJECT_CARD": return "카드 사용이 거절되었습니다. 카드사에 문의해주세요.";
          case "BELOW_MINIMUM_AMOUNT": return "최소 결제 금액 미만입니다.";
          case "INVALID_CARD_EXPIRATION": return "카드 유효기간이 올바르지 않습니다.";
          case "INVALID_STOPPED_CARD": return "정지된 카드입니다. 카드사에 문의해주세요.";
          case "EXCEED_MAX_DAILY_PAYMENT_COUNT": return "일일 결제 횟수를 초과했습니다. 내일 다시 시도해주세요.";
          case "EXCEED_MAX_PAYMENT_AMOUNT": return "결제 한도를 초과했습니다.";
          case "REJECT_ACCOUNT_PAYMENT": return "계좌 결제가 거절되었습니다. 은행에 문의해주세요.";
          case "REJECT_CARD_PAYMENT": return "카드 결제가 거절되었습니다. 카드사에 문의해주세요.";
          case "REJECT_CARD_COMPANY": return "카드사에서 결제를 거절했습니다. 카드사에 문의해주세요.";
          default: return "결제 승인에 실패했습니다. 다시 시도해주세요.";
        }
      })();
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      );
    }

    // Calculate activation and expiry dates
    const now = new Date();
    const expiresAt = new Date(now);
    if (order.product.duration) {
      expiresAt.setDate(expiresAt.getDate() + order.product.duration);
    }

    // Snapshot viewCount at ad start for LISTING ads
    let viewCountAtAdStart: number | null = null;
    if (order.product.categoryScope === "LISTING" && order.listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: order.listingId },
        select: { viewCount: true },
      });
      viewCountAtAdStart = listing?.viewCount ?? 0;
    }

    // Update order status
    const updatedOrder = await prisma.adPurchase.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentKey,
        activatedAt: now,
        expiresAt: order.product.duration ? expiresAt : null,
        viewCountAtAdStart,
      },
      include: {
        product: true,
      },
    });

    // Tier activation based on categoryScope
    const categoryScope = order.product.categoryScope;
    const features = order.product.features as Record<string, any>;

    // 업그레이드: 같은 대상에 기존 활성 PACKAGE 광고가 있으면 만료 처리 (환불 없음)
    if (order.product.type === "PACKAGE") {
      const expireWhere: any = {
        userId: session.user.id,
        status: "PAID",
        id: { not: order.id },
        product: { type: "PACKAGE" },
      };

      if (order.listingId) {
        expireWhere.listingId = order.listingId;
      } else if (order.equipmentId) {
        expireWhere.equipmentId = order.equipmentId;
      } else if (categoryScope === "FRANCHISE" || categoryScope === "PARTNER") {
        expireWhere.product = { type: "PACKAGE", categoryScope };
      }

      const oldAds = await prisma.adPurchase.findMany({
        where: expireWhere,
        select: { id: true },
      });

      if (oldAds.length > 0) {
        await prisma.adPurchase.updateMany({
          where: { id: { in: oldAds.map((a) => a.id) } },
          data: { status: "EXPIRED" },
        });
      }
    }
    const badge = features?.badge as string | undefined;

    if (categoryScope === "FRANCHISE") {
      const tierMap: Record<string, string> = {
        "브론즈": "BRONZE",
        "실버": "SILVER",
        "골드": "GOLD",
      };
      let newTier = badge ? tierMap[badge] : undefined;
      // badge 없으면 product.name 폴백
      if (!newTier) {
        const pn = order.product.name;
        if (pn.includes("골드")) newTier = "GOLD";
        else if (pn.includes("실버")) newTier = "SILVER";
        else newTier = "BRONZE";
      }
      await prisma.franchiseBrand.updateMany({
        where: { managerId: session.user.id },
        data: {
          tier: newTier as any,
          tierExpiresAt: order.product.duration ? expiresAt : null,
        },
      });
    } else if (categoryScope === "PARTNER") {
      const tierMap: Record<string, string> = {
        "베이직": "BASIC",
        "프리미엄": "PREMIUM",
        "VIP": "VIP",
      };
      let newTier = badge ? tierMap[badge] : undefined;
      // badge 없으면 product.name 폴백
      if (!newTier) {
        const pn = order.product.name;
        if (pn.includes("VIP")) newTier = "VIP";
        else if (pn.includes("프리미엄")) newTier = "PREMIUM";
        else newTier = "BASIC";
      }
      await prisma.partnerService.updateMany({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
        },
        data: {
          tier: newTier as any,
          tierExpiresAt: order.product.duration ? expiresAt : null,
        },
      });
    } else if (categoryScope === "EQUIPMENT" && order.equipmentId) {
      const eqBadge = features?.badge as string | undefined;
      const eqTierMap: Record<string, string> = {
        "베이직": "BASIC",
        "프리미엄": "PREMIUM",
        "VIP": "VIP",
      };
      let newTier = eqBadge ? eqTierMap[eqBadge] : undefined;
      // badge 없으면 product.name 폴백
      if (!newTier) {
        const productName = order.product.name;
        if (productName.includes("VIP")) newTier = "VIP";
        else if (productName.includes("프리미엄")) newTier = "PREMIUM";
        else newTier = "BASIC";
      }

      await prisma.equipment.update({
        where: { id: order.equipmentId },
        data: {
          tier: newTier as any,
          tierExpiresAt: order.product.duration ? expiresAt : null,
        },
      });
    }

    // SINGLE bump: 즉시 bumpedAt 업데이트 (단건 끌어올리기)
    if (order.product.type === "SINGLE" && features?.bumpCount) {
      if (order.listingId) {
        await prisma.listing.update({
          where: { id: order.listingId },
          data: { bumpedAt: now },
        });
      } else if (order.equipmentId) {
        await prisma.equipment.update({
          where: { id: order.equipmentId },
          data: { bumpedAt: now },
        });
      }
    }

    // SUBSCRIPTION type: Create BumpSubscription
    if (order.product.type === "SUBSCRIPTION") {
      const frequency = features.frequency as any;
      const bumpTimes = (features.bumpTimes || ["09:00"]) as string[];
      const nextBumpAt = calculateNextBumpTime(frequency, bumpTimes);

      await prisma.bumpSubscription.create({
        data: {
          userId: session.user.id,
          listingId: order.listingId || undefined,
          equipmentId: order.equipmentId || undefined,
          frequency,
          bumpTimes,
          nextBumpAt,
          adPurchaseId: order.id,
          status: "ACTIVE",
          expiresAt: order.product.duration ? expiresAt : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 매도자 시장분석 리포트 자동 생성
    if (features?.scope === "SELLER_REPORT" && order.listingId) {
      const listingForReport = await prisma.listing.findUnique({
        where: { id: order.listingId },
        include: {
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
        },
      });

      if (listingForReport) {
        // 비동기로 리포트 생성 (결제 확인 응답은 바로 반환)
        (async () => {
          try {
            const reportData = await generateSellerReport(listingForReport);
            await prisma.sellerReport.create({
              data: {
                userId: session.user.id,
                listingId: order.listingId!,
                adPurchaseId: order.id,
                reportData: reportData as any,
              },
            });
          } catch (err) {
            console.error("[SellerReport] Failed to generate report:", err);
          }
        })();
      }
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "PAYMENT_SUCCESS",
        title: "결제가 완료되었습니다",
        message: `${order.product.name} 상품을 구매하셨습니다.`,
        link: "/mypage",
      },
    });

    // 알림톡: 결제 완료 알림 (non-blocking)
    (async () => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { phone: true },
        });

        if (user?.phone) {
          notifyPaymentSuccess(
            user.phone,
            order.product.name,
            expectedTotalAmount
          ).catch(() => {});
        }
      } catch (error) {
        console.error("[Alimtalk] Failed to send payment notification:", error);
      }
    })();

    // 웹 푸시: 결제 완료 알림 (non-blocking)
    sendPushToUser(
      session.user.id,
      "결제가 완료되었습니다",
      `${order.product.name} 상품을 구매하셨습니다.`,
      "/mypage"
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      productName: updatedOrder.product.name,
      supplyPrice: updatedOrder.amount,
      vatAmount,
      amount: expectedTotalAmount,
      status: updatedOrder.status,
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "결제 승인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
