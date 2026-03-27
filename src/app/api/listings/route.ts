import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
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
        adPurchases: {
          some: {
            status: "PAID",
            expiresAt: { gt: new Date() },
          },
        },
      },
      orderBy: { createdAt: "desc" },
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
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
        adPurchases: {
          where: {
            status: "PAID",
            expiresAt: { gt: new Date() },
          },
          include: { product: { select: { id: true, price: true } } },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Add featuredTier and sort by tier level
    const tierOrder = { vip: 0, premium: 1, basic: 2 };
    const withTier = featuredListings.map((l) => {
      const productId = l.adPurchases[0]?.product?.id || "";
      const tier = productId.includes("vip") ? "VIP" : productId.includes("premium") ? "PREMIUM" : "BASIC";
      return { ...l, featuredTier: tier, adPurchases: undefined };
    }).sort((a, b) => {
      const aOrder = tierOrder[a.featuredTier.toLowerCase() as keyof typeof tierOrder] ?? 99;
      const bOrder = tierOrder[b.featuredTier.toLowerCase() as keyof typeof tierOrder] ?? 99;
      return aOrder - bOrder;
    });

    return NextResponse.json({ listings: withTier, featured: true });
  }

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (categoryId) where.categoryId = categoryId;
  if (subCategoryId) where.subCategoryId = subCategoryId;
  if (brandType) where.brandType = brandType;
  if (premiumNone === "true") where.premiumNone = true;

  if (keyword) {
    where.OR = [
      { storeName: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { addressRoad: { contains: keyword, mode: "insensitive" } },
      { addressJibun: { contains: keyword, mode: "insensitive" } },
    ];
  }

  // Region filter (new)
  if (region) {
    if (!where.AND) where.AND = [];
    (where.AND as Array<Record<string, unknown>>).push({
      addressRoad: { contains: region, mode: "insensitive" },
    });
  }

  // New advanced filters for premium range
  if (premiumMin || premiumMax) {
    where.premium = {};
    if (premiumMin) (where.premium as Record<string, number>).gte = parseInt(premiumMin) * 10000;
    if (premiumMax) (where.premium as Record<string, number>).lte = parseInt(premiumMax) * 10000;
  }

  // Deposit range filter
  if (depositMin || depositMax) {
    where.deposit = {};
    if (depositMin) (where.deposit as Record<string, number>).gte = parseInt(depositMin) * 10000;
    if (depositMax) (where.deposit as Record<string, number>).lte = parseInt(depositMax) * 10000;
  }

  // Monthly rent range filter
  if (rentMin || rentMax) {
    where.monthlyRent = {};
    if (rentMin) (where.monthlyRent as Record<string, number>).gte = parseInt(rentMin) * 10000;
    if (rentMax) (where.monthlyRent as Record<string, number>).lte = parseInt(rentMax) * 10000;
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

  let orderBy: any;

  if (sort === "premium_asc") {
    orderBy = { premium: "asc" };
  } else if (sort === "premium_desc") {
    orderBy = { premium: "desc" };
  } else if (sort === "popular") {
    orderBy = { viewCount: "desc" };
  } else {
    // latest: bumpedAt DESC NULLS LAST, then createdAt DESC
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
        status: true,
        addressRoad: true,
        addressJibun: true,
        latitude: true,
        longitude: true,
        categoryId: true,
        subCategoryId: true,
        deposit: true,
        monthlyRent: true,
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
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
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

  const ip = getClientIp(req);
  const limit = rateLimit(ip, 5, 60000);
  if (!limit.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

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

  const existingListing = await prisma.listing.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true },
  });

  if (existingListing && existingListing.status !== "DELETED") {
    return NextResponse.json(
      { error: "이미 등록된 매물이 있습니다. 1인 1매물만 등록 가능합니다." },
      { status: 400 },
    );
  }

  const body = await req.json();

  try {
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
        contactPublic: body.contactPublic ?? false,
        images: {
          create: (body.images || []).map(
            (img: { url: string; type: string; sortOrder: number }) => ({
              url: img.url,
              type: img.type || "OTHER",
              sortOrder: img.sortOrder || 0,
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
