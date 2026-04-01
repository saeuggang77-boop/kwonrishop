import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

/**
 * DB에서 프랜차이즈 브랜드 검색
 * ADMIN 전용
 */
export async function GET(request: Request) {
  // Rate limiting
  const limiter = rateLimitRequest(request, 10, 60000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // CSRF protection
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // ADMIN 권한 확인
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "관리자만 접근할 수 있습니다." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");

    if (!query) {
      return NextResponse.json(
        { error: "검색어가 필요합니다" },
        { status: 400 }
      );
    }

    const brands = await prisma.franchiseBrand.findMany({
      where: {
        OR: [
          { brandName: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      skip: (page - 1) * 20,
      orderBy: { totalStores: 'desc' },
      select: {
        id: true,
        ftcId: true,
        brandName: true,
        companyName: true,
        industry: true,
        totalStores: true,
        avgRevenue: true,
        tier: true,
        managerId: true,
      },
    });

    const total = await prisma.franchiseBrand.count({
      where: {
        OR: [
          { brandName: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return NextResponse.json({
      brands,
      total,
      query,
      page,
    });
  } catch (error) {
    console.error("Error searching franchise brands:", error);
    return NextResponse.json(
      { error: "Failed to search franchise brands" },
      { status: 500 }
    );
  }
}
