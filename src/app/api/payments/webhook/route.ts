import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser, sendPushToUsers } from "@/lib/push";

/**
 * 토스페이먼츠 웹훅 엔드포인트
 *
 * 결제 취소(환불) 이벤트 수신 → 사이트 광고 자동 비활성화.
 * 인증: 웹훅 바디의 paymentKey로 토스 API에 직접 조회 → 시크릿 키로 검증.
 *
 * 등록 위치: 토스 대시보드 > 개발자센터 > 웹훅
 * 등록 URL: https://www.kwonrishop.com/api/payments/webhook
 *
 * 처리 정책:
 *  - status=CANCELED (전체 환불) 만 자동 처리
 *  - PARTIAL_CANCELED (부분 환불) 은 무시 (운영자가 수동 처리)
 *  - 끌어올리기(SINGLE) 효과는 이미 일어난 일이라 원복 불가 → 상태만 REFUNDED
 *  - PACKAGE 업그레이드로 EXPIRED 처리된 이전 광고는 복원하지 않음 (정책)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentKey = body?.data?.paymentKey ?? body?.paymentKey;
    const eventType = body?.eventType;

    if (!paymentKey) {
      return NextResponse.json({ ok: true, ignored: "no_payment_key" });
    }

    // 토스 API로 직접 조회하여 진위 확인 (시크릿 키 = 인증 토큰 역할)
    const tossSecretKey = process.env.TOSS_SECRET_KEY;
    if (!tossSecretKey) {
      console.error("[webhook] TOSS_SECRET_KEY not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const verifyRes = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentKey}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${tossSecretKey}:`).toString("base64")}`,
        },
      }
    );

    if (!verifyRes.ok) {
      console.error("[webhook] Toss verify failed:", await verifyRes.text());
      return NextResponse.json({ error: "Verify failed" }, { status: 400 });
    }

    const payment = await verifyRes.json();

    // 전체 환불만 자동 처리
    if (payment.status !== "CANCELED") {
      return NextResponse.json({
        ok: true,
        ignored: `status=${payment.status}`,
        eventType,
      });
    }

    const order = await prisma.adPurchase.findFirst({
      where: { paymentKey },
      include: { product: true },
    });

    if (!order) {
      console.warn(`[webhook] AdPurchase not found for paymentKey=${paymentKey}`);
      return NextResponse.json({ ok: true, ignored: "order_not_found" });
    }

    // 이미 환불 처리됨 (멱등성)
    if (order.status === "REFUNDED") {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    const scope = order.product.categoryScope;

    // 광고 등급 원복 + AdPurchase 상태 변경 + 구독 취소를 트랜잭션으로 묶음
    await prisma.$transaction(async (tx) => {
      await tx.adPurchase.update({
        where: { id: order.id },
        data: { status: "REFUNDED" },
      });

      // 활성 끌어올리기 구독이 있으면 취소
      const sub = await tx.bumpSubscription.findUnique({
        where: { adPurchaseId: order.id },
        select: { id: true, status: true },
      });
      if (sub && sub.status === "ACTIVE") {
        await tx.bumpSubscription.update({
          where: { id: sub.id },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
      }

      // categoryScope 별 tier 원복
      if (scope === "LISTING" && order.listingId) {
        await tx.listing.update({
          where: { id: order.listingId },
          data: { tier: "FREE", tierExpiresAt: null },
        });
      } else if (scope === "EQUIPMENT" && order.equipmentId) {
        await tx.equipment.update({
          where: { id: order.equipmentId },
          data: { tier: "FREE", tierExpiresAt: null },
        });
      } else if (scope === "FRANCHISE") {
        // AdPurchase에 franchiseBrandId FK가 없어 expiresAt 매칭으로 대상 식별
        if (order.expiresAt) {
          const brand = await tx.franchiseBrand.findFirst({
            where: {
              managerId: order.userId,
              tierExpiresAt: order.expiresAt,
            },
            select: { id: true },
          });
          if (brand) {
            await tx.franchiseBrand.update({
              where: { id: brand.id },
              data: { tier: "FREE", tierExpiresAt: null },
            });
          }
        }
      } else if (scope === "PARTNER") {
        if (order.expiresAt) {
          const service = await tx.partnerService.findFirst({
            where: {
              userId: order.userId,
              tierExpiresAt: order.expiresAt,
            },
            select: { id: true },
          });
          if (service) {
            await tx.partnerService.update({
              where: { id: service.id },
              data: { tier: "FREE", tierExpiresAt: null },
            });
          }
        }
      }
    });

    // 사이트 알림 + 푸시 (실패해도 환불 처리는 이미 끝났으니 무시)
    void (async () => {
      try {
        await prisma.notification.create({
          data: {
            userId: order.userId,
            type: "PAYMENT",
            title: "결제 취소(환불) 완료",
            message: `${order.product.name} (${order.amount.toLocaleString()}원) 결제가 취소되어 광고가 비활성화되었습니다`,
            link: "/mypage",
          },
        });
        await sendPushToUser(
          order.userId,
          "결제 취소(환불) 완료",
          `${order.product.name} 광고가 비활성화되었습니다`,
          "/mypage"
        );

        // 관리자에게도 알림
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });
        const adminIds = admins.map((a) => a.id);
        if (adminIds.length > 0) {
          await prisma.notification.createMany({
            data: adminIds.map((id) => ({
              userId: id,
              type: "PAYMENT",
              title: "결제 환불 발생",
              message: `${order.product.name} (${order.amount.toLocaleString()}원) 환불 처리됨`,
              link: "/admin/paid-dashboard",
            })),
          });
          await sendPushToUsers(
            adminIds,
            "결제 환불",
            `${order.product.name} 환불 ${order.amount.toLocaleString()}원`,
            "/admin/paid-dashboard"
          );
        }
      } catch (err) {
        console.error("[webhook] Notification failed:", err);
      }
    })();

    return NextResponse.json({ ok: true, refunded: true, orderId: order.id });
  } catch (err) {
    console.error("[webhook] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
