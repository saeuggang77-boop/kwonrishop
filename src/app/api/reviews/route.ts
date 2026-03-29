import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// 리뷰 생성
export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = rateLimit(ip, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { listingId, accuracyRating, communicationRating, conditionRating, content } = body;

    // 필수 필드 검증
    if (!listingId || !accuracyRating || !communicationRating || !conditionRating) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 평점 범위 검증 (1-5)
    if (
      accuracyRating < 1 || accuracyRating > 5 ||
      communicationRating < 1 || communicationRating > 5 ||
      conditionRating < 1 || conditionRating > 5
    ) {
      return NextResponse.json(
        { error: "평점은 1-5 사이의 값이어야 합니다." },
        { status: 400 }
      );
    }

    // 매물 존재 및 소유자 확인
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }

    // 본인 매물 리뷰 방지
    if (listing.userId === session.user.id) {
      return NextResponse.json(
        { error: "본인의 매물에는 리뷰를 작성할 수 없습니다." },
        { status: 403 }
      );
    }

    // 중복 리뷰 확인 (@@unique [reviewerId, listingId])
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_listingId: {
          reviewerId: session.user.id,
          listingId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "이미 이 매물에 리뷰를 작성하셨습니다." },
        { status: 400 }
      );
    }

    // 리뷰 생성
    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        listingId,
        accuracyRating,
        communicationRating,
        conditionRating,
        content: content ? sanitizeHtml(content) : null,
      },
      include: {
        reviewer: {
          select: {
            id: true,
          },
        },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("리뷰 생성 오류:", error);
    return NextResponse.json(
      { error: "리뷰 작성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 특정 매물의 리뷰 조회
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const listingId = searchParams.get("listingId");

  if (!listingId) {
    return NextResponse.json(
      { error: "listingId 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    const reviews = await prisma.review.findMany({
      where: { listingId },
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

    // 리뷰 익명화 처리
    const anonymizedReviews = reviews.map((review, index) => ({
      ...review,
      isOwn: session?.user?.id === review.reviewerId,
      reviewer: {
        id: review.reviewerId, // 본인 리뷰 삭제를 위해 ID는 유지 (프론트에서 isOwn 사용)
        name: `익명 ${index + 1}`,
      },
    }));

    return NextResponse.json({
      reviews: anonymizedReviews,
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
