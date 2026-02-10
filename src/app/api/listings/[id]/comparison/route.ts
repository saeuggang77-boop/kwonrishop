import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorToResponse, NotFoundError } from "@/lib/utils/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, price: true, city: true, district: true },
    });

    if (!listing) throw new NotFoundError("매물을 찾을 수 없습니다.");

    const comparisons = await prisma.listingComparison.findMany({
      where: { listingId: id },
      orderBy: { radiusKm: "asc" },
    });

    return Response.json({
      data: {
        listingId: id,
        listingPrice: listing.price.toString(),
        location: `${listing.city} ${listing.district}`,
        comparisons: comparisons.map((c) => ({
          ...c,
          avgPremiumFee: c.avgPremiumFee?.toString() ?? null,
          avgRentPrice: c.avgRentPrice?.toString() ?? null,
          avgSalePrice: c.avgSalePrice?.toString() ?? null,
          medianPrice: c.medianPrice?.toString() ?? null,
          minPrice: c.minPrice?.toString() ?? null,
          maxPrice: c.maxPrice?.toString() ?? null,
        })),
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
