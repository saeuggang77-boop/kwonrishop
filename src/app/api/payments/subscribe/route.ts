import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { VIEWER_PLANS, type ViewerPlanId } from "@/lib/utils/subscription";

/**
 * POST /api/payments/subscribe
 * Start a viewer subscription (MONTHLY or YEARLY).
 * TODO: Integrate with TossPayments billing key flow.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const planId = body?.planId as string | undefined;

  if (!planId || !(planId === "MONTHLY" || planId === "YEARLY")) {
    return NextResponse.json(
      { error: "유효하지 않은 요금제입니다" },
      { status: 400 },
    );
  }

  const plan = VIEWER_PLANS[planId as ViewerPlanId];

  // TODO: Create TossPayments billing key and charge
  // For now return mock success
  return NextResponse.json({
    success: true,
    data: {
      planId,
      planName: plan.name,
      price: plan.price,
      message: "결제 시스템 연동 준비중입니다. 곧 서비스가 시작됩니다.",
    },
  });
}
