import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 광고 상품 목록 조회 (공개 API)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");

    const where: any = { active: true };
    if (scope && ["LISTING", "FRANCHISE", "PARTNER", "COMMON"].includes(scope)) {
      where.categoryScope = scope;
    }

    const products = await prisma.adProduct.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        categoryScope: true,
        price: true,
        duration: true,
        features: true,
      },
    });

    return NextResponse.json({ products }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error("광고 상품 조회 오류:", error);
    return NextResponse.json(
      { error: "광고 상품 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
