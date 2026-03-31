import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";

// 집기 목록 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
  const category = searchParams.get("category");
  const condition = searchParams.get("condition");
  const tradeMethod = searchParams.get("tradeMethod");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const keyword = searchParams.get("keyword");
  const featured = searchParams.get("featured") === "true";
  const mine = searchParams.get("mine") === "true";
  const sort = searchParams.get("sort") || "latest";

  // Featured equipment - return early
  if (featured) {
    const featuredEquipment = await prisma.equipment.findMany({
      where: {
        status: "ACTIVE",
        adPurchases: {
          some: {
            status: "PAID",
            expiresAt: { gt: new Date() },
          },
        },
      },
      orderBy: [{ tier: "desc" }, { createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        negotiable: true,
        category: true,
        condition: true,
        tradeMethod: true,
        addressRoad: true,
        tier: true,
        viewCount: true,
        favoriteCount: true,
        createdAt: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
      },
    });

    return NextResponse.json({ equipment: featuredEquipment, featured: true });
  }

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  // 내 집기 필터: 로그인 사용자의 집기만 조회
  if (mine) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    where.userId = session.user.id;
  }

  if (category) where.category = category;
  if (condition) where.condition = condition;
  if (tradeMethod) where.tradeMethod = tradeMethod;

  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) {
      const val = parseInt(minPrice);
      if (!isNaN(val)) priceFilter.gte = val;
    }
    if (maxPrice) {
      const val = parseInt(maxPrice);
      if (!isNaN(val)) priceFilter.lte = val;
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price = priceFilter;
    }
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
      { addressRoad: { contains: keyword, mode: "insensitive" } },
    ];
  }

  let orderBy: any;

  if (sort === "popular") {
    orderBy = { viewCount: "desc" };
  } else if (sort === "price_asc") {
    orderBy = { price: "asc" };
  } else if (sort === "price_desc") {
    orderBy = { price: "desc" };
  } else {
    // latest: tier DESC (paid first), then bumpedAt DESC NULLS LAST, then createdAt DESC
    orderBy = [
      { tier: "desc" },
      { bumpedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ];
  }

  const [equipment, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        negotiable: true,
        category: true,
        condition: true,
        tradeMethod: true,
        addressRoad: true,
        tier: true,
        viewCount: true,
        favoriteCount: true,
        createdAt: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
      },
    }),
    prisma.equipment.count({ where }),
  ]);

  return NextResponse.json(
    {
      equipment,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

// 집기 등록
export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 5, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // 역할 확인 (SELLER, FRANCHISE, PARTNER, ADMIN)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !["SELLER", "FRANCHISE", "PARTNER", "ADMIN"].includes(user.role)) {
    return NextResponse.json(
      { error: "사업자 회원만 집기를 등록할 수 있습니다." },
      { status: 403 }
    );
  }

  // 사업자인증 확인
  const verification = await prisma.businessVerification.findUnique({
    where: { userId: session.user.id },
    select: { verified: true },
  });

  if (!verification?.verified) {
    return NextResponse.json({ error: "사업자인증이 필요합니다." }, { status: 403 });
  }

  // 활성 집기 10개 제한
  const activeCount = await prisma.equipment.count({
    where: {
      userId: session.user.id,
      status: { notIn: ["DELETED", "SOLD", "EXPIRED"] },
    },
  });

  if (activeCount >= 10) {
    return NextResponse.json(
      { error: "최대 10개까지 집기를 등록할 수 있습니다." },
      { status: 400 }
    );
  }

  const body = await req.json();

  // 필수 필드 검증
  if (!body.title || !body.description || !body.category || !body.condition) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }

  if (body.description.length < 10) {
    return NextResponse.json({ error: "설명은 최소 10자 이상 입력해주세요." }, { status: 400 });
  }

  if (body.price === undefined || body.price === null || body.price < 0) {
    return NextResponse.json({ error: "가격을 올바르게 입력해주세요." }, { status: 400 });
  }

  if (!body.images || !Array.isArray(body.images) || body.images.length < 1) {
    return NextResponse.json({ error: "사진을 최소 1장 이상 등록해주세요." }, { status: 400 });
  }

  try {
    const equipment = await prisma.equipment.create({
      data: {
        userId: session.user.id,
        status: "ACTIVE",
        title: sanitizeInput(body.title),
        description: sanitizeHtml(body.description),
        category: body.category,
        condition: body.condition,
        price: body.price,
        negotiable: body.negotiable ?? false,
        tradeMethod: body.tradeMethod || "DIRECT",
        addressRoad: body.addressRoad ? sanitizeInput(body.addressRoad) : null,
        addressJibun: body.addressJibun ? sanitizeInput(body.addressJibun) : null,
        addressDetail: body.addressDetail ? sanitizeInput(body.addressDetail) : null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        brand: body.brand ? sanitizeInput(body.brand) : null,
        modelName: body.modelName ? sanitizeInput(body.modelName) : null,
        purchaseYear: body.purchaseYear ?? null,
        quantity: body.quantity ?? 1,
        images: {
          create: body.images.map(
            (img: { url: string; sortOrder?: number }) => ({
              url: img.url,
              sortOrder: img.sortOrder || 0,
            })
          ),
        },
      },
    });

    return NextResponse.json({ id: equipment.id, success: true });
  } catch (error) {
    console.error("집기 등록 오류:", error);
    return NextResponse.json(
      { error: "집기 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
