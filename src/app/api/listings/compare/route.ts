import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ listings: [] });
    }

    // 최대 5개로 제한
    const limitedIds = ids.slice(0, 5);

    const listings = await prisma.listing.findMany({
      where: {
        id: { in: limitedIds },
        status: "ACTIVE",
      },
      select: {
        id: true,
        storeName: true,
        addressRoad: true,
        addressJibun: true,
        deposit: true,
        monthlyRent: true,
        premium: true,
        premiumNone: true,
        premiumNegotiable: true,
        areaPyeong: true,
        currentFloor: true,
        monthlyRevenue: true,
        monthlyProfit: true,
        viewCount: true,
        favoriteCount: true,
        category: {
          select: { name: true },
        },
        subCategory: {
          select: { name: true },
        },
        images: {
          select: { url: true },
          take: 1,
        },
      },
    });

    return NextResponse.json({ listings });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json(
      { error: "매물 비교 정보를 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}
