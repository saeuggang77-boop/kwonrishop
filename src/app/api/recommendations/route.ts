import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/recommendations?type=listing&id=xxx&limit=4
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // listing, franchise, partner
    const id = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "4");

    if (!type || !id) {
      return NextResponse.json({ error: "type과 id는 필수입니다." }, { status: 400 });
    }

    const results: { franchises: any[]; partners: any[]; listings: any[] } = {
      franchises: [],
      partners: [],
      listings: [],
    };

    if (type === "listing") {
      // 매물 상세 → 추천 프랜차이즈 + 추천 협력업체
      const [franchises, partners] = await Promise.all([
        prisma.franchiseBrand.findMany({
          where: { tier: { not: "FREE" } },
          orderBy: [{ tier: "desc" }, { updatedAt: "desc" }],
          take: limit,
          select: {
            id: true,
            brandName: true,
            companyName: true,
            industry: true,
            tier: true,
            totalStores: true,
            avgRevenue: true,
            franchiseFee: true,
          },
        }),
        prisma.partnerService.findMany({
          where: { status: "ACTIVE", tier: { not: "FREE" } },
          orderBy: [{ tier: "desc" }, { updatedAt: "desc" }],
          take: limit,
          select: {
            id: true,
            companyName: true,
            serviceType: true,
            tier: true,
            serviceArea: true,
            viewCount: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
      ]);
      results.franchises = franchises;
      results.partners = partners;
    } else if (type === "franchise") {
      // 프랜차이즈 상세 → 관련 매물
      const [listings] = await Promise.all([
        prisma.listing.findMany({
          where: { status: "ACTIVE", brandType: "FRANCHISE" },
          orderBy: [{ bumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          take: limit,
          select: {
            id: true,
            storeName: true,
            addressRoad: true,
            deposit: true,
            monthlyRent: true,
            premium: true,
            premiumNone: true,
            areaPyeong: true,
            viewCount: true,
            favoriteCount: true,
            category: { select: { name: true, icon: true } },
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
      ]);
      results.listings = listings;
    } else if (type === "partner") {
      // 협력업체 상세 → 최근 매물
      const [listings] = await Promise.all([
        prisma.listing.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ bumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          take: limit,
          select: {
            id: true,
            storeName: true,
            addressRoad: true,
            deposit: true,
            monthlyRent: true,
            premium: true,
            premiumNone: true,
            areaPyeong: true,
            viewCount: true,
            favoriteCount: true,
            category: { select: { name: true, icon: true } },
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
      ]);
      results.listings = listings;
    }

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error("추천 조회 오류:", error);
    return NextResponse.json({ error: "추천 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
