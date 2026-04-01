import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry") || "";
    const featured = searchParams.get("featured") === "true";
    const minTier = searchParams.get("minTier");
    const sort = searchParams.get("sort") || "stores";

    // Handle featured brands request
    if (featured) {
      // Tier hierarchy: BRONZE < SILVER < GOLD
      const FRANCHISE_TIERS = ["BRONZE", "SILVER", "GOLD"];
      const minIdx = minTier ? FRANCHISE_TIERS.indexOf(minTier) : 0;
      const allowedTiers = FRANCHISE_TIERS.slice(Math.max(0, minIdx));

      const featuredBrands = await prisma.franchiseBrand.findMany({
        where: {
          tier: {
            in: allowedTiers,
          } as any,
          tierExpiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          ftcId: true,
          brandName: true,
          companyName: true,
          businessNumber: true,
          industry: true,
          franchiseFee: true,
          educationFee: true,
          depositFee: true,
          royalty: true,
          totalStores: true,
          avgRevenue: true,
          description: true,
          tier: true,
          tierExpiresAt: true,
          managerId: true,
          logo: true,
          bannerImage: true,
          createdAt: true,
          updatedAt: true,
        },
        take: limit,
        orderBy: [
          { tier: "desc" },
          { totalStores: "desc" },
        ],
      });

      const transformed = featuredBrands;

      return NextResponse.json({ brands: transformed, featured: true });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.brandName = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (industry) {
      where.industry = industry;
    }

    // Build orderBy based on sort parameter
    // Note: Prisma doesn't support direct null ordering, so we handle managed brands in application logic
    let orderBy: any[] = [];

    switch (sort) {
      case "revenue":
        orderBy = [
          { avgRevenue: "desc" },
          { totalStores: "desc" },
        ];
        break;
      case "fee_asc":
        orderBy = [
          { franchiseFee: "asc" },
          { totalStores: "desc" },
        ];
        break;
      case "recent":
        orderBy = [
          { createdAt: "desc" },
        ];
        break;
      case "stores":
      default:
        orderBy = [
          { totalStores: "desc" },
          { avgRevenue: "desc" },
        ];
        break;
    }

    // count + findMany 병렬 실행
    const [total, brands] = await Promise.all([
      prisma.franchiseBrand.count({ where }),
      prisma.franchiseBrand.findMany({
        where,
        select: {
          id: true,
          ftcId: true,
          brandName: true,
          companyName: true,
          businessNumber: true,
          industry: true,
          franchiseFee: true,
          educationFee: true,
          depositFee: true,
          royalty: true,
          totalStores: true,
          avgRevenue: true,
          description: true,
          tier: true,
          tierExpiresAt: true,
          managerId: true,
          logo: true,
          bannerImage: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    // Sort managed brands first, then apply existing sort
    const transformedBrands = brands.sort((a, b) => {
      // Managed brands (with managerId) always come first
      if (a.managerId && !b.managerId) return -1;
      if (!a.managerId && b.managerId) return 1;
      // Both managed or both not managed - keep DB sort order
      return 0;
    });

    return NextResponse.json({
      brands: transformedBrands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Error fetching franchise brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch franchise brands" },
      { status: 500 }
    );
  }
}
