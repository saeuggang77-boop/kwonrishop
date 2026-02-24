import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";
import { VIEWER_PLANS } from "@/lib/utils/subscription";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/payments/single
 * Create payment for single-listing revenue data access (7 days, ₩2,900).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    try {
      const limited = await checkRateLimit(`payment-single:${session.user.id}`, 10, 60);
      if (limited) return limited;
    } catch {}

    const body = await req.json();
    const listingId = body?.listingId as string | undefined;

    if (!listingId) {
      return Response.json({ error: { message: "매물 ID가 필요합니다." } }, { status: 400 });
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, title: true },
    });

    if (!listing) {
      return Response.json({ error: { message: "매물을 찾을 수 없습니다." } }, { status: 404 });
    }

    // Check if user already has active access
    const existingPurchase = await prisma.singlePurchase.findFirst({
      where: {
        userId: session.user.id,
        listingId,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingPurchase) {
      return Response.json(
        { error: { message: "이미 이 매물에 대한 활성 열람권이 있습니다." } },
        { status: 400 }
      );
    }

    const plan = VIEWER_PLANS.SINGLE;
    const amount = plan.price;
    const orderName = `${listing.title} - 건별 열람`;
    const orderId = `SINGLE_${session.user.id}_${listingId}_${Date.now()}`;

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        orderId,
        amount: BigInt(amount),
        paymentType: "SINGLE_PURCHASE",
        paymentStatus: "PENDING",
        tossOrderName: orderName,
        metadata: { listingId },
      },
    });

    return Response.json({ data: { orderId, amount, orderName } });
  } catch (error) {
    return errorToResponse(error);
  }
}
