import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { VIEWER_PLANS } from "@/lib/utils/subscription";

/**
 * POST /api/payments/single
 * Purchase single-listing revenue data access (7 days).
 * TODO: Integrate with TossPayments one-time payment.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const listingId = body?.listingId as string | undefined;

  if (!listingId) {
    return NextResponse.json(
      { error: "매물 ID가 필요합니다" },
      { status: 400 },
    );
  }

  const plan = VIEWER_PLANS.SINGLE;

  // TODO: Create TossPayments one-time payment and on success:
  // await prisma.singlePurchase.create({
  //   data: {
  //     userId: session.user.id,
  //     listingId,
  //     expiresAt: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
  //   },
  // });

  return NextResponse.json({
    success: true,
    data: {
      listingId,
      price: plan.price,
      durationDays: plan.durationDays,
      message: "결제 시스템 연동 준비중입니다. 곧 서비스가 시작됩니다.",
    },
  });
}
