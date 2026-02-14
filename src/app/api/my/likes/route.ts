import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "인증이 필요합니다" },
      { status: 401 }
    );
  }

  const likes = await prisma.listingLike.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          district: true,
          businessCategory: true,
          price: true,
          premiumFee: true,
          monthlyRent: true,
          viewCount: true,
          likeCount: true,
          safetyGrade: true,
          images: {
            take: 1,
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
            },
          },
        },
      },
    },
  });

  const data = likes.map((like) => ({
    id: like.id,
    createdAt: like.createdAt,
    listing: {
      ...like.listing,
      price: like.listing.price.toString(),
      premiumFee: like.listing.premiumFee?.toString() ?? null,
      monthlyRent: like.listing.monthlyRent?.toString() ?? null,
    },
  }));

  return NextResponse.json({ data });
}
