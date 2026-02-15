import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { errorToResponse } from "@/lib/utils/errors";

const cancelSubscriptionBody = z.object({
  cancelReason: z.string().max(500).optional(),
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

    const body = await req.json();
    const { cancelReason } = cancelSubscriptionBody.parse(body);

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return Response.json(
        { error: { message: "구독 정보를 찾을 수 없습니다." } },
        { status: 404 },
      );
    }

    if (subscription.status === "CANCELLED") {
      return Response.json(
        { error: { message: "이미 해지된 구독입니다." } },
        { status: 400 },
      );
    }

    if (subscription.tier === "FREE") {
      return Response.json(
        { error: { message: "무료 플랜은 해지할 수 없습니다." } },
        { status: 400 },
      );
    }

    // Cancel subscription but keep current period active
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: cancelReason ?? null,
        autoRenew: false,
      },
    });

    // Downgrade subscription tier
    if (subscription.tier === "PREMIUM") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionTier: "FREE",
        },
      });
    }

    return Response.json({
      data: {
        success: true,
        message: "구독이 해지되었습니다. 현재 결제 기간이 끝날 때까지 서비스를 이용하실 수 있습니다.",
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
