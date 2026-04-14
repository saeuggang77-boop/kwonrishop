import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    // Get user's listing
    const listing = await prisma.listing.findFirst({
      where: { userId: session.user.id, status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        viewCount: true,
        favoriteCount: true,
        createdAt: true,
        status: true,
        storeName: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "등록된 매물이 없습니다." }, { status: 404 });
    }

    // Get chat count for this listing
    const chatCount = await prisma.chatRoom.count({
      where: { listingId: listing.id },
    });

    // Get recent favorites (last 10)
    const recentFavorites = await prisma.favorite.findMany({
      where: { listingId: listing.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate days since listing creation
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      listing: {
        viewCount: listing.viewCount,
        favoriteCount: listing.favoriteCount,
        createdAt: listing.createdAt,
        status: listing.status,
        storeName: listing.storeName,
        daysSinceCreation,
      },
      chatCount,
      recentFavorites: recentFavorites.map((fav) => ({
        createdAt: fav.createdAt,
        userName: fav.user.name || "익명",
      })),
    });
  } catch (error) {
    console.error("매물 통계 조회 오류:", error);
    return NextResponse.json(
      { error: "통계를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
