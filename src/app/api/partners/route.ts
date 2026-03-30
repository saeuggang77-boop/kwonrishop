import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 협력업체 목록 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
  const keyword = searchParams.get("keyword");
  const serviceType = searchParams.get("serviceType");
  const region = searchParams.get("region");
  const sort = searchParams.get("sort") || "latest";
  const featured = searchParams.get("featured") === "true";
  const tier = searchParams.get("tier"); // VIP, PREMIUM, BASIC, FREE

  if (featured) {
    const featuredPartners = await prisma.partnerService.findMany({
      where: {
        status: "ACTIVE",
        tier: { not: "FREE" },
      },
      orderBy: [
        { tier: "desc" },
        { viewCount: "desc" },
      ],
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        description: true,
        serviceArea: true,
        tier: true,
        viewCount: true,
        createdAt: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
        user: {
          select: { name: true, image: true },
        },
      },
    });

    return NextResponse.json({ partners: featuredPartners, featured: true });
  }

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (tier) where.tier = tier;
  if (serviceType) where.serviceType = serviceType;

  if (keyword) {
    where.OR = [
      { companyName: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
    ];
  }

  if (region) {
    where.serviceArea = { has: region };
  }

  let orderBy: any;

  if (sort === "popular") {
    orderBy = { viewCount: "desc" };
  } else {
    // latest: tier DESC (paid first), then bumpedAt DESC NULLS LAST, then createdAt DESC
    orderBy = [
      { tier: "desc" },
      { bumpedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ];
  }

  const [partners, total] = await Promise.all([
    prisma.partnerService.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        companyName: true,
        serviceType: true,
        description: true,
        serviceArea: true,
        tier: true,
        viewCount: true,
        createdAt: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.partnerService.count({ where }),
  ]);

  return NextResponse.json(
    {
      partners,
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

// 협력업체 등록
export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 5, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  // PARTNER 역할 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "PARTNER") {
    return NextResponse.json(
      { error: "협력업체 회원만 등록할 수 있습니다." },
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

  // 1인 1업체 제한 확인
  const existingPartner = await prisma.partnerService.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true },
  });

  if (existingPartner && existingPartner.status !== "DELETED") {
    return NextResponse.json(
      { error: "이미 등록된 업체가 있습니다. 1인 1업체만 등록 가능합니다." },
      { status: 400 }
    );
  }

  const body = await req.json();

  try {
    // Server-side validation
    const companyName = sanitizeInput(body.companyName);
    if (!companyName || companyName.trim() === "") {
      return NextResponse.json({ error: "업체명은 필수입니다." }, { status: 400 });
    }

    // Validate serviceType is a valid enum
    const validServiceTypes = ["INTERIOR", "SIGNAGE", "EQUIPMENT", "CLEANING", "ACCOUNTING", "LEGAL", "POS_SYSTEM", "DELIVERY", "MARKETING", "CONSULTING", "OTHER"];
    if (!body.serviceType || !validServiceTypes.includes(body.serviceType)) {
      return NextResponse.json({ error: "유효하지 않은 서비스 유형입니다." }, { status: 400 });
    }

    // Validate description minimum length
    const description = body.description ? sanitizeHtml(body.description) : null;
    if (!description || description.length < 10) {
      return NextResponse.json({ error: "서비스 소개는 최소 10자 이상이어야 합니다." }, { status: 400 });
    }

    // Validate serviceArea not empty
    if (!body.serviceArea || body.serviceArea.length === 0) {
      return NextResponse.json({ error: "서비스 가능 지역을 선택해주세요." }, { status: 400 });
    }

    // Validate image URLs (whitelist /uploads/ and https://)
    if (body.images && Array.isArray(body.images)) {
      for (const img of body.images) {
        if (!img.url || typeof img.url !== "string") {
          return NextResponse.json({ error: "잘못된 이미지 URL입니다." }, { status: 400 });
        }
        const url = img.url.toLowerCase();
        if (!url.startsWith("/uploads/") && !url.startsWith("https://")) {
          return NextResponse.json({ error: "허용되지 않은 이미지 URL입니다. /uploads/ 또는 https:// 로 시작해야 합니다." }, { status: 400 });
        }
        // Block dangerous URLs
        if (url.startsWith("javascript:") || url.startsWith("data:")) {
          return NextResponse.json({ error: "허용되지 않은 이미지 URL입니다." }, { status: 400 });
        }
      }
    }

    const partner = await prisma.partnerService.create({
      data: {
        userId: session.user.id,
        status: "ACTIVE",
        companyName,
        serviceType: body.serviceType,
        description,
        contactPhone: body.contactPhone ? sanitizeInput(body.contactPhone) : null,
        contactEmail: body.contactEmail ? sanitizeInput(body.contactEmail) : null,
        website: body.website ? sanitizeInput(body.website) : null,
        addressRoad: body.addressRoad ? sanitizeInput(body.addressRoad) : null,
        addressJibun: body.addressJibun ? sanitizeInput(body.addressJibun) : null,
        addressDetail: body.addressDetail ? sanitizeInput(body.addressDetail) : null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        serviceArea: body.serviceArea || [],
        images: {
          create: (body.images || []).map(
            (img: { url: string; type: string; sortOrder: number }) => ({
              url: img.url,
              type: img.type || "OTHER",
              sortOrder: img.sortOrder || 0,
            })
          ),
        },
      },
    });

    return NextResponse.json({ id: partner.id, success: true });
  } catch (error) {
    console.error("협력업체 등록 오류:", error);
    return NextResponse.json(
      { error: "협력업체 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
