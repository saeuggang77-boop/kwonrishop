import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/create";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 1) Find ACTIVE premium listings whose endDate has passed
    const expiredPremiums = await prisma.premiumListing.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: now },
      },
      include: {
        listing: { select: { sellerId: true, title: true } },
      },
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

    // 3) Notify listing owners
    const notified = new Set<string>();
    for (const premium of expiredPremiums) {
      const key = `${premium.listing.sellerId}_${premium.listingId}`;
      if (notified.has(key)) continue;
      notified.add(key);

      await createNotification({
        userId: premium.listing.sellerId,
        title: "프리미엄 광고가 만료되었습니다",
        message: `"${premium.listing.title}" 매물의 프리미엄 광고 기간이 종료되었습니다. 재등록하시려면 광고 관리 페이지를 방문하세요.`,
        link: "/premium/listing-ad",
        sourceType: "PREMIUM_LISTING",
        sourceId: premium.id,
      });
    }

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
