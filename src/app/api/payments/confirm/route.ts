import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPaymentSuccess } from "@/lib/kakao-alimtalk";
import { sendPushToUser } from "@/lib/push";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { calculateNextBumpTime } from "@/lib/bump-utils";
import { generateSellerReport } from "@/lib/report-generator";

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = rateLimit(ip, 5, 60000);
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
      return NextResponse.json(
        { error: tossData.message || "결제 승인에 실패했습니다" },
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
