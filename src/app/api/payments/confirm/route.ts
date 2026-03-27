import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyPaymentSuccess } from "@/lib/kakao-alimtalk";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = rateLimit(ip, 10, 60000);
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

    if (order.amount !== amount) {
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

    // Update order status
    const updatedOrder = await prisma.adPurchase.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentKey,
        activatedAt: now,
        expiresAt: order.product.duration ? expiresAt : null,
      },
      include: {
        product: true,
      },
    });

    // Tier activation based on categoryScope
    const categoryScope = order.product.categoryScope;
    const features = order.product.features as Record<string, any>;
    const badge = features?.badge as string | undefined;

    if (categoryScope === "FRANCHISE" && badge) {
      const tierMap: Record<string, string> = {
        "브론즈": "BRONZE",
        "실버": "SILVER",
        "골드": "GOLD",
      };
      const newTier = tierMap[badge];
      if (newTier) {
        await prisma.franchiseBrand.updateMany({
          where: { managerId: session.user.id },
          data: {
            tier: newTier as any,
            tierExpiresAt: order.product.duration ? expiresAt : null,
          },
        });
      }
    } else if (categoryScope === "PARTNER" && badge) {
      const tierMap: Record<string, string> = {
        "베이직": "BASIC",
        "프리미엄": "PREMIUM",
        "VIP": "VIP",
      };
      const newTier = tierMap[badge];
      if (newTier) {
        await prisma.partnerService.updateMany({
          where: { userId: session.user.id },
          data: {
            tier: newTier as any,
            tierExpiresAt: order.product.duration ? expiresAt : null,
          },
        });
      }
    }
    // EQUIPMENT scope: no tier update needed (equipment doesn't have tiers)

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
            order.amount
          ).catch(() => {});
        }
      } catch (error) {
        console.error("[Alimtalk] Failed to send payment notification:", error);
      }
    })();

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      productName: updatedOrder.product.name,
      amount: updatedOrder.amount,
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
