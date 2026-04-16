import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const type = req.nextUrl.searchParams.get("type") || "listing";

  if (type === "equipment") {
    const equipFavorites = await prisma.equipmentFavorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        equipment: {
          select: {
            id: true,
            title: true,
            price: true,
            negotiable: true,
            condition: true,
            category: true,
            tradeMethod: true,
            addressRoad: true,
            addressJibun: true,
            viewCount: true,
            favoriteCount: true,
            status: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        },
      },
    });

    return NextResponse.json(
      equipFavorites
        .filter((f) => f.equipment.status === "ACTIVE")
        .map((f) => f.equipment)
    );
  }

  // Default: listing favorites (existing logic)
  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          status: true,
          addressRoad: true,
          addressJibun: true,
          deposit: true,
          monthlyRent: true,
          monthlyProfit: true,
          monthlyRevenue: true,
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
          category: { select: { name: true, icon: true } },
          subCategory: { select: { name: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          _count: { select: { documents: true } },
        },
      },
    },
  });

  return NextResponse.json(
    favorites
      .filter((f) => f.listing.status === "ACTIVE")
      .map((f) => f.listing),
  );
}
