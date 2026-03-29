import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";

/**
 * DELETE /api/bump-subscriptions/[id]
 * 끌어올리기 구독 취소
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF 보호
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: "잘못된 요청 출처입니다." },
        { status: 403 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 구독 존재 여부 및 소유권 확인
    const subscription = await prisma.bumpSubscription.findUnique({
      where: { id },
      select: {
        userId: true,
        status: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "구독을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (subscription.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인의 구독만 취소할 수 있습니다." },
        { status: 403 }
      );
    }

    if (subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "이미 취소되었거나 만료된 구독입니다." },
        { status: 400 }
      );
    }

    // 구독 취소 처리
    await prisma.bumpSubscription.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] DELETE /api/bump-subscriptions/[id] error:", error);
    return NextResponse.json(
      { error: "구독 취소 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
