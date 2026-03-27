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
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
