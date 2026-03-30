import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchFranchiseBrands } from "@/lib/api/ftc";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

/**
 * 공정위 API로 프랜차이즈 브랜드 검색 (라이브 검색)
 * ADMIN 전용
 */
export async function GET(request: Request) {
  // Rate limiting
  const ip = getClientIp(request);
  const limiter = rateLimit(ip, 10, 60000);
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

    const result = await searchFranchiseBrands(query, page);

    return NextResponse.json({
      brands: result.brands,
      total: result.total,
      query,
      page,
    });
  } catch (error) {
    console.error("Error searching FTC brands:", error);
    return NextResponse.json(
      { error: "Failed to search franchise brands" },
      { status: 500 }
    );
  }
}
