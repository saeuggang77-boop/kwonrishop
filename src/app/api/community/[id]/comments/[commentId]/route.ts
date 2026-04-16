import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(req, 20, 60000);
  if (rateLimitError) return rateLimitError;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { commentId } = await params;

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "댓글을 찾을 수 없습니다." }, { status: 404 });
  }

  // 작성자 본인 또는 관리자만 수정 가능
  if (existing.authorId !== session.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
    }
  }

  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "댓글 내용을 입력해주세요." }, { status: 400 });
  }
  if (content.trim().length > 500) {
    return NextResponse.json({ error: "댓글은 500자 이내로 입력해주세요." }, { status: 400 });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      content: sanitizeInput(content).trim(),
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ success: true, comment: updated });
}
