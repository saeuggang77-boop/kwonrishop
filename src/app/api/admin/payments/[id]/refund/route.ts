import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";
import { processRefund, cancelPaymentAtToss } from "@/lib/refund";

/**
 * 관리자 결제 환불 처리
 * POST /api/admin/payments/{id}/refund  body: { reason?: string }
 *
 * 흐름:
 *  1. ADMIN 권한 확인
 *  2. AdPurchase 조회 — PAID 상태만 환불 가능
 *  3. 토스 API 환불 호출
 *  4. 성공 시 DB 업데이트 + 광고 비활성화 + 알림 (processRefund)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(request, 30, 60000);
  if (rateLimitError) return rateLimitError;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const { reason } = await request.json().catch(() => ({ reason: "" }));

  const order = await prisma.adPurchase.findUnique({
    where: { id },
    select: { id: true, status: true, paymentKey: true },
  });

  if (!order) {
    return NextResponse.json({ error: "주문을 찾을 수 없습니다" }, { status: 404 });
  }

  if (order.status === "REFUNDED") {
    return NextResponse.json({ error: "이미 환불된 주문입니다" }, { status: 409 });
  }

  if (order.status !== "PAID") {
    return NextResponse.json(
      { error: `환불할 수 없는 상태입니다 (현재: ${order.status})` },
      { status: 400 }
    );
  }

  if (!order.paymentKey) {
    return NextResponse.json(
      { error: "결제 키가 없어 환불 불가합니다" },
      { status: 400 }
    );
  }

  // 토스 API로 환불 요청
  const tossResult = await cancelPaymentAtToss(order.paymentKey, reason || "관리자 환불");
  if (!tossResult.ok) {
    return NextResponse.json(
      {
        error: `토스 환불 실패: ${tossResult.error}`,
        tossCode: tossResult.tossCode,
      },
      { status: 400 }
    );
  }

  // DB 업데이트 + 광고 원복 + 알림
  const result = await processRefund(order.id);
  return NextResponse.json({ ...result, refunded: true });
}
