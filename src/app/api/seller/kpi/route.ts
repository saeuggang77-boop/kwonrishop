import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const sellerId = session.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

    const [
      activeListings,
      totalViews7d,
      totalViews30d,
      totalInquiries7d,
      totalInquiries30d,
      recentMetrics,
    ] = await Promise.all([
      prisma.listing.count({
        where: { sellerId, status: "ACTIVE" },
      }),
      prisma.dailySellerMetric.aggregate({
        where: { sellerId, date: { gte: sevenDaysAgo } },
        _sum: { totalViews: true },
      }),
      prisma.dailySellerMetric.aggregate({
        where: { sellerId, date: { gte: thirtyDaysAgo } },
        _sum: { totalViews: true },
      }),
      prisma.dailySellerMetric.aggregate({
        where: { sellerId, date: { gte: sevenDaysAgo } },
        _sum: { totalInquiries: true },
      }),
      prisma.dailySellerMetric.aggregate({
        where: { sellerId, date: { gte: thirtyDaysAgo } },
        _sum: { totalInquiries: true },
      }),
      prisma.dailySellerMetric.findMany({
        where: { sellerId, date: { gte: thirtyDaysAgo } },
        orderBy: { date: "asc" },
      }),
    ]);

    const views7d = totalViews7d._sum.totalViews ?? 0;
    const views30d = totalViews30d._sum.totalViews ?? 0;
    const inquiries7d = totalInquiries7d._sum.totalInquiries ?? 0;
    const inquiries30d = totalInquiries30d._sum.totalInquiries ?? 0;

    return Response.json({
      data: {
        activeListings,
        views: { last7d: views7d, last30d: views30d },
        inquiries: { last7d: inquiries7d, last30d: inquiries30d },
        conversionRate: views30d > 0 ? (inquiries30d / views30d) * 100 : 0,
        dailyMetrics: recentMetrics,
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
