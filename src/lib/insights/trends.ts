import { prisma } from "@/lib/prisma";

interface TrendPoint {
  date: string;
  avgPrice: number;
  listingCount: number;
  viewCount: number;
}

interface TrendResult {
  district: string;
  period: string;
  trends: TrendPoint[];
  summary: {
    priceChange: number;
    supplyChange: number;
    demandChange: number;
  };
}

export async function getMarketTrends(params: {
  city: string;
  district: string;
  days?: number;
}): Promise<TrendResult> {
  const days = params.days ?? 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get active listings in district by day
  const listings = await prisma.listing.findMany({
    where: {
      city: params.city,
      district: params.district,
      status: { in: ["ACTIVE", "SOLD"] },
      createdAt: { gte: startDate },
    },
    select: { id: true, price: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const dayMap = new Map<string, { prices: number[]; views: number; count: number }>();

  for (const listing of listings) {
    const dayKey = listing.createdAt.toISOString().split("T")[0];
    const existing = dayMap.get(dayKey) ?? { prices: [], views: 0, count: 0 };
    existing.prices.push(Number(listing.price));
    existing.count++;
    dayMap.set(dayKey, existing);
  }

  const trends: TrendPoint[] = [];
  for (const [date, data] of dayMap) {
    const avgPrice =
      data.prices.length > 0
        ? Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length)
        : 0;
    trends.push({
      date,
      avgPrice,
      listingCount: data.count,
      viewCount: data.views,
    });
  }

  trends.sort((a, b) => a.date.localeCompare(b.date));

  // Calculate summary
  const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
  const secondHalf = trends.slice(Math.floor(trends.length / 2));

  const avgFirst = firstHalf.length > 0
    ? firstHalf.reduce((a, b) => a + b.avgPrice, 0) / firstHalf.length
    : 0;
  const avgSecond = secondHalf.length > 0
    ? secondHalf.reduce((a, b) => a + b.avgPrice, 0) / secondHalf.length
    : 0;

  const supplyFirst = firstHalf.reduce((a, b) => a + b.listingCount, 0);
  const supplySecond = secondHalf.reduce((a, b) => a + b.listingCount, 0);

  const demandFirst = firstHalf.reduce((a, b) => a + b.viewCount, 0);
  const demandSecond = secondHalf.reduce((a, b) => a + b.viewCount, 0);

  return {
    district: `${params.city} ${params.district}`,
    period: `${days}일`,
    trends,
    summary: {
      priceChange: avgFirst > 0 ? ((avgSecond - avgFirst) / avgFirst) * 100 : 0,
      supplyChange: supplyFirst > 0 ? ((supplySecond - supplyFirst) / supplyFirst) * 100 : 0,
      demandChange: demandFirst > 0 ? ((demandSecond - demandFirst) / demandFirst) * 100 : 0,
    },
  };
}
