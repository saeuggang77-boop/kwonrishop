import { prisma } from "@/lib/prisma";
import type { FraudRuleType, FraudSeverity } from "@prisma/client";

export async function checkMultiAccount(
  listingId: string,
  params: Record<string, unknown>
): Promise<{
  ruleType: FraudRuleType;
  severity: FraudSeverity;
  details: Record<string, unknown>;
} | null> {
  const maxAccountsPerPhone = (params.maxAccountsPerPhone as number) ?? 1;

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, contactPhone: true },
  });

  if (!listing || !listing.contactPhone) return null;

  // Find other users with the same contact phone on their listings
  const otherListingsWithSamePhone = await prisma.listing.findMany({
    where: {
      contactPhone: listing.contactPhone,
      sellerId: { not: listing.sellerId },
      status: { in: ["ACTIVE", "DRAFT", "PENDING_VERIFICATION"] },
    },
    select: {
      id: true,
      sellerId: true,
      seller: { select: { email: true, name: true } },
    },
    distinct: ["sellerId"],
  });

  if (otherListingsWithSamePhone.length <= maxAccountsPerPhone - 1) return null;

  // Also check user phone field
  const usersWithSamePhone = await prisma.user.findMany({
    where: {
      phone: listing.contactPhone,
      id: { not: listing.sellerId },
    },
    select: { id: true, email: true },
  });

  const totalDuplicateAccounts =
    otherListingsWithSamePhone.length + usersWithSamePhone.length;

  if (totalDuplicateAccounts === 0) return null;

  return {
    ruleType: "MULTI_ACCOUNT_CONTACT",
    severity: totalDuplicateAccounts >= 3 ? "CRITICAL" : "MEDIUM",
    details: {
      contactPhone: listing.contactPhone,
      duplicateListingAccounts: otherListingsWithSamePhone.map((l) => ({
        listingId: l.id,
        sellerId: l.sellerId,
      })),
      duplicateUserAccounts: usersWithSamePhone.map((u) => u.id),
      totalDuplicates: totalDuplicateAccounts,
    },
  };
}
