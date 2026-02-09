import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { confirmPayment } from "@/lib/toss/confirm";
import { confirmPaymentSchema } from "@/lib/validators/payment";
import { errorToResponse } from "@/lib/utils/errors";
import { reportGenerationQueue } from "@/lib/queue";

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
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          tier: "PREMIUM",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

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
