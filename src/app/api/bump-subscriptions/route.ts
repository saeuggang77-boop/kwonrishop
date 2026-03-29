import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/bump-subscriptions
 * 사용자의 끌어올리기 구독 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const subscriptions = await prisma.bumpSubscription.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        listingId: true,
        equipmentId: true,
        frequency: true,
        bumpTimes: true,
        nextBumpAt: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        cancelledAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("[API] GET /api/bump-subscriptions error:", error);
    return NextResponse.json(
      { error: "구독 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
