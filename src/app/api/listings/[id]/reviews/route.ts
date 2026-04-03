import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 특정 매물의 Q&A 조회 (동일한 기능을 경로별로 제공)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await getServerSession(authOptions);

    const reviews = await prisma.review.findMany({
      where: { listingId: id },
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
