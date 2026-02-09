import { prisma } from "@/lib/prisma";
import type { FraudRuleType, FraudSeverity } from "@prisma/client";

export async function checkPriceSpike(
  listingId: string,
  params: Record<string, unknown>
): Promise<{
  ruleType: FraudRuleType;
  severity: FraudSeverity;
  details: Record<string, unknown>;
} | null> {
  const deviationPercent = (params.deviationPercent as number) ?? 50;
  const minComparables = (params.minComparables as number) ?? 3;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      price: true,
      city: true,
      district: true,
      rightsCategory: true,
      propertyType: true,
    },
  });

  if (!listing) return null;

  // Find comparable listings in same district with same rights category
  const comparables = await prisma.listing.findMany({
    where: {
      id: { not: listingId },
      city: listing.city,
      district: listing.district,
      rightsCategory: listing.rightsCategory,
      propertyType: listing.propertyType,
      status: "ACTIVE",
    },
    select: { price: true },
  });

  if (comparables.length < minComparables) return null;

  const prices = comparables.map((c) => Number(c.price));
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const listingPrice = Number(listing.price);
  const deviation = ((listingPrice - avgPrice) / avgPrice) * 100;

  if (Math.abs(deviation) <= deviationPercent) return null;

  return {
    ruleType: "PRICE_SPIKE",
    severity: deviation > 100 ? "CRITICAL" : "HIGH",
    details: {
      listingPrice,
      averagePrice: Math.round(avgPrice),
      deviationPercent: Math.round(deviation * 10) / 10,
      comparableCount: comparables.length,
      district: `${listing.city} ${listing.district}`,
    },
  };
}
