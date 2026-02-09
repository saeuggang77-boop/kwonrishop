import { prisma } from "@/lib/prisma";
import { buildReportMeta } from "@/lib/report/disclaimer";
import type { ReportMeta } from "@/types";

interface ValuationResult {
  estimatedValue: number;
  confidenceLow: number;
  confidenceHigh: number;
  pricePerM2: number | null;
  marketPosition: "below" | "average" | "above";
  comparableCount: number;
  meta: ReportMeta;
}

export async function valuateListing(
  listingId: string
): Promise<ValuationResult> {
  const listing = await prisma.listing.findUniqueOrThrow({
    where: { id: listingId },
    select: {
      price: true,
      areaM2: true,
      city: true,
      district: true,
      rightsCategory: true,
      propertyType: true,
    },
  });

  // Find comparables
  const comparables = await prisma.listing.findMany({
    where: {
      id: { not: listingId },
      city: listing.city,
      district: listing.district,
      rightsCategory: listing.rightsCategory,
      status: "ACTIVE",
    },
    select: { price: true, areaM2: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  const listingPrice = Number(listing.price);

  if (comparables.length === 0) {
    return {
      estimatedValue: listingPrice,
      confidenceLow: Math.round(listingPrice * 0.8),
      confidenceHigh: Math.round(listingPrice * 1.2),
      pricePerM2: listing.areaM2
        ? Math.round(listingPrice / listing.areaM2)
        : null,
      marketPosition: "average",
      comparableCount: 0,
      meta: buildReportMeta(),
    };
  }

  const prices = comparables.map((c) => Number(c.price));
  prices.sort((a, b) => a - b);

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const median =
    prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

  // Weighted estimate (60% median, 40% mean)
  const estimatedValue = Math.round(median * 0.6 + mean * 0.4);

  // Confidence interval (using IQR)
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q3 = prices[Math.floor(prices.length * 0.75)];
  const iqr = q3 - q1;

  const confidenceLow = Math.round(Math.max(q1 - iqr * 0.5, prices[0]));
  const confidenceHigh = Math.round(
    Math.min(q3 + iqr * 0.5, prices[prices.length - 1])
  );

  // Market position
  const deviation = (listingPrice - estimatedValue) / estimatedValue;
  let marketPosition: "below" | "average" | "above" = "average";
  if (deviation < -0.1) marketPosition = "below";
  else if (deviation > 0.1) marketPosition = "above";

  const pricePerM2 = listing.areaM2
    ? Math.round(listingPrice / listing.areaM2)
    : null;

  return {
    estimatedValue,
    confidenceLow,
    confidenceHigh,
    pricePerM2,
    marketPosition,
    comparableCount: comparables.length,
    meta: buildReportMeta(),
  };
}
