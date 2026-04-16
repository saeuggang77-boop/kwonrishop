import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";

// 매물 목록 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
  const categoryId = searchParams.get("categoryId");
  const subCategoryId = searchParams.get("subCategoryId");
  const sort = searchParams.get("sort") || "latest";
  const keyword = searchParams.get("keyword");
  const minDeposit = searchParams.get("minDeposit");
  const maxDeposit = searchParams.get("maxDeposit");
  const minPremium = searchParams.get("minPremium");
  const maxPremium = searchParams.get("maxPremium");
  const premiumNone = searchParams.get("premiumNone");
  const brandType = searchParams.get("brandType");
  const featured = searchParams.get("featured") === "true";
  const excludeFeatured = searchParams.get("excludeFeatured") !== "false";

  // New advanced filters
  const region = searchParams.get("region");
  const premiumMin = searchParams.get("premiumMin");
  const premiumMax = searchParams.get("premiumMax");
  const depositMin = searchParams.get("depositMin");
  const depositMax = searchParams.get("depositMax");
  const rentMin = searchParams.get("rentMin");
  const rentMax = searchParams.get("rentMax");
  const areaMin = searchParams.get("areaMin");
  const areaMax = searchParams.get("areaMax");
  const themes = searchParams.get("themes");

  // Featured listings query - return early
  if (featured) {
    const featuredListings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        tier: { in: ["VIP", "PREMIUM"] },
        OR: [
          { tierExpiresAt: { gt: new Date() } },
          { tierExpiresAt: null },
        ],
      },
      orderBy: [
        { tier: "desc" },
        { createdAt: "desc" },
      ],
      take: 10,
      select: {
        id: true,
        status: true,
        addressRoad: true,
        addressJibun: true,
        latitude: true,
        longitude: true,
        categoryId: true,
        subCategoryId: true,
        deposit: true,
        monthlyRent: true,
        monthlyProfit: true,
        monthlyRevenue: true,
        premium: true,
        premiumNone: true,
        premiumNegotiable: true,
        brandType: true,
        storeName: true,
        areaPyeong: true,
        currentFloor: true,
        themes: true,
        viewCount: true,
        favoriteCount: true,
        createdAt: true,
        bumpedAt: true,
        tier: true,
        category: { select: { name: true, icon: true } },
        subCategory: { select: { name: true } },
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
        _count: { select: { documents: true } },
      },
    });

    const withTier = featuredListings.map((l) => ({
      ...l,
      featuredTier: l.tier,
    }));

    return NextResponse.json({ listings: withTier, featured: true }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  }

  // 지도 bounds 필터
  const swLat = searchParams.get("swLat");
  const swLng = searchParams.get("swLng");
  const neLat = searchParams.get("neLat");
  const neLng = searchParams.get("neLng");

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (swLat && swLng && neLat && neLng) {
    const sw = { lat: parseFloat(swLat), lng: parseFloat(swLng) };
    const ne = { lat: parseFloat(neLat), lng: parseFloat(neLng) };
    if (!isNaN(sw.lat) && !isNaN(sw.lng) && !isNaN(ne.lat) && !isNaN(ne.lng)) {
      where.latitude = { not: null, gte: sw.lat, lte: ne.lat };
      where.longitude = { not: null, gte: sw.lng, lte: ne.lng };
    }
  }

  if (categoryId) where.categoryId = categoryId;
  if (subCategoryId) where.subCategoryId = subCategoryId;
  if (brandType) where.brandType = brandType;
  if (premiumNone === "true") where.premiumNone = true;

  // Build keyword and region filters (AND relationship between them)
  const keywordConditions: any[] = [];
  const regionConditions: any[] = [];

  if (keyword) {
    keywordConditions.push(
      { storeName: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { addressRoad: { contains: keyword, mode: "insensitive" } },
      { addressJibun: { contains: keyword, mode: "insensitive" } }
    );
  }

  // Region filter - search both road and jibun addresses
  if (region) {
    regionConditions.push(
      { addressRoad: { contains: region, mode: "insensitive" } },
      { addressJibun: { contains: region, mode: "insensitive" } }
    );
  }

  // keyword AND region (not OR)
  if (keywordConditions.length > 0 && regionConditions.length > 0) {
    const existingAnd = Array.isArray(where.AND) ? where.AND : [];
    where.AND = [
      ...existingAnd,
      { OR: keywordConditions },
      { OR: regionConditions },
    ];
  } else if (keywordConditions.length > 0) {
    where.OR = keywordConditions;
  } else if (regionConditions.length > 0) {
    where.OR = regionConditions;
  }

  // New advanced filters for premium range (DB stores in 만원 units, no conversion needed)
  if (premiumMin || premiumMax) {
    where.premium = {};
    if (premiumMin) (where.premium as Record<string, number>).gte = parseInt(premiumMin);
    if (premiumMax) (where.premium as Record<string, number>).lte = parseInt(premiumMax);
  }

  // Deposit range filter (DB stores in 만원 units, no conversion needed)
  if (depositMin || depositMax) {
    where.deposit = {};
    if (depositMin) (where.deposit as Record<string, number>).gte = parseInt(depositMin);
    if (depositMax) (where.deposit as Record<string, number>).lte = parseInt(depositMax);
  }

  // Monthly rent range filter (DB stores in 만원 units, no conversion needed)
  if (rentMin || rentMax) {
    where.monthlyRent = {};
    if (rentMin) (where.monthlyRent as Record<string, number>).gte = parseInt(rentMin);
    if (rentMax) (where.monthlyRent as Record<string, number>).lte = parseInt(rentMax);
  }

  // Area range filter
  if (areaMin || areaMax) {
    where.areaPyeong = {};
    if (areaMin) (where.areaPyeong as Record<string, number>).gte = parseFloat(areaMin);
    if (areaMax) (where.areaPyeong as Record<string, number>).lte = parseFloat(areaMax);
  }

  // Themes filter
  if (themes) {
    const themeArray = themes.split(",").filter(Boolean);
    if (themeArray.length > 0) {
      where.themes = { hasSome: themeArray };
    }
  }

  // Featured 제외: 필터/검색 없을 때만 VIP/PREMIUM 숨김 (캐러셀과 중복 방지)
  const hasFilter = !!(
    keyword || region || themes ||
    minDeposit || maxDeposit || minPremium || maxPremium ||
    premiumMin || premiumMax || depositMin || depositMax ||
    rentMin || rentMax || areaMin || areaMax ||
    categoryId || subCategoryId || brandType || premiumNone ||
    (swLat && swLng && neLat && neLng)
  );

  if (excludeFeatured && !hasFilter) {
    where.tier = { notIn: ["VIP", "PREMIUM"] };
  }

  let orderBy: any;

  if (sort === "premium_asc") {
    orderBy = { premium: "asc" };
  } else if (sort === "premium_desc") {
    orderBy = { premium: "desc" };
  } else if (sort === "popular") {
    orderBy = { viewCount: "desc" };
  } else {
    // latest: 순수 최신순 (bumpedAt 반영, tier 제외 — 유료는 featured 캐러셀에서만 강조)
    orderBy = [
      { bumpedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ];
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        userId: true,
        status: true,
        addressRoad: true,
        addressJibun: true,
        latitude: true,
        longitude: true,
        categoryId: true,
        subCategoryId: true,
        deposit: true,
        monthlyRent: true,
        monthlyProfit: true,
        monthlyRevenue: true,
        premium: true,
        premiumNone: true,
        premiumNegotiable: true,
        brandType: true,
        storeName: true,
        areaPyeong: true,
        currentFloor: true,
        themes: true,
        viewCount: true,
        favoriteCount: true,
        createdAt: true,
        bumpedAt: true,
        category: { select: { name: true, icon: true } },
        subCategory: { select: { name: true } },
        tier: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
        _count: { select: { documents: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const finalListings = listings.map((l: any) => ({
    ...l,
    featuredTier: l.tier,
    userId: undefined,
  }));

  return NextResponse.json({
    listings: finalListings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}

// 매물 등록
export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(req, 15, 60000);
  if (rateLimitError) return rateLimitError;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // SELLER 역할 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "SELLER" && user?.role !== "ADMIN") {
    return NextResponse.json({ error: "매도자(사장님)만 매물을 등록할 수 있습니다." }, { status: 403 });
  }

  const verification = await prisma.businessVerification.findUnique({
    where: { userId: session.user.id },
    select: { verified: true },
  });

  if (!verification?.verified) {
    return NextResponse.json({ error: "사업자인증이 필요합니다." }, { status: 403 });
  }

  const existingActiveListing = await prisma.listing.findFirst({
    where: {
      userId: session.user.id,
      status: { not: "DELETED" },
    },
    select: { id: true },
  });

  if (existingActiveListing) {
    return NextResponse.json(
      { error: "이미 등록된 매물이 있습니다. 1인 1매물만 등록 가능합니다." },
      { status: 400 },
    );
  }

  const body = await req.json();

  try {
    // 연락처 공개 시 전화번호를 User에 저장
    if (body.contactPhone) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone: body.contactPhone.replace(/\D/g, "") },
      });
    }

    const listing = await prisma.listing.create({
      data: {
        userId: session.user.id,
        status: "ACTIVE",
        zipCode: body.zipCode || null,
        addressJibun: body.addressJibun || null,
        addressRoad: body.addressRoad || null,
        addressDetail: body.addressDetail ? sanitizeInput(body.addressDetail) : null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        categoryId: body.categoryId ?? null,
        subCategoryId: body.subCategoryId ?? null,
        deposit: body.deposit ?? 0,
        monthlyRent: body.monthlyRent ?? 0,
        premium: body.premium ?? 0,
        premiumNone: body.premiumNone ?? false,
        premiumNegotiable: body.premiumNegotiable ?? false,
        premiumBusiness: body.premiumBusiness ?? null,
        premiumBusinessDesc: body.premiumBusinessDesc ?? null,
        premiumFacility: body.premiumFacility ?? null,
        premiumFacilityDesc: body.premiumFacilityDesc ?? null,
        premiumLocation: body.premiumLocation ?? null,
        premiumLocationDesc: body.premiumLocationDesc ?? null,
        maintenanceFee: body.maintenanceFee ?? null,
        brandType: body.brandType || "PRIVATE",
        storeName: body.storeName ? sanitizeInput(body.storeName) : null,
        currentFloor: body.currentFloor ?? null,
        totalFloor: body.totalFloor ?? null,
        isBasement: body.isBasement ?? false,
        areaPyeong: body.areaPyeong ?? null,
        areaSqm: body.areaSqm ?? null,
        themes: body.themes || [],
        parkingTotal: body.parkingTotal ?? null,
        parkingPerUnit: body.parkingPerUnit ?? null,
        parkingNone: body.parkingNone ?? false,
        monthlyRevenue: body.monthlyRevenue ?? null,
        expenseMaterial: body.expenseMaterial ?? null,
        expenseLabor: body.expenseLabor ?? null,
        operationType: body.operationType || "SOLO",
        familyWorkers: body.familyWorkers ?? null,
        employeesFull: body.employeesFull ?? null,
        employeesPart: body.employeesPart ?? null,
        expenseRent: body.expenseRent ?? null,
        expenseMaintenance: body.expenseMaintenance ?? null,
        expenseUtility: body.expenseUtility ?? null,
        expenseOther: body.expenseOther ?? null,
        monthlyProfit: body.monthlyProfit ?? null,
        profitDescription: body.profitDescription ? sanitizeInput(body.profitDescription) : null,
        description: body.description ? sanitizeHtml(body.description) : null,
        contactPublic: body.contactPublic ?? true,
        images: {
          create: (body.images || []).map(
            (img: { url: string; type: string; sortOrder: number }) => ({
              url: img.url,
              type: img.type || "OTHER",
              sortOrder: img.sortOrder || 0,
            }),
          ),
        },
        documents: {
          create: (body.documents || []).map(
            (doc: { url: string }) => ({
              url: doc.url,
              type: "REVENUE_PROOF",
            }),
          ),
        },
      },
    });

    return NextResponse.json({ id: listing.id, success: true });
  } catch (error) {
    console.error("매물 등록 오류:", error);
    return NextResponse.json(
      { error: "매물 등록 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
