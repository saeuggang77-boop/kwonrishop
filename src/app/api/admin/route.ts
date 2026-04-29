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

    // KST 기준 자정 시각을 UTC Date 객체로 환산 (daysOffset: 0=오늘, -1=어제 자정...)
    const kstMidnightUtc = (daysOffset: number) => {
      const nowUtc = new Date();
      const kstNow = new Date(nowUtc.getTime() + 9 * 60 * 60 * 1000);
      const kstMidnight = Date.UTC(
        kstNow.getUTCFullYear(),
        kstNow.getUTCMonth(),
        kstNow.getUTCDate() + daysOffset,
      );
      return new Date(kstMidnight - 9 * 60 * 60 * 1000);
    };
    const todayStart = kstMidnightUtc(0);
    const yesterdayStart = kstMidnightUtc(-1);
    const last7Start = kstMidnightUtc(-6); // 오늘 포함 7일
    const last30Start = kstMidnightUtc(-29); // 오늘 포함 30일

    const [
      dailyRevenue,
      dailySignups,
      dailyListings,
      topCategories,
      topRegions,
      signupBuckets,
      verificationFunnel,
    ] = await Promise.all([
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
      // 신규 가입 통계 (역할별, 기간별)
      prisma.$queryRaw<Array<{
        role: string;
        today: bigint;
        yesterday: bigint;
        last7days: bigint;
        last30days: bigint;
        total: bigint;
      }>>`
        SELECT
          role,
          COUNT(*) FILTER (WHERE "createdAt" >= ${todayStart}) AS today,
          COUNT(*) FILTER (WHERE "createdAt" >= ${yesterdayStart} AND "createdAt" < ${todayStart}) AS yesterday,
          COUNT(*) FILTER (WHERE "createdAt" >= ${last7Start}) AS last7days,
          COUNT(*) FILTER (WHERE "createdAt" >= ${last30Start}) AS last30days,
          COUNT(*) AS total
        FROM "User"
        WHERE role != 'ADMIN'
          AND email NOT LIKE '%@banned.local'
          AND email NOT LIKE '%@withdrawn.local'
        GROUP BY role
      `,
      // 사업자인증 진행률 (사장님/프랜차이즈/협력업체)
      prisma.$queryRaw<Array<{ role: string; total: bigint; verified: bigint }>>`
        SELECT
          u.role,
          COUNT(*) AS total,
          COUNT(bv.id) FILTER (WHERE bv.verified = true) AS verified
        FROM "User" u
        LEFT JOIN "BusinessVerification" bv ON bv."userId" = u.id
        WHERE u.role IN ('SELLER', 'FRANCHISE', 'PARTNER')
          AND u.email NOT LIKE '%@banned.local'
          AND u.email NOT LIKE '%@withdrawn.local'
        GROUP BY u.role
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

    // 신규 가입 통계 정리 (누락 역할은 0으로 채움)
    const SIGNUP_ROLES = ["BUYER", "SELLER", "FRANCHISE", "PARTNER"] as const;
    const VERIFY_ROLES = ["SELLER", "FRANCHISE", "PARTNER"] as const;
    const bucketByRole = Object.fromEntries(signupBuckets.map((b) => [b.role, b]));
    const signupByRole = SIGNUP_ROLES.map((role) => {
      const b = bucketByRole[role];
      return {
        role,
        today: b ? Number(b.today) : 0,
        yesterday: b ? Number(b.yesterday) : 0,
        last7days: b ? Number(b.last7days) : 0,
        last30days: b ? Number(b.last30days) : 0,
        total: b ? Number(b.total) : 0,
      };
    });
    const signupTotals = signupByRole.reduce(
      (acc, r) => {
        acc.today += r.today;
        acc.yesterday += r.yesterday;
        acc.last7days += r.last7days;
        acc.last30days += r.last30days;
        return acc;
      },
      { today: 0, yesterday: 0, last7days: 0, last30days: 0 },
    );
    const verifyByRole = Object.fromEntries(verificationFunnel.map((v) => [v.role, v]));
    const verificationStats = VERIFY_ROLES.map((role) => {
      const v = verifyByRole[role];
      return {
        role,
        total: v ? Number(v.total) : 0,
        verified: v ? Number(v.verified) : 0,
      };
    });

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
      signupStats: {
        totals: signupTotals,
        byRole: signupByRole,
        verification: verificationStats,
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
