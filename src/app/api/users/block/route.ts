import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

// 차단 목록 조회
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const blocks = await prisma.block.findMany({
    where: { userId: session.user.id },
    include: {
      blocked: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(blocks);
}

// 차단하기
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

  const { blockedId } = await req.json();

  if (!blockedId) {
    return NextResponse.json({ error: "차단할 사용자 ID가 필요합니다." }, { status: 400 });
  }

  if (blockedId === session.user.id) {
    return NextResponse.json({ error: "자기 자신을 차단할 수 없습니다." }, { status: 400 });
  }

  // 대상 사용자 존재 확인
  const targetUser = await prisma.user.findUnique({
    where: { id: blockedId },
    select: { id: true },
  });
  if (!targetUser) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
  }

  // 이미 차단했는지 확인
  const existing = await prisma.block.findUnique({
    where: { userId_blockedId: { userId: session.user.id, blockedId } },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 차단한 사용자입니다." }, { status: 400 });
  }

  await prisma.block.create({
    data: { userId: session.user.id, blockedId },
  });

  return NextResponse.json({ success: true, message: "사용자를 차단했습니다." });
}

// 차단 해제
export async function DELETE(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const blockedId = searchParams.get("blockedId");

  if (!blockedId) {
    return NextResponse.json({ error: "차단 해제할 사용자 ID가 필요합니다." }, { status: 400 });
  }

  const block = await prisma.block.findUnique({
    where: { userId_blockedId: { userId: session.user.id, blockedId } },
  });
  if (!block) {
    return NextResponse.json({ error: "차단 내역이 없습니다." }, { status: 404 });
  }

  await prisma.block.delete({
    where: { id: block.id },
  });

  return NextResponse.json({ success: true, message: "차단을 해제했습니다." });
}
