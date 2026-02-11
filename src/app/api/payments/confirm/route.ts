import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { confirmPayment } from "@/lib/toss/confirm";
import { confirmPaymentSchema } from "@/lib/validators/payment";
import { errorToResponse } from "@/lib/utils/errors";
import { reportGenerationQueue } from "@/lib/queue";
import { createNotification } from "@/lib/notifications/create";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const body = await req.json();
    const { paymentKey, orderId, amount } = confirmPaymentSchema.parse(body);

    // Verify payment exists and matches
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return Response.json({ error: { message: "결제 정보를 찾을 수 없습니다." } }, { status: 404 });
    }

    if (Number(payment.amount) !== amount) {
      return Response.json({ error: { message: "결제 금액이 일치하지 않습니다." } }, { status: 400 });
    }

    // Confirm with TossPayments
    const tossResult = await confirmPayment({ paymentKey, orderId, amount });

    // Update payment record
    await prisma.payment.update({
      where: { orderId },
      data: {
        tossPaymentKey: paymentKey,
        paymentStatus: "APPROVED",
        method: tossResult.method,
        cardCompany: tossResult.card?.company,
        cardNumber: tossResult.card?.number,
        receiptUrl: tossResult.receipt?.url ?? tossResult.card?.receiptUrl,
        paidAt: new Date(tossResult.approvedAt),
      },
    });

    // Post-payment actions
    if (payment.paymentType === "DEEP_REPORT") {
      // Create report and enqueue generation
      const report = await prisma.report.findFirst({
        where: { paymentId: payment.id },
      });

      if (report) {
        await reportGenerationQueue.add("generate", { reportId: report.id });
      }
    }

    if (payment.paymentType === "PREMIUM_SUBSCRIPTION") {
      // Activate subscription
      const meta = payment.metadata as Record<string, string> | null;
      const tier = meta?.tier ?? "PREMIUM";
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          tier: tier as "BASIC" | "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          tier: tier as "BASIC" | "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    if (payment.paymentType === "ADVERTISEMENT" || payment.paymentType === "FEATURED_LISTING") {
      const meta = payment.metadata as Record<string, string> | null;
      const listingId = meta?.listingId;
      const adTier = meta?.tier ?? "BASIC";

      if (listingId) {
        // Find or create PremiumPlan
        const plan = await prisma.premiumPlan.findUnique({
          where: { name: adTier as "BASIC" | "PREMIUM" | "VIP" },
        });

        if (plan) {
          const now = new Date();
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() + plan.durationDays);

          await prisma.premiumListing.create({
            data: {
              listingId,
              planId: plan.id,
              status: "ACTIVE",
              startDate: now,
              endDate,
              paymentMethod: "CARD",
              paymentStatus: "PAID",
            },
          });

          const tierRankMap: Record<string, number> = { BASIC: 1, PREMIUM: 2, VIP: 3 };
          await prisma.listing.update({
            where: { id: listingId },
            data: {
              isPremium: true,
              premiumRank: tierRankMap[adTier] ?? 1,
            },
          });
        }
      }
    }

    // Notify user
    await createNotification({
      userId: session.user.id,
      title: "결제가 완료되었습니다",
      message: `${payment.tossOrderName ?? payment.paymentType} 결제가 성공적으로 완료되었습니다.`,
      link: "/profile",
      sourceType: "PAYMENT",
      sourceId: payment.id,
    });

    // Track event
    await prisma.event.create({
      data: {
        userId: session.user.id,
        eventType: "PAYMENT_COMPLETED",
        metadata: { paymentType: payment.paymentType, amount },
      },
    });

    return Response.json({ data: { success: true, orderId } });
  } catch (error) {
    return errorToResponse(error);
  }
}
