import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimitError = await rateLimitRequest(request, 60, 60000);
  if (rateLimitError) return rateLimitError;

  const { error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Active paid counts
    const [
      paidListings,
      paidEquipment,
      paidFranchise,
      paidPartners,
    ] = await Promise.all([
      prisma.listing.groupBy({
        by: ["tier"],
        where: { tier: { not: "FREE" }, tierExpiresAt: { gt: now } },
        _count: true,
      }),
      prisma.equipment.groupBy({
        by: ["tier"],
        where: { tier: { not: "FREE" }, tierExpiresAt: { gt: now } },
        _count: true,
      }),
      prisma.franchiseBrand.groupBy({
        by: ["tier"],
        where: { tier: { not: "FREE" }, tierExpiresAt: { gt: now } },
        _count: true,
      }),
      prisma.partnerService.groupBy({
        by: ["tier"],
        where: { tier: { not: "FREE" }, tierExpiresAt: { gt: now } },
        _count: true,
      }),
    ]);

    // Expiring within 7 days
    const [
      expiringListings,
      expiringEquipment,
      expiringFranchise,
      expiringPartners,
    ] = await Promise.all([
      prisma.listing.findMany({
        where: { tier: { not: "FREE" }, tierExpiresAt: { gt: now, lte: sevenDaysLater } },
        select: { id: true, storeName: true, tier: true, tierExpiresAt: true },
        orderBy: { tierExpiresAt: "asc" },
      }),
      prisma.equipment.findMany({
        where: { tier: { not: "FREE" }, tierExpiresAt: { gt: now, lte: sevenDaysLater } },
        select: { id: true, title: true, tier: true, tierExpiresAt: true },
        orderBy: { tierExpiresAt: "asc" },
      }),
      prisma.franchiseBrand.findMany({
        where: { tier: { not: "FREE" }, tierExpiresAt: { gt: now, lte: sevenDaysLater } },
        select: { id: true, brandName: true, tier: true, tierExpiresAt: true },
        orderBy: { tierExpiresAt: "asc" },
      }),
      prisma.partnerService.findMany({
        where: { tier: { not: "FREE" }, tierExpiresAt: { gt: now, lte: sevenDaysLater } },
        select: { id: true, companyName: true, tier: true, tierExpiresAt: true },
        orderBy: { tierExpiresAt: "asc" },
      }),
    ]);

    // Revenue stats: AdPurchase PAID
    const [
      totalPaid,
      last30Days,
      categoryBreakdown,
    ] = await Promise.all([
      prisma.adPurchase.aggregate({
        where: { status: "PAID" },
        _count: true,
        _sum: { amount: true },
      }),
      prisma.adPurchase.aggregate({
        where: { status: "PAID", createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
        _count: true,
      }),
      // breakdown by scope via product join
      prisma.adPurchase.findMany({
        where: { status: "PAID" },
        select: { amount: true, product: { select: { categoryScope: true } } },
      }),
    ]);

    // Aggregate category breakdown in JS
    const scopeMap: Record<string, { count: number; total: number }> = {};
    for (const p of categoryBreakdown) {
      const scope = p.product.categoryScope;
      if (!scopeMap[scope]) scopeMap[scope] = { count: 0, total: 0 };
      scopeMap[scope].count += 1;
      scopeMap[scope].total += p.amount;
    }

    // Top 10 users by paid service count
    const topUsersRaw = await prisma.adPurchase.groupBy({
      by: ["userId"],
      where: { status: "PAID" },
      _count: true,
      _sum: { amount: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    });

    const userIds = topUsersRaw.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, name: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const topUsers = topUsersRaw.map((u) => ({
      userId: u.userId,
      email: userMap[u.userId]?.email ?? "-",
      name: userMap[u.userId]?.name ?? "-",
      paidCount: u._count,
      totalAmount: u._sum.amount ?? 0,
    }));

    // Expiring items combined and sorted
    const expiringSoon = [
      ...expiringListings.map((l) => ({ type: "매물", name: l.storeName ?? "-", tier: l.tier, expiresAt: l.tierExpiresAt })),
      ...expiringEquipment.map((e) => ({ type: "집기", name: e.title, tier: e.tier, expiresAt: e.tierExpiresAt })),
      ...expiringFranchise.map((f) => ({ type: "프랜차이즈", name: f.brandName, tier: f.tier, expiresAt: f.tierExpiresAt })),
      ...expiringPartners.map((p) => ({ type: "협력업체", name: p.companyName, tier: p.tier, expiresAt: p.tierExpiresAt })),
    ].sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());

    return NextResponse.json({
      summary: {
        listings: { total: paidListings.reduce((s, r) => s + r._count, 0), breakdown: paidListings },
        equipment: { total: paidEquipment.reduce((s, r) => s + r._count, 0), breakdown: paidEquipment },
        franchise: { total: paidFranchise.reduce((s, r) => s + r._count, 0), breakdown: paidFranchise },
        partners: { total: paidPartners.reduce((s, r) => s + r._count, 0), breakdown: paidPartners },
      },
      expiringSoon,
      revenue: {
        totalCount: totalPaid._count,
        totalAmount: totalPaid._sum.amount ?? 0,
        last30DaysAmount: last30Days._sum.amount ?? 0,
        last30DaysCount: last30Days._count,
        byCategory: scopeMap,
      },
      topUsers,
    });
  } catch (err) {
    console.error("Error fetching paid stats:", err);
    return NextResponse.json({ error: "Failed to fetch paid stats" }, { status: 500 });
  }
}
