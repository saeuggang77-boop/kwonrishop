import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

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
