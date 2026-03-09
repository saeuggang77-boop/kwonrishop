import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        listing: {
          where: { status: "ACTIVE" },
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
            reviews: {
              select: {
                accuracyRating: true,
                communicationRating: true,
                conditionRating: true,
              },
            },
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

    // Calculate average rating from listing reviews
    let avgRating = 0;
    let reviewCount = 0;

    if (user.listing && user.listing.reviews.length > 0) {
      const reviews = user.listing.reviews;
      reviewCount = reviews.length;
      const totalRating = reviews.reduce((sum, review) => {
        const avg = (review.accuracyRating + review.communicationRating + review.conditionRating) / 3;
        return sum + avg;
      }, 0);
      avgRating = totalRating / reviewCount;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
        role: user.role,
        listing: user.listing ? {
          ...user.listing,
          reviews: undefined, // Remove reviews from listing object
        } : null,
        reviewStats: {
          count: reviewCount,
          avgRating: Number(avgRating.toFixed(1)),
        },
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
