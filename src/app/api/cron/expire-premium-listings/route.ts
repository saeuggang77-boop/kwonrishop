import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const now = new Date();

    // 1) Find ACTIVE premium listings whose endDate has passed
    const expiredPremiums = await prisma.premiumListing.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: now },
      },
      select: { id: true, listingId: true },
    });

    if (expiredPremiums.length === 0) {
      return Response.json({
        data: { success: true, expiredCount: 0, listingsUpdated: 0 },
      });
    }

    const premiumIds = expiredPremiums.map((p) => p.id);
    const listingIds = [...new Set(expiredPremiums.map((p) => p.listingId))];

    // 2) Mark premium listings as EXPIRED & reset listings in a transaction
    const [expiredResult, listingsResult] = await prisma.$transaction([
      prisma.premiumListing.updateMany({
        where: { id: { in: premiumIds } },
        data: { status: "EXPIRED" },
      }),
      prisma.listing.updateMany({
        where: { id: { in: listingIds } },
        data: { isPremium: false, premiumRank: 0 },
      }),
    ]);

    return Response.json({
      data: {
        success: true,
        expiredCount: expiredResult.count,
        listingsUpdated: listingsResult.count,
      },
    });
  } catch (error) {
    console.error("Premium listing expiration CRON failed:", error);
    return Response.json({ error: "Expiration failed" }, { status: 500 });
  }
}
