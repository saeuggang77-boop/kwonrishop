import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/recommendations?type=listing&id=xxx&limit=4
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // listing, franchise, partner, equipment
    const id = searchParams.get("id");
    const limit = parseInt(searchParams.get("limit") || "4");

    if (!type || !id) {
      return NextResponse.json({ error: "type과 id는 필수입니다." }, { status: 400 });
    }

    const results: {
      franchises: any[];
      partners: any[];
      listings: any[];
      equipments: any[];
      sameIndustry?: any[];
      recentListings?: any[];
      trendingListings?: any[];
    } = {
      franchises: [],
      partners: [],
      listings: [],
      equipments: [],
    };

    if (type === "listing") {
      // 현재 매물 조회 (카테고리, 주소 기반 추천을 위해)
      const currentListing = await prisma.listing.findUnique({
        where: { id },
        select: { categoryId: true, addressRoad: true },
      });

      // 주소에서 구/동 추출 (예: "서울특별시 강남구 역삼동" -> "강남구")
      const dongMatch = currentListing?.addressRoad?.match(/([\w가-힣]+[구군시])/);
      const dong = dongMatch ? dongMatch[1] : null;

      // 매물 상세 → 추천 프랜차이즈 + 추천 협력업체 + 관련 집기 + 같은업종 + 최근등록 + 인기급상승
      const [franchises, partners, equipments, sameIndustry, recentListings, trendingListings] = await Promise.all([
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
        prisma.equipment.findMany({
          where: { status: "ACTIVE", id: { not: id } },
          orderBy: [{ bumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          take: limit,
          select: {
            id: true,
            title: true,
            price: true,
            negotiable: true,
            category: true,
            condition: true,
            addressRoad: true,
            viewCount: true,
            favoriteCount: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
        // 같은 업종 추천 매물 (같은 카테고리, 같은 지역)
        prisma.listing.findMany({
          where: {
            status: "ACTIVE",
            id: { not: id },
            ...(currentListing?.categoryId ? { categoryId: currentListing.categoryId } : {}),
            ...(dong ? { addressRoad: { contains: dong } } : {}),
          },
          orderBy: [{ bumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          take: limit,
          select: {
            id: true,
            storeName: true,
            addressRoad: true,
            deposit: true,
            monthlyRent: true,
            monthlyProfit: true,
            monthlyRevenue: true,
            premium: true,
            premiumNone: true,
            areaPyeong: true,
            viewCount: true,
            favoriteCount: true,
            category: { select: { name: true, icon: true } },
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
        // 최근 등록 매물 (같은 지역)
        prisma.listing.findMany({
          where: {
            status: "ACTIVE",
            id: { not: id },
            ...(dong ? { addressRoad: { contains: dong } } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          select: {
            id: true,
            storeName: true,
            addressRoad: true,
            deposit: true,
            monthlyRent: true,
            monthlyProfit: true,
            monthlyRevenue: true,
            premium: true,
            premiumNone: true,
            areaPyeong: true,
            viewCount: true,
            favoriteCount: true,
            createdAt: true,
            category: { select: { name: true, icon: true } },
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
        // 인기 급상승 매물 (최근 7일 조회수 기준)
        prisma.listing.findMany({
          where: {
            status: "ACTIVE",
            id: { not: id },
            updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { viewCount: "desc" },
          take: limit,
          select: {
            id: true,
            storeName: true,
            addressRoad: true,
            deposit: true,
            monthlyRent: true,
            monthlyProfit: true,
            monthlyRevenue: true,
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
      results.franchises = franchises;
      results.partners = partners;
      results.equipments = equipments;
      results.sameIndustry = sameIndustry;
      results.recentListings = recentListings;
      results.trendingListings = trendingListings;
    } else if (type === "franchise") {
      // 프랜차이즈 상세 → 관련 매물 + 관련 집기
      const [listings, equipments] = await Promise.all([
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
            monthlyProfit: true,
            monthlyRevenue: true,
            premium: true,
            premiumNone: true,
            areaPyeong: true,
            viewCount: true,
            favoriteCount: true,
            category: { select: { name: true, icon: true } },
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
        prisma.equipment.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ bumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          take: limit,
          select: {
            id: true,
            title: true,
            price: true,
            negotiable: true,
            category: true,
            condition: true,
            addressRoad: true,
            viewCount: true,
            favoriteCount: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
      ]);
      results.listings = listings;
      results.equipments = equipments;
    } else if (type === "partner") {
      // 협력업체 상세 → 최근 매물 + 관련 집기
      const [listings, equipments] = await Promise.all([
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
            monthlyProfit: true,
            monthlyRevenue: true,
            premium: true,
            premiumNone: true,
            areaPyeong: true,
            viewCount: true,
            favoriteCount: true,
            category: { select: { name: true, icon: true } },
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
        prisma.equipment.findMany({
          where: { status: "ACTIVE" },
          orderBy: [{ bumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          take: limit,
          select: {
            id: true,
            title: true,
            price: true,
            negotiable: true,
            category: true,
            condition: true,
            addressRoad: true,
            viewCount: true,
            favoriteCount: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
      ]);
      results.listings = listings;
      results.equipments = equipments;
    } else if (type === "equipment") {
      // 집기 상세 → 다른 집기 + 관련 매물 + 관련 협력업체
      const [equipments, listings, partners] = await Promise.all([
        prisma.equipment.findMany({
          where: { status: "ACTIVE", id: { not: id } },
          orderBy: [{ bumpedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
          take: limit,
          select: {
            id: true,
            title: true,
            price: true,
            negotiable: true,
            category: true,
            condition: true,
            addressRoad: true,
            viewCount: true,
            favoriteCount: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        }),
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
            monthlyProfit: true,
            monthlyRevenue: true,
            premium: true,
            premiumNone: true,
            areaPyeong: true,
            viewCount: true,
            favoriteCount: true,
            category: { select: { name: true, icon: true } },
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
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
      results.equipments = equipments;
      results.listings = listings;
      results.partners = partners;
    }

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error("추천 조회 오류:", error);
    return NextResponse.json({ error: "추천 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}
