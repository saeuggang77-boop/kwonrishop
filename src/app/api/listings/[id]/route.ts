import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateListingSchema } from "@/lib/validators/listing";
import { errorToResponse, NotFoundError, ForbiddenError } from "@/lib/utils/errors";
import { m2ToPyeong } from "@/lib/utils/area";

function serializeListing(listing: Record<string, unknown>) {
  return {
    ...listing,
    price: listing.price?.toString(),
    monthlyRent: (listing.monthlyRent as bigint | null)?.toString() ?? null,
    managementFee: (listing.managementFee as bigint | null)?.toString() ?? null,
    premiumFee: (listing.premiumFee as bigint | null)?.toString() ?? null,
    monthlyRevenue: (listing.monthlyRevenue as bigint | null)?.toString() ?? null,
    monthlyProfit: (listing.monthlyProfit as bigint | null)?.toString() ?? null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        title: true,
        description: true,
        transferReason: true,
        businessCategory: true,
        storeType: true,
        businessSubtype: true,
        price: true,
        monthlyRent: true,
        managementFee: true,
        premiumFee: true,
        goodwillPremium: true,
        goodwillPremiumDesc: true,
        facilityPremium: true,
        facilityPremiumDesc: true,
        floorPremium: true,
        floorPremiumDesc: true,
        monthlyRevenue: true,
        monthlyProfit: true,
        operatingYears: true,
        address: true,
        addressDetail: true,
        city: true,
        district: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
        areaM2: true,
        areaPyeong: true,
        floor: true,
        totalFloors: true,
        unit: true,
        status: true,
        safetyGrade: true,
        safetyComment: true,
        isPremium: true,
        premiumRank: true,
        hasDiagnosisBadge: true,
        viewCount: true,
        inquiryCount: true,
        likeCount: true,
        contactPhone: true,
        contactEmail: true,
        isPhonePublic: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        expiresAt: true,
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, url: true, thumbnailUrl: true, sortOrder: true, isPrimary: true },
        },
        seller: { select: { id: true, name: true, image: true, businessName: true, isTrustedSeller: true } },
        comparisons: {
          select: {
            id: true, radiusKm: true, comparableCount: true,
            avgPremiumFee: true, avgRentPrice: true, avgSalePrice: true,
            medianPrice: true, pricePercentile: true, computedAt: true,
          },
        },
      },
    });

    if (!listing) throw new NotFoundError("매물을 찾을 수 없습니다.");

    // Fire-and-forget: view count + event tracking (don't block response)
    const session = await auth();
    Promise.all([
      prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
      prisma.event.create({
        data: {
          userId: session?.user?.id,
          listingId: id,
          eventType: "VIEW_LISTING",
          ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0],
          userAgent: req.headers.get("user-agent"),
        },
      }),
    ]).catch(() => {});

    return new Response(
      JSON.stringify({ data: serializeListing(listing as unknown as Record<string, unknown>) }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
        },
      },
    );
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!listing) throw new NotFoundError("매물을 찾을 수 없습니다.");
    if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      throw new ForbiddenError("본인의 매물만 수정할 수 있습니다.");
    }

    const body = await req.json();
    const parsed = updateListingSchema.parse(body);

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...parsed,
        price: parsed.price ? BigInt(parsed.price) : undefined,
        monthlyRent: parsed.monthlyRent !== undefined ? (parsed.monthlyRent ? BigInt(parsed.monthlyRent) : null) : undefined,
        managementFee: parsed.managementFee !== undefined ? (parsed.managementFee ? BigInt(parsed.managementFee) : null) : undefined,
        premiumFee: parsed.premiumFee !== undefined ? (parsed.premiumFee ? BigInt(parsed.premiumFee) : null) : undefined,
        monthlyRevenue: parsed.monthlyRevenue !== undefined ? (parsed.monthlyRevenue ? BigInt(parsed.monthlyRevenue) : null) : undefined,
        monthlyProfit: parsed.monthlyProfit !== undefined ? (parsed.monthlyProfit ? BigInt(parsed.monthlyProfit) : null) : undefined,
        businessSubtype: parsed.businessSubtype !== undefined ? parsed.businessSubtype : undefined,
        operatingYears: parsed.operatingYears !== undefined ? parsed.operatingYears : undefined,
        areaPyeong: parsed.areaM2 ? m2ToPyeong(parsed.areaM2) : undefined,
      },
    });

    return Response.json({ data: serializeListing(updated as unknown as Record<string, unknown>) });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: { message: "인증이 필요합니다." } }, { status: 401 });
    }

    const { id } = await params;
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!listing) throw new NotFoundError("매물을 찾을 수 없습니다.");
    if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      throw new ForbiddenError("본인의 매물만 삭제할 수 있습니다.");
    }

    await prisma.listing.update({
      where: { id },
      data: { status: "DELETED" },
    });

    return Response.json({ data: { success: true } });
  } catch (error) {
    return errorToResponse(error);
  }
}
