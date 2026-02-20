import { prisma } from "@/lib/prisma";

/**
 * Check if a user has access to revenue analysis data for a listing.
 *
 * Access is granted if ANY of the following is true:
 *  1. User has an active subscription (PRO or PREMIUM tier)
 *  2. User has a TRIAL subscription still within period
 *  3. User purchased single-listing access (within 7 days)
 *  4. User is the listing owner (seller)
 */
export async function canViewRevenueData(
  userId: string | undefined,
  listingId: string,
  sellerId?: string,  // NEW: pass pre-fetched sellerId to skip duplicate query
): Promise<boolean> {
  if (!userId) return false;

  try {
    // 4. Listing owner always has access
    if (sellerId) {
      if (sellerId === userId) return true;
    } else {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { sellerId: true },
      });
      if (listing?.sellerId === userId) return true;
    }

    // 1. Active subscription (PRO/PREMIUM)
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    if (
      subscription &&
      subscription.status === "ACTIVE" &&
      (subscription.tier === "PRO" || subscription.tier === "PREMIUM")
    ) {
      if (
        !subscription.currentPeriodEnd ||
        subscription.currentPeriodEnd > new Date()
      ) {
        return true;
      }
    }

    // 2. TRIAL subscription (within period)
    if (
      subscription &&
      subscription.status === "TRIAL" &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd > new Date()
    ) {
      return true;
    }

    // 3. Single purchase for this listing (not expired)
    const singlePurchase = await prisma.singlePurchase.findFirst({
      where: {
        userId,
        listingId,
        expiresAt: { gt: new Date() },
      },
    });
    if (singlePurchase) return true;

    return false;
  } catch (e) {
    console.error("[access-check] canViewRevenueData failed:", e);
    return false;
  }
}
