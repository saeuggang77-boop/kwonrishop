import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const errors: string[] = [];
  const steps: string[] = [];

  try {
    // Step 1: auth
    steps.push("1. calling auth()...");
    let session: { user?: { id?: string } } | null = null;
    try {
      session = await auth();
      steps.push(`1. auth OK: user=${session?.user?.id ?? "null"}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`auth() failed: ${msg}`);
      steps.push(`1. auth FAILED: ${msg}`);
    }

    // Step 2: listing query
    steps.push("2. querying listing...");
    const id = "seed-강남구-cafe_bakery";
    const listingData = await prisma.listing.findUnique({ where: { id } });
    if (!listingData) {
      errors.push("listing not found");
      return NextResponse.json({ errors, steps });
    }
    steps.push(
      `2. listing OK: ${listingData.title}, likeCount=${listingData.likeCount}`,
    );

    // Step 3: BigInt check
    steps.push(
      `3. price type: ${typeof listingData.price}, value: ${String(listingData.price)}`,
    );
    steps.push(
      `3. monthlyRent type: ${typeof listingData.monthlyRent}, value: ${String(listingData.monthlyRent)}`,
    );

    // Step 4: parallel queries
    steps.push("4. running parallel queries...");
    const [images, seller, marketPrice] = await Promise.all([
      prisma.listingImage.findMany({
        where: { listingId: id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.user.findUnique({
        where: { id: listingData.sellerId },
        select: { id: true, name: true, image: true, isTrustedSeller: true },
      }),
      prisma.marketPrice.findFirst({
        where: {
          subRegion: listingData.district,
          businessType: listingData.businessCategory,
        },
      }),
    ]);
    steps.push(
      `4. images=${images.length}, seller=${seller?.name}, marketPrice=${marketPrice ? "found" : "null"}`,
    );

    // Step 5: listingLike query
    steps.push("5. querying listingLike...");
    try {
      if (session?.user?.id) {
        const like = await prisma.listingLike.findUnique({
          where: {
            listingId_userId: { listingId: id, userId: session.user.id },
          },
        });
        steps.push(`5. listingLike OK: ${like ? "liked" : "not liked"}`);
      } else {
        steps.push("5. skipped (no user)");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`listingLike query failed: ${msg}`);
      steps.push(`5. listingLike FAILED: ${msg}`);
    }

    // Step 6: expert query
    steps.push("6. querying experts...");
    const experts = await prisma.expert.findMany({
      where: { isActive: true, region: listingData.city },
      orderBy: [
        { isVerified: "desc" },
        { rating: "desc" },
        { consultCount: "desc" },
      ],
      take: 3,
    });
    steps.push(`6. experts OK: ${experts.length}`);

    // Step 7: similar listings
    steps.push("7. querying similar listings...");
    const similar = await prisma.listing.findMany({
      where: {
        id: { not: id },
        status: "ACTIVE",
        OR: [
          { district: listingData.district },
          { businessCategory: listingData.businessCategory },
          { city: listingData.city },
        ],
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: { viewCount: "desc" },
      take: 6,
    });
    steps.push(`7. similar OK: ${similar.length}`);

    return NextResponse.json({
      errors,
      steps,
      success: errors.length === 0,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? (e.stack ?? e.message) : String(e);
    errors.push(`Uncaught: ${msg}`);
    return NextResponse.json({ errors, steps }, { status: 500 });
  }
}
