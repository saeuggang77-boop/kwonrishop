import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 공개 프로필 API - 크롤링 방지를 위한 rate limiting
  const rateLimitError = await rateLimitRequest(req, 30, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        role: true,
        listings: {
          where: { status: "ACTIVE" },
          take: 1,
          orderBy: { createdAt: "desc" },
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
            viewCount: true,
            favoriteCount: true,
            themes: true,
            createdAt: true,
            category: {
              select: {
                name: true,
                icon: true,
              },
            },
            subCategory: {
              select: {
                name: true,
              },
            },
            images: {
              select: { url: true },
              take: 1,
            },
            _count: { select: { documents: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // reviewStats 제거 (Q&A로 전환)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        role: user.role,
        listing: user.listings[0] ? {
          ...user.listings[0],
          reviews: undefined,
        } : null,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "사용자 정보를 불러올 수 없습니다" },
      { status: 500 }
    );
  }
}
