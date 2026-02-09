import { prisma } from "@/lib/prisma";

/**
 * Aggregate daily listing metrics into daily seller metrics
 */
export async function aggregateDailySellerMetrics(date?: Date) {
  const targetDate = date ?? new Date(Date.now() - 86_400_000);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const listingMetrics = await prisma.dailyListingMetric.findMany({
    where: { date: startOfDay },
  });

  // Get listing → seller mapping
  const listingIds = listingMetrics.map((m) => m.listingId);
  const listings = await prisma.listing.findMany({
    where: { id: { in: listingIds } },
    select: { id: true, sellerId: true },
  });
  const listingSellerMap = new Map(listings.map((l) => [l.id, l.sellerId]));

  // Aggregate by seller
  const sellerMetrics = new Map<
    string,
    { views: number; inquiries: number; ctaClicks: number }
  >();

  for (const metric of listingMetrics) {
    const sellerId = listingSellerMap.get(metric.listingId);
    if (!sellerId) continue;

    const existing = sellerMetrics.get(sellerId) ?? {
      views: 0,
      inquiries: 0,
      ctaClicks: 0,
    };

    existing.views += metric.viewCount;
    existing.inquiries += metric.inquiryCount;
    existing.ctaClicks += metric.ctaClickCount;

    sellerMetrics.set(sellerId, existing);
  }

  for (const [sellerId, metrics] of sellerMetrics) {
    const activeListings = await prisma.listing.count({
      where: { sellerId, status: "ACTIVE" },
    });

    const newListings = await prisma.listing.count({
      where: {
        sellerId,
        createdAt: { gte: startOfDay },
      },
    });

    const conversionRate =
      metrics.views > 0 ? metrics.inquiries / metrics.views : null;

    await prisma.dailySellerMetric.upsert({
      where: {
        sellerId_date: { sellerId, date: startOfDay },
      },
      create: {
        sellerId,
        date: startOfDay,
        totalViews: metrics.views,
        totalInquiries: metrics.inquiries,
        totalCtaClicks: metrics.ctaClicks,
        conversionRate,
        activeListings,
        newListings,
      },
      update: {
        totalViews: metrics.views,
        totalInquiries: metrics.inquiries,
        totalCtaClicks: metrics.ctaClicks,
        conversionRate,
        activeListings,
        newListings,
      },
    });
  }

  return sellerMetrics.size;
}
