import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get dashboard statistics
    const [
      totalUsers,
      activeListings,
      reservedListings,
      soldListings,
      expiredListings,
      deletedListings,
      pendingReports,
      totalRevenue,
      activePartners,
      totalFranchises,
      usersByRole,
      activeEquipment,
      totalEquipment,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.count({ where: { status: "RESERVED" } }),
      prisma.listing.count({ where: { status: "SOLD" } }),
      prisma.listing.count({ where: { status: "EXPIRED" } }),
      prisma.listing.count({ where: { status: "DELETED" } }),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.adPurchase.aggregate({
        _sum: { amount: true },
        where: { status: "PAID" },
      }),
      prisma.partnerService.count({ where: { status: "ACTIVE" } }),
      prisma.franchiseBrand.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      prisma.equipment.count({ where: { status: "ACTIVE" } }),
      prisma.equipment.count(),
    ]);

    // 시계열 데이터: 최근 30일
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [dailyRevenue, dailySignups, dailyListings, topCategories, topRegions] = await Promise.all([
      // 일별 매출 (결제 완료 기준)
      prisma.$queryRaw<Array<{ date: string; total: bigint }>>`
        SELECT DATE("createdAt") as date, COALESCE(SUM(amount), 0) as total
        FROM "AdPurchase"
        WHERE status = 'PAID' AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      // 일별 가입자
      prisma.$queryRaw<Array<{ date: string; total: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*) as total
        FROM "User"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      // 일별 매물 등록
      prisma.$queryRaw<Array<{ date: string; total: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*) as total
        FROM "Listing"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      // 인기 업종 TOP 5
      prisma.listing.groupBy({
        by: ['categoryId'],
        where: { status: 'ACTIVE', categoryId: { not: null } },
        _count: true,
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5,
      }),
      // 인기 지역 TOP 5 (시/구 기준)
      prisma.$queryRaw<Array<{ region: string; count: bigint }>>`
        SELECT
          SUBSTRING("addressRoad" FROM '^[^ ]+ [^ ]+') as region,
          COUNT(*) as count
        FROM "Listing"
        WHERE status = 'ACTIVE' AND "addressRoad" IS NOT NULL AND "addressRoad" != ''
        GROUP BY region
        ORDER BY count DESC
        LIMIT 5
      `,
    ]);

    // BigInt → Number 변환 + 날짜 포맷
    const formatTimeSeries = (raw: Array<{ date: string; total: bigint }>) =>
      raw.map((r) => ({
        date: new Date(r.date).toISOString().slice(0, 10),
        total: Number(r.total),
      }));

    // 인기 업종 데이터 처리 (categoryId → name)
    const categoryMap = await prisma.category.findMany({
      where: { id: { in: topCategories.map((c) => c.categoryId!).filter(Boolean) } },
      select: { id: true, name: true },
    });
    const categoryNameMap = Object.fromEntries(categoryMap.map((c) => [c.id, c.name]));

    const popularCategories = topCategories.map((c) => ({
      name: categoryNameMap[c.categoryId!] || "기타",
      count: c._count,
    }));

    // 인기 지역 데이터 처리
    const popularRegions = topRegions.map((r) => ({
      name: r.region || "미분류",
      count: Number(r.count),
    }));

    return NextResponse.json({
      totalUsers,
      activeListings,
      listings: {
        active: activeListings,
        reserved: reservedListings,
        sold: soldListings,
        expired: expiredListings,
        deleted: deletedListings,
      },
      pendingReports,
      totalRevenue: totalRevenue._sum?.amount || 0,
      activePartners,
      totalFranchises,
      usersByRole,
      equipment: {
        active: activeEquipment,
        total: totalEquipment,
      },
      timeSeries: {
        revenue: formatTimeSeries(dailyRevenue),
        signups: formatTimeSeries(dailySignups),
        listings: formatTimeSeries(dailyListings),
      },
      popularCategories,
      popularRegions,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
