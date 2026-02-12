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
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        seller: { select: { id: true, name: true, image: true, businessName: true, isTrustedSeller: true } },
        comparisons: true,
      },
    });

    if (!listing) throw new NotFoundError("매물을 찾을 수 없습니다.");

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Track event
    const session = await auth();
    await prisma.event.create({
      data: {
        userId: session?.user?.id,
        listingId: id,
        eventType: "VIEW_LISTING",
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0],
        userAgent: req.headers.get("user-agent"),
      },
    });

    return Response.json({ data: serializeListing(listing as unknown as Record<string, unknown>) });
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
