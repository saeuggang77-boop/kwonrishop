import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/cron-auth";

const RADII = [1, 3, 5]; // km

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        businessCategory: true,
        price: true,
      },
    });

    let updated = 0;

    for (const listing of listings) {
      if (!listing.latitude || !listing.longitude) continue;

      for (const radius of RADII) {
        const nearby = listings.filter((other) => {
          if (other.id === listing.id) return false;
          if (other.businessCategory !== listing.businessCategory) return false;
          if (!other.latitude || !other.longitude) return false;
          const dist = haversineDistance(
            listing.latitude!, listing.longitude!,
            other.latitude!, other.longitude!
          );
          return dist <= radius;
        });

        if (nearby.length === 0) continue;

        const prices = nearby.map((n) => Number(n.price)).sort((a, b) => a - b);
        const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        const median = prices.length % 2 === 0
          ? Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)
          : prices[Math.floor(prices.length / 2)];

        const listingPrice = Number(listing.price);
        const belowCount = prices.filter((p) => p <= listingPrice).length;
        const percentile = (belowCount / prices.length) * 100;

        await prisma.listingComparison.upsert({
          where: {
            listingId_radiusKm: { listingId: listing.id, radiusKm: radius },
          },
          create: {
            listingId: listing.id,
            radiusKm: radius,
            comparableCount: nearby.length,
            avgPremiumFee: BigInt(avg),
            medianPrice: BigInt(median),
            minPrice: BigInt(prices[0]),
            maxPrice: BigInt(prices[prices.length - 1]),
            pricePercentile: Math.round(percentile * 10) / 10,
            computedAt: new Date(),
          },
          update: {
            comparableCount: nearby.length,
            avgPremiumFee: BigInt(avg),
            medianPrice: BigInt(median),
            minPrice: BigInt(prices[0]),
            maxPrice: BigInt(prices[prices.length - 1]),
            pricePercentile: Math.round(percentile * 10) / 10,
            computedAt: new Date(),
          },
        });

        updated++;
      }
    }

    return Response.json({
      data: { success: true, listingsProcessed: listings.length, comparisonsUpdated: updated },
    });
  } catch (error) {
    console.error("Comparison collection CRON failed:", error);
    return Response.json({ error: "Collection failed" }, { status: 500 });
  }
}
