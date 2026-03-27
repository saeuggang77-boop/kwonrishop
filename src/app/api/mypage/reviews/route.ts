import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 마이페이지: 내가 받은 리뷰 + 내가 작성한 리뷰 조회
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    // 내가 받은 리뷰 (내 매물에 달린 리뷰)
    const receivedReviews = await prisma.review.findMany({
      where: {
        listing: {
          userId: session.user.id,
        },
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        listing: {
          select: {
            id: true,
            storeName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 내가 작성한 리뷰
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

    return NextResponse.json({
      received: receivedReviews,
      written: writtenReviews,
    });
  } catch (error) {
    console.error("마이페이지 리뷰 조회 오류:", error);
    return NextResponse.json(
      { error: "리뷰 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
