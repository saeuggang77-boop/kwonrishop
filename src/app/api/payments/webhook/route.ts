import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processRefund } from "@/lib/refund";

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
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentKey = body?.data?.paymentKey ?? body?.paymentKey;
    const eventType = body?.eventType;

    if (!paymentKey) {
      return NextResponse.json({ ok: true, ignored: "no_payment_key" });
    }

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

    if (payment.status !== "CANCELED") {
      return NextResponse.json({
        ok: true,
        ignored: `status=${payment.status}`,
        eventType,
      });
    }

    const order = await prisma.adPurchase.findFirst({
      where: { paymentKey },
      select: { id: true },
    });

    if (!order) {
      console.warn(`[webhook] AdPurchase not found for paymentKey=${paymentKey}`);
      return NextResponse.json({ ok: true, ignored: "order_not_found" });
    }

    const result = await processRefund(order.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[webhook] Unexpected error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
