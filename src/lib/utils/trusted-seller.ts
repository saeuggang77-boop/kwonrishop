import { prisma } from "@/lib/prisma";

/**
 * 안심거래 배지 자동 부여/해제
 * 조건: safetyGrade === "A" AND hasDiagnosisBadge === true
 * 매물의 seller에 대해 해당 매물 기준으로 판단합니다.
 */
export async function updateTrustedSellerStatus(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true, safetyGrade: true, hasDiagnosisBadge: true },
  });

  if (!listing) return;

  const isTrusted =
    listing.safetyGrade === "A" && listing.hasDiagnosisBadge === true;

  await prisma.user.update({
    where: { id: listing.sellerId },
    data: { isTrustedSeller: isTrusted },
  });
}
