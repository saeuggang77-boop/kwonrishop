import { prisma } from "@/lib/prisma";
import type { FraudRuleType, FraudSeverity } from "@prisma/client";

/**
 * Hamming distance between two hex hash strings
 */
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
    distance += xor.toString(2).split("1").length - 1;
  }
  return distance;
}

export async function checkDuplicatePhoto(
  listingId: string,
  params: Record<string, unknown>
): Promise<{
  ruleType: FraudRuleType;
  severity: FraudSeverity;
  details: Record<string, unknown>;
} | null> {
  const threshold = (params.hashThreshold as number) ?? 5;

  const listingImages = await prisma.listingImage.findMany({
    where: { listingId, perceptualHash: { not: null } },
    select: { id: true, perceptualHash: true },
  });

  if (listingImages.length === 0) return null;

  // Get all other listings' images with hashes
  const otherImages = await prisma.listingImage.findMany({
    where: {
      listingId: { not: listingId },
      perceptualHash: { not: null },
      listing: { status: { in: ["ACTIVE", "DRAFT"] } },
    },
    select: {
      id: true,
      perceptualHash: true,
      listingId: true,
    },
  });

  const matches: Array<{
    imageId: string;
    matchingImageId: string;
    matchingListingId: string;
    distance: number;
  }> = [];

  for (const img of listingImages) {
    for (const other of otherImages) {
      const distance = hammingDistance(
        img.perceptualHash!,
        other.perceptualHash!
      );
      if (distance <= threshold) {
        matches.push({
          imageId: img.id,
          matchingImageId: other.id,
          matchingListingId: other.listingId,
          distance,
        });
      }
    }
  }

  if (matches.length === 0) return null;

  return {
    ruleType: "DUPLICATE_PHOTO",
    severity: "HIGH",
    details: {
      matchCount: matches.length,
      matches: matches.slice(0, 5),
    },
  };
}
