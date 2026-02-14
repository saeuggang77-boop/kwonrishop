import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatKRW } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const errors: string[] = [];
  const steps: string[] = [];

  try {
    // Step 1: auth
    let session: { user?: { id?: string } } | null = null;
    try {
      session = await auth();
      steps.push(`auth OK: user=${session?.user?.id ?? "null"}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`auth() failed: ${msg}`);
    }

    // Step 2: listing
    const id = "seed-강남구-cafe_bakery";
    const listingData = await prisma.listing.findUnique({ where: { id } });
    if (!listingData) {
      return NextResponse.json({ errors: ["listing not found"], steps });
    }
    steps.push(`listing OK: likeCount=${listingData.likeCount}`);

    // Step 3: Check ALL field types
    const fieldTypes: Record<string, string> = {};
    for (const [key, value] of Object.entries(listingData)) {
      if (typeof value === "bigint") {
        fieldTypes[key] = `bigint(${String(value)})`;
      }
    }
    steps.push(`BigInt fields: ${JSON.stringify(fieldTypes)}`);

    // Step 4: Test Number conversion
    const listing = {
      ...listingData,
      price: Number(listingData.price),
      monthlyRent: listingData.monthlyRent ? Number(listingData.monthlyRent) : null,
      premiumFee: listingData.premiumFee ? Number(listingData.premiumFee) : null,
      managementFee: listingData.managementFee ? Number(listingData.managementFee) : null,
      monthlyRevenue: listingData.monthlyRevenue ? Number(listingData.monthlyRevenue) : null,
      monthlyProfit: listingData.monthlyProfit ? Number(listingData.monthlyProfit) : null,
    };

    // Check if any BigInt remains after conversion
    const remainingBigInt: string[] = [];
    for (const [key, value] of Object.entries(listing)) {
      if (typeof value === "bigint") {
        remainingBigInt.push(key);
      }
    }
    steps.push(`Remaining BigInt after conversion: ${remainingBigInt.length > 0 ? remainingBigInt.join(", ") : "none"}`);

    // Step 5: Test formatKRW with BigInt
    try {
      const formatted = formatKRW(listingData.price);
      steps.push(`formatKRW(BigInt price) OK: ${formatted}`);
    } catch (e: unknown) {
      errors.push(`formatKRW BigInt failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Step 6: parallel queries
    const [images, seller, marketPrice, experts, similar] = await Promise.all([
      prisma.listingImage.findMany({ where: { listingId: id }, orderBy: { sortOrder: "asc" } }),
      prisma.user.findUnique({ where: { id: listingData.sellerId }, select: { id: true, name: true, image: true, isTrustedSeller: true } }),
      prisma.marketPrice.findFirst({ where: { subRegion: listingData.district, businessType: listingData.businessCategory } }),
      prisma.expert.findMany({ where: { isActive: true, region: listingData.city }, orderBy: [{ isVerified: "desc" }, { rating: "desc" }], take: 3 }),
      prisma.listing.findMany({
        where: { id: { not: id }, status: "ACTIVE", OR: [{ district: listingData.district }, { businessCategory: listingData.businessCategory }] },
        include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
        orderBy: { viewCount: "desc" },
        take: 6,
      }),
    ]);
    steps.push(`queries OK: images=${images.length}, seller=${seller?.name}, market=${!!marketPrice}, experts=${experts.length}, similar=${similar.length}`);

    // Step 7: Check marketPrice BigInt fields
    if (marketPrice) {
      const mpBigInt: Record<string, string> = {};
      for (const [key, value] of Object.entries(marketPrice)) {
        if (typeof value === "bigint") {
          mpBigInt[key] = `bigint(${String(value)})`;
        }
      }
      steps.push(`marketPrice BigInt fields: ${JSON.stringify(mpBigInt)}`);
    }

    // Step 8: Check similarListings BigInt
    if (similar.length > 0) {
      const slBigInt: string[] = [];
      for (const [key, value] of Object.entries(similar[0])) {
        if (typeof value === "bigint") slBigInt.push(key);
      }
      steps.push(`similar[0] BigInt fields: ${slBigInt.join(", ")}`);
    }

    // Step 9: Test JSON serialization (this is what RSC does)
    try {
      // This will fail if BigInt is present
      JSON.stringify(listing);
      steps.push("JSON.stringify(listing) OK");
    } catch (e: unknown) {
      errors.push(`JSON.stringify(listing) FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Step 10: Test JSON serialization of similar listings
    try {
      JSON.stringify(similar);
      steps.push("JSON.stringify(similar) OK");
    } catch (e: unknown) {
      errors.push(`JSON.stringify(similar) FAILED: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Step 11: Test JSON serialization of marketPrice
    if (marketPrice) {
      try {
        JSON.stringify(marketPrice);
        steps.push("JSON.stringify(marketPrice) OK");
      } catch (e: unknown) {
        errors.push(`JSON.stringify(marketPrice) FAILED: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return NextResponse.json({ errors, steps, success: errors.length === 0 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? (e.stack ?? e.message) : String(e);
    errors.push(`Uncaught: ${msg}`);
    return NextResponse.json({ errors, steps }, { status: 500 });
  }
}
