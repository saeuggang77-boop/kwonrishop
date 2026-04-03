import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 마이페이지: 내가 받은 Q&A + 내가 작성한 Q&A 조회
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    // 내가 받은 Q&A (내 매물에 달린 질문) - 실명 표시
    const receivedReviews = await prisma.review.findMany({
      where: {
        listing: {
          userId: session.user.id,
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            storeName: true,
          },
        },
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

    // 내가 작성한 Q&A
    const writtenReviews = await prisma.review.findMany({
      where: {
        reviewerId: session.user.id,
      },
      include: {
        listing: {
          select: {
            id: true,
            storeName: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 평점 필드 제거
    const receivedQnA = receivedReviews.map((r) => ({
      id: r.id,
      content: r.content,
      answer: r.answer,
      answeredAt: r.answeredAt,
      createdAt: r.createdAt,
      listing: r.listing,
      reviewer: r.reviewer,
    }));

    const writtenQnA = writtenReviews.map((r) => ({
      id: r.id,
      content: r.content,
      answer: r.answer,
      answeredAt: r.answeredAt,
      createdAt: r.createdAt,
      listing: r.listing,
    }));

    return NextResponse.json({
      received: receivedQnA,
      written: writtenQnA,
    });
  } catch (error) {
    console.error("마이페이지 Q&A 조회 오류:", error);
    return NextResponse.json(
      { error: "Q&A 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
