import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ listings: [] });
    }

    const listings = await prisma.listing.findMany({
      where: {
        id: { in: ids },
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
