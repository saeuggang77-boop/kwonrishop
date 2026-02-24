import { prisma } from "@/lib/prisma";

/**
 * Notify users with matching WantedRequest when a new listing is published.
 * Matches: cities contains listing.city AND categories contains listing.categoryGroup
 */
export async function notifyWantedRequestUsers(listing: {
  id: string;
  city: string;
  district?: string;
  categoryGroup?: string;
  businessCategory?: string;
  title: string;
}) {
  try {
    const category = listing.categoryGroup || listing.businessCategory || "";

    // Find ACTIVE wanted requests matching city AND category
    const matchingRequests = await prisma.wantedRequest.findMany({
      where: {
        status: "ACTIVE",
        cities: { has: listing.city },
        categories: { hasSome: category ? [category] : [] },
      },
      select: { id: true, userId: true },
    });

    if (matchingRequests.length === 0) {
      return { sent: 0 };
    }

    // Create notifications for matching users
    const notifications = matchingRequests.map((req) => ({
      userId: req.userId,
      title: "점포 의뢰 매칭 알림",
      message: `의뢰 조건에 맞는 새 매물이 등록되었습니다: ${listing.title}`,
      link: `/listings/${listing.id}`,
      sourceType: "wanted_match",
      sourceId: listing.id,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    // Increment matchCount for each matched request
    await prisma.wantedRequest.updateMany({
      where: { id: { in: matchingRequests.map((r) => r.id) } },
      data: { matchCount: { increment: 1 } },
    });

    return { sent: notifications.length };
  } catch (error) {
    console.error("Wanted notification error:", error);
    return { sent: 0, error: "WantedRequest notification failed" };
  }
}
