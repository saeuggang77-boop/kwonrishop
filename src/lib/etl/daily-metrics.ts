import { prisma } from "@/lib/prisma";

/**
 * Aggregate events from the previous day into daily_listing_metrics
 */
export async function aggregateDailyListingMetrics(date?: Date) {
  const targetDate = date ?? new Date(Date.now() - 86_400_000);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const events = await prisma.event.groupBy({
    by: ["listingId", "eventType"],
    where: {
      listingId: { not: null },
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
    _count: { id: true },
  });

  const metricsMap = new Map<
    string,
    { views: number; ctaClicks: number; inquiries: number }
  >();

  for (const event of events) {
    if (!event.listingId) continue;
    const existing = metricsMap.get(event.listingId) ?? {
      views: 0,
      ctaClicks: 0,
      inquiries: 0,
    };

    switch (event.eventType) {
      case "VIEW_LISTING":
        existing.views += event._count.id;
        break;
      case "CLICK_CTA":
        existing.ctaClicks += event._count.id;
        break;
      case "INQUIRY_SENT":
        existing.inquiries += event._count.id;
        break;
    }

    metricsMap.set(event.listingId, existing);
  }

  for (const [listingId, metrics] of metricsMap) {
    await prisma.dailyListingMetric.upsert({
      where: {
        listingId_date: { listingId, date: startOfDay },
      },
      create: {
        listingId,
        date: startOfDay,
        viewCount: metrics.views,
        ctaClickCount: metrics.ctaClicks,
        inquiryCount: metrics.inquiries,
      },
      update: {
        viewCount: metrics.views,
        ctaClickCount: metrics.ctaClicks,
        inquiryCount: metrics.inquiries,
      },
    });
  }

  return metricsMap.size;
}
