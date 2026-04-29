import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validatePostTitle } from "@/lib/validate-title";

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
  const sido = searchParams.get("sido");
  const sigungu = searchParams.get("sigungu");
  const premiumMin = searchParams.get("premiumMin");
  const premiumMax = searchParams.get("premiumMax");
  const depositMin = searchParams.get("depositMin");
  const depositMax = searchParams.get("depositMax");
  const rentMin = searchParams.get("rentMin");
  const rentMax = searchParams.get("rentMax");
  const areaMin = searchParams.get("areaMin");
  const areaMax = searchParams.get("areaMax");
  const themes = searchParams.get("themes");
  const currentFloorParam = searchParams.get("currentFloor");
  const parkingParam = searchParams.get("parking");
  const premiumNoneParam = searchParams.get("premiumNone");
  const premiumNegotiableParam = searchParams.get("premiumNegotiable");
  const hasRevenueDocParam = searchParams.get("hasRevenueDoc");

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

  // 누적 AND 절 (모든 추가 필터가 AND로 묶임)
  const andClauses: any[] = [];

  // Build keyword and region filters
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

  // 기존 region 텍스트 입력 (하위호환)
  if (region) {
    regionConditions.push(
      { addressRoad: { contains: region, mode: "insensitive" } },
      { addressJibun: { contains: region, mode: "insensitive" } }
    );
  }

  // 신규: sido + sigungu 분리된 지역 필터 (각각 AND 로 별도 조건)
  if (sido) {
    andClauses.push({
      OR: [
        { addressRoad: { contains: sido, mode: "insensitive" } },
        { addressJibun: { contains: sido, mode: "insensitive" } },
      ],
    });
  }
  if (sigungu) {
    andClauses.push({
      OR: [
        { addressRoad: { contains: sigungu, mode: "insensitive" } },
        { addressJibun: { contains: sigungu, mode: "insensitive" } },
      ],
    });
  }

  if (keywordConditions.length > 0) {
    andClauses.push({ OR: keywordConditions });
  }
  if (regionConditions.length > 0) {
    andClauses.push({ OR: regionConditions });
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

  // Themes + 층수 필터 (둘 다 있고 테마에 "1층" 이 있으면 OR 매칭)
  const themeArray = themes ? themes.split(",").filter(Boolean) : [];
  const floorValues = currentFloorParam
    ? currentFloorParam.split(",").filter(Boolean)
    : [];

  const themeHasFloor1 = themeArray.includes("1층");
  const floorHas1 = floorValues.includes("1");

  if (themeArray.length > 0 && floorValues.length > 0 && themeHasFloor1 && floorHas1) {
    // 테마 "1층" + currentFloor "1" 동시 → OR 매칭으로 합침
    const themeOnly = themeArray.filter((t) => t !== "1층");
    const floorOr: any[] = [];
    if (floorValues.includes("1")) floorOr.push({ currentFloor: 1 });
    if (floorValues.includes("2")) floorOr.push({ currentFloor: 2 });
    if (floorValues.includes("3plus")) floorOr.push({ currentFloor: { gte: 3 } });
    if (floorValues.includes("basement")) floorOr.push({ isBasement: true });
    // "1층" 테마는 currentFloor=1 과 의미 동일 → floorOr 에 이미 포함됨

    const orGroup: any[] = [...floorOr];
    if (themeOnly.length > 0) {
      orGroup.push({ themes: { hasSome: themeOnly } });
    }
    // 테마 "1층" 자체도 themes 컬럼에 들어있는 케이스 보장
    orGroup.push({ themes: { has: "1층" } });

    andClauses.push({ OR: orGroup });
  } else {
    // 일반 경로
    if (themeArray.length > 0) {
      where.themes = { hasSome: themeArray };
    }
    if (floorValues.length > 0) {
      const floorOr: any[] = [];
      if (floorValues.includes("1")) floorOr.push({ currentFloor: 1 });
      if (floorValues.includes("2")) floorOr.push({ currentFloor: 2 });
      if (floorValues.includes("3plus")) floorOr.push({ currentFloor: { gte: 3 } });
      if (floorValues.includes("basement")) floorOr.push({ isBasement: true });
      if (floorOr.length > 0) andClauses.push({ OR: floorOr });
    }
  }

  // 주차 필터
  if (parkingParam === "yes") {
    andClauses.push({
      AND: [
        { parkingNone: false },
        { parkingTotal: { gt: 0 } },
      ],
    });
  } else if (parkingParam === "no") {
    where.parkingNone = true;
  }

  // 권리금 옵션: 무권리 + 협의 가능 (둘 다 켜져있으면 OR로 묶음)
  if (premiumNoneParam === "true" && premiumNegotiableParam === "true") {
    andClauses.push({
      OR: [
        { premiumNone: true },
        { themes: { has: "무권리" } },
        { premiumNegotiable: true },
      ],
    });
  } else if (premiumNoneParam === "true") {
    andClauses.push({
      OR: [
        { premiumNone: true },
        { themes: { has: "무권리" } },
      ],
    });
  } else if (premiumNegotiableParam === "true") {
    where.premiumNegotiable = true;
  }
  // 하위호환: 옛 ?premiumNone= 키 (다른 진입 경로 보호)
  if (premiumNone === "true" && premiumNoneParam !== "true" && premiumNegotiableParam !== "true") {
    where.premiumNone = true;
  }

  // 매출증빙 필터: monthlyRevenue가 있거나 documents (REVENUE_PROOF) 가 1개 이상
  if (hasRevenueDocParam === "true") {
    andClauses.push({
      OR: [
        { monthlyRevenue: { not: null } },
        { documents: { some: { type: "REVENUE_PROOF" } } },
      ],
    });
  }

  // 누적된 AND 절을 where 에 반영 (기존 OR 와 충돌 방지)
  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  // Featured 제외: 필터/검색 없을 때만 VIP/PREMIUM 숨김 (캐러셀과 중복 방지)
  const hasFilter = !!(
    keyword || region || sido || sigungu || themes ||
    minDeposit || maxDeposit || minPremium || maxPremium ||
    premiumMin || premiumMax || depositMin || depositMax ||
    rentMin || rentMax || areaMin || areaMax ||
    categoryId || subCategoryId || brandType || premiumNone ||
    premiumNoneParam === "true" || premiumNegotiableParam === "true" ||
    currentFloorParam || parkingParam || hasRevenueDocParam === "true" ||
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
    select: { role: true, email: true },
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

  // 시드 계정(데모 매물 등록용)은 1인 1매물 제한 우회
  const seedEmails = (process.env.SEED_SELLER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const isSeedAccount = !!user.email && seedEmails.includes(user.email.toLowerCase());

  if (!isSeedAccount) {
    // 진행 중인 매물만 체크 (SOLD/DELETED는 거래가 끝났거나 내려간 상태 → 새 매물 등록 허용)
    const existingActiveListing = await prisma.listing.findFirst({
      where: {
        userId: session.user.id,
        status: { notIn: ["DELETED", "SOLD"] },
      },
      select: { id: true },
    });

    if (existingActiveListing) {
      return NextResponse.json(
        { error: "이미 등록된 매물이 있습니다. 1인 1매물만 등록 가능합니다." },
        { status: 400 },
      );
    }
  }

  const body = await req.json();

  // 게시글 제목 검증 (필수)
  const titleResult = validatePostTitle(body.storeName);
  if (!titleResult.ok) {
    return NextResponse.json({ error: titleResult.error }, { status: 400 });
  }
  const validatedStoreName = titleResult.sanitized!;

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
        storeName: validatedStoreName,
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
