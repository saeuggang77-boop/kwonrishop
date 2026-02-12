import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { errorToResponse } from "@/lib/utils/errors";

// ─── GET: Return current user's subscription info ───

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { plan: true },
    });

    // If no subscription, return FREE tier info
    if (!subscription) {
      const freePlan = await prisma.subscriptionPlan.findUnique({
        where: { name: "FREE" },
      });

      return Response.json({
        data: {
          tier: "FREE",
          status: "ACTIVE",
          plan: freePlan ?? null,
          autoRenew: false,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          nextBillingDate: null,
        },
      });
    }

    const nextBillingDate =
      subscription.status === "ACTIVE" && subscription.autoRenew
        ? subscription.currentPeriodEnd
        : null;

    return Response.json({
      data: {
        tier: subscription.tier,
        status: subscription.status,
        plan: subscription.plan,
        autoRenew: subscription.autoRenew,
        paymentMethod: subscription.paymentMethod,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        cancelReason: subscription.cancelReason,
        nextBillingDate,
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}

// ─── POST: Create or upgrade subscription ───

const createSubscriptionBody = z.object({
  planName: z.enum(["PRO", "EXPERT"]),
  billingCycle: z.enum(["monthly", "yearly"]),
  paymentMethod: z.enum(["CARD", "TRANSFER"]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json(
        { error: { message: "인증이 필요합니다." } },
        { status: 401 },
      );
    }

    // Validate body
    const body = await req.json();
    createSubscriptionBody.parse(body);

    // For now, return 503 — actual payment integration later
    return Response.json(
      { error: { message: "결제 시스템 준비중입니다." } },
      { status: 503 },
    );
  } catch (error) {
    return errorToResponse(error);
  }
}
