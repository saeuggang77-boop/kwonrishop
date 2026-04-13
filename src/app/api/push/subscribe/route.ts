import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

/**
 * POST: FCM 토큰 등록/갱신
 * 로그인한 사용자의 FCM 토큰을 DB에 저장합니다.
 */
export async function POST(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(request, 20, 60000);
  if (rateLimitError) return rateLimitError;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { token, device } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "유효한 토큰이 필요합니다." }, { status: 400 });
    }

    // upsert: 토큰이 이미 존재하면 사용자 업데이트, 없으면 생성
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId: session.user.id,
        device: device || "web",
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        token,
        device: device || "web",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push Subscribe] Error:", error);
    return NextResponse.json(
      { error: "토큰 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE: FCM 토큰 삭제
 * 푸시 알림 비활성화 시 호출합니다.
 */
export async function DELETE(request: NextRequest) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "토큰이 필요합니다." }, { status: 400 });
    }

    await prisma.pushToken.deleteMany({
      where: {
        userId: session.user.id,
        token,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push Unsubscribe] Error:", error);
    return NextResponse.json(
      { error: "토큰 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
