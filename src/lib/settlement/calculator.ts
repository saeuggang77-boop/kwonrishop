import { prisma } from "@/lib/prisma";

const PLATFORM_FEE_RATE = 0.1; // 10%

interface SellerSettlement {
  sellerId: string;
  totalAmount: bigint;
  feeAmount: bigint;
  netAmount: bigint;
  paymentIds: string[];
}

/**
 * Calculate settlements for a given period
 */
export async function calculateSettlements(
  periodStart: Date,
  periodEnd: Date
): Promise<SellerSettlement[]> {
  // Get all approved payments in the period that haven't been settled
  const payments = await prisma.payment.findMany({
    where: {
      paymentStatus: "APPROVED",
      paidAt: { gte: periodStart, lt: periodEnd },
      settlementId: null,
    },
    include: {
      report: {
        include: {
          listing: { select: { sellerId: true } },
        },
      },
    },
  });

  // Group by seller
  const sellerPayments = new Map<string, { total: bigint; ids: string[] }>();

  for (const payment of payments) {
    // Determine seller: for reports, it's the listing's seller
    // For other payments, it might go to the platform
    let sellerId: string | null = null;

    if (payment.report?.listing?.sellerId) {
      sellerId = payment.report.listing.sellerId;
    }

    // Platform revenue (subscriptions, etc.) doesn't get settled to sellers
    if (!sellerId) continue;

    const existing = sellerPayments.get(sellerId) ?? {
      total: BigInt(0),
      ids: [],
    };
    existing.total += payment.amount;
    existing.ids.push(payment.id);
    sellerPayments.set(sellerId, existing);
  }

  const settlements: SellerSettlement[] = [];

  for (const [sellerId, data] of sellerPayments) {
    const feeAmount = BigInt(
      Math.floor(Number(data.total) * PLATFORM_FEE_RATE)
    );
    settlements.push({
      sellerId,
      totalAmount: data.total,
      feeAmount,
      netAmount: data.total - feeAmount,
      paymentIds: data.ids,
    });
  }

  return settlements;
}
