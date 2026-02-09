import { prisma } from "@/lib/prisma";
import { calculateSettlements } from "./calculator";
import { sendEmail } from "@/lib/ses/send";
import { settlementReportEmail } from "@/lib/ses/templates";
import { formatKRW, formatDateKR } from "@/lib/utils/format";

/**
 * Process settlements for the previous day
 */
export async function processSettlements(date?: Date) {
  const targetDate = date ?? new Date();
  const periodStart = new Date(targetDate);
  periodStart.setDate(periodStart.getDate() - 1);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setDate(periodEnd.getDate() + 1);

  const settlements = await calculateSettlements(periodStart, periodEnd);

  for (const settlement of settlements) {
    // Create settlement record
    const record = await prisma.settlement.create({
      data: {
        sellerId: settlement.sellerId,
        periodStart,
        periodEnd,
        totalAmount: settlement.totalAmount,
        feeAmount: settlement.feeAmount,
        netAmount: settlement.netAmount,
        status: "COMPLETED",
        processedAt: new Date(),
      },
    });

    // Link payments to settlement
    await prisma.payment.updateMany({
      where: { id: { in: settlement.paymentIds } },
      data: { settlementId: record.id },
    });

    // Send email to seller
    const seller = await prisma.user.findUnique({
      where: { id: settlement.sellerId },
      select: { name: true, email: true },
    });

    if (seller?.email) {
      const emailContent = settlementReportEmail({
        sellerName: seller.name ?? "판매자",
        periodStart: formatDateKR(periodStart),
        periodEnd: formatDateKR(periodEnd),
        totalAmount: formatKRW(settlement.totalAmount),
        feeAmount: formatKRW(settlement.feeAmount),
        netAmount: formatKRW(settlement.netAmount),
      });

      await sendEmail({
        to: seller.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      await prisma.settlement.update({
        where: { id: record.id },
        data: { emailSentAt: new Date() },
      });
    }
  }

  return settlements.length;
}
