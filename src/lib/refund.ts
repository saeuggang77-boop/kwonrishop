import { prisma } from "@/lib/prisma";
import { sendPushToUser, sendPushToUsers } from "@/lib/push";

/**
 * AdPurchase 환불 처리 + 광고 등급 원복 + 알림 발송.
 *
 * 사용처:
 *  - /api/payments/webhook (토스에서 환불 발생 시 자동 호출)
 *  - /api/admin/payments/[id]/refund (관리자 페이지에서 수동 환불 시)
 *
 * 동작:
 *  - AdPurchase 상태 REFUNDED
 *  - 매물/집기/브랜드/서비스 tier FREE 원복
 *  - 활성 끌어올리기 구독 CANCELLED
 *  - 사용자/관리자에게 알림 + 푸시
 *  - 멱등: 이미 REFUNDED 상태면 즉시 반환 (no-op)
 */
export async function processRefund(orderId: string): Promise<{
  ok: boolean;
  alreadyProcessed?: boolean;
  notFound?: boolean;
}> {
  const order = await prisma.adPurchase.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (!order) return { ok: false, notFound: true };
  if (order.status === "REFUNDED") return { ok: true, alreadyProcessed: true };

  const scope = order.product.categoryScope;

  await prisma.$transaction(async (tx) => {
    await tx.adPurchase.update({
      where: { id: order.id },
      data: { status: "REFUNDED" },
    });

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
    } else if (scope === "FRANCHISE" && order.expiresAt) {
      const brand = await tx.franchiseBrand.findFirst({
        where: { managerId: order.userId, tierExpiresAt: order.expiresAt },
        select: { id: true },
      });
      if (brand) {
        await tx.franchiseBrand.update({
          where: { id: brand.id },
          data: { tier: "FREE", tierExpiresAt: null },
        });
      }
    } else if (scope === "PARTNER" && order.expiresAt) {
      const service = await tx.partnerService.findFirst({
        where: { userId: order.userId, tierExpiresAt: order.expiresAt },
        select: { id: true },
      });
      if (service) {
        await tx.partnerService.update({
          where: { id: service.id },
          data: { tier: "FREE", tierExpiresAt: null },
        });
      }
    }
  });

  // 알림 발송 (실패해도 환불 자체는 이미 끝났으니 무시)
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
            link: "/admin/payments",
          })),
        });
        await sendPushToUsers(
          adminIds,
          "결제 환불",
          `${order.product.name} 환불 ${order.amount.toLocaleString()}원`,
          "/admin/payments"
        );
      }
    } catch (err) {
      console.error("[refund] Notification failed:", err);
    }
  })();

  return { ok: true };
}

/**
 * 토스 API로 결제를 환불 요청.
 * 성공 시 토스도 환불 처리되고, 우리 DB도 별도로 업데이트해야 함 (processRefund 호출).
 */
export async function cancelPaymentAtToss(
  paymentKey: string,
  reason: string
): Promise<{ ok: boolean; error?: string; tossCode?: string }> {
  const tossSecretKey = process.env.TOSS_SECRET_KEY;
  if (!tossSecretKey) {
    return { ok: false, error: "결제 시스템 설정 오류" };
  }

  const res = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${tossSecretKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancelReason: reason || "관리자 환불" }),
    }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return {
      ok: false,
      error: data?.message || "토스 환불 요청 실패",
      tossCode: data?.code,
    };
  }

  return { ok: true };
}
