import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 특정 매물의 리뷰 조회 (동일한 기능을 경로별로 제공)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const reviews = await prisma.review.findMany({
      where: { listingId: id },
      include: {
        reviewer: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 평균 평점 계산
    const averageRatings = reviews.length > 0 ? {
      accuracy: reviews.reduce((sum, r) => sum + r.accuracyRating, 0) / reviews.length,
      communication: reviews.reduce((sum, r) => sum + r.communicationRating, 0) / reviews.length,
      condition: reviews.reduce((sum, r) => sum + r.conditionRating, 0) / reviews.length,
      overall: reviews.reduce(
        (sum, r) => sum + (r.accuracyRating + r.communicationRating + r.conditionRating) / 3,
        0
      ) / reviews.length,
    } : null;

    return NextResponse.json({
      reviews,
      averageRatings,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("리뷰 조회 오류:", error);
    return NextResponse.json(
      { error: "리뷰 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
