import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sendPushToUser } from "@/lib/push";

// 판매자 답변 작성
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(req, 10, 60000);
  if (rateLimitError) return rateLimitError;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: reviewId } = await params;

  try {
    const body = await req.json();
    const { answer } = body;

    if (!answer || answer.trim().length === 0) {
      return NextResponse.json(
        { error: "답변 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (answer.length > 2000) {
      return NextResponse.json(
        { error: "답변 내용은 2000자를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // Q&A 조회 및 권한 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        listing: {
          select: {
            userId: true,
            storeName: true,
            addressRoad: true,
          },
        },
        reviewer: {
          select: { id: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "질문을 찾을 수 없습니다." }, { status: 404 });
    }

    // 매물 소유자만 답변 가능
    if (review.listing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인 매물의 질문에만 답변할 수 있습니다." },
        { status: 403 }
      );
    }

    // 답변 저장
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        answer: sanitizeHtml(answer),
        answeredAt: new Date(),
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

    // 질문 작성자에게 알림 전송 (non-blocking)
    (async () => {
      try {
        const storeName = review.listing.storeName || review.listing.addressRoad || "매물";
        await prisma.notification.create({
          data: {
            userId: review.reviewer.id,
            type: "ANSWER_RECEIVED",
            title: `${storeName} 질문에 답변이 등록되었습니다`,
            message: answer.slice(0, 100),
            link: `/listings/${review.listingId}`,
          },
        });

        sendPushToUser(
          review.reviewer.id,
          `${storeName} 답변 도착`,
          answer.slice(0, 100),
          `/listings/${review.listingId}`
        ).catch(() => {});
      } catch (err) {
        console.error("[Answer] 알림 전송 실패:", err);
      }
    })();

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("답변 작성 오류:", error);
    return NextResponse.json(
      { error: "답변 작성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
