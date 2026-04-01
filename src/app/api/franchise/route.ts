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
          } as any
        },
        take: limit,
        include: {
          _count: { select: { inquiries: true } },
        },
        orderBy: [
          { tier: "desc" },
          { totalStores: "desc" },
        ],
      });

      const transformed = featuredBrands.map((brand) => {
        const { _count, ...rest } = brand;
        return {
          ...rest,
          inquiryCount: _count.inquiries,
        };
      });

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

    // Get total count
    const total = await prisma.franchiseBrand.count({ where });

    // Get brands with inquiry count
    const brands = await prisma.franchiseBrand.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            inquiries: true,
          },
        },
      },
      orderBy: [
        {
          tier: "desc", // GOLD > SILVER > BRONZE > FREE
        },
        {
          totalStores: "desc",
        },
      ],
    });

    // Transform to include inquiryCount
    const transformedBrands = brands.map((brand) => ({
      ...brand,
      inquiryCount: brand._count.inquiries,
      _count: undefined,
    }));

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
