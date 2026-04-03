import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sendPushToUser } from "@/lib/push";

// Q&A 질문 생성
export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { listingId, content } = body;

    // 필수 필드 검증
    if (!listingId || !content) {
      return NextResponse.json(
        { error: "매물 ID와 질문 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    // content 길이 제한 (최대 2000자)
    if (content.length > 2000) {
      return NextResponse.json(
        { error: "질문 내용은 2000자를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // 매물 존재 및 소유자 확인
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true, status: true, storeName: true, addressRoad: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "매물을 찾을 수 없습니다." }, { status: 404 });
    }

    // 본인 매물 질문 방지
    if (listing.userId === session.user.id) {
      return NextResponse.json(
        { error: "본인의 매물에는 질문할 수 없습니다." },
        { status: 403 }
      );
    }

    // Q&A 생성 (평점 필드 제거, 중복 체크 제거)
    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        listingId,
        content: sanitizeHtml(content),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 판매자에게 알림 전송 (non-blocking)
    (async () => {
      try {
        const storeName = listing.storeName || listing.addressRoad || "매물";
        await prisma.notification.create({
          data: {
            userId: listing.userId,
            type: "QUESTION_RECEIVED",
            title: `${storeName}에 새 질문이 등록되었습니다`,
            message: content.slice(0, 100),
            link: `/listings/${listingId}`,
          },
        });

        sendPushToUser(
          listing.userId,
          `${storeName}에 새 질문`,
          content.slice(0, 100),
          `/listings/${listingId}`
        ).catch(() => {});
      } catch (err) {
        console.error("[Q&A] 알림 전송 실패:", err);
      }
    })();

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Q&A 질문 생성 오류:", error);
    return NextResponse.json(
      { error: "질문 작성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 특정 매물의 Q&A 목록 조회
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
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 실명 표시, 평점 제거
    const qnaList = reviews.map((review) => ({
      id: review.id,
      content: review.content,
      answer: review.answer,
      answeredAt: review.answeredAt,
      createdAt: review.createdAt,
      isOwn: session?.user?.id === review.reviewerId,
      reviewer: {
        id: review.reviewer.id,
        name: review.reviewer.name,
        image: review.reviewer.image,
      },
    }));

    return NextResponse.json({
      questions: qnaList,
      totalQuestions: reviews.length,
    });
  } catch (error) {
    console.error("Q&A 조회 오류:", error);
    return NextResponse.json(
      { error: "Q&A 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
