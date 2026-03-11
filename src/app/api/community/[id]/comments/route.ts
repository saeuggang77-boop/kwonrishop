import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: postId } = await params;
  const { content, parentId } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "댓글을 입력해주세요." }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: session.user.id,
      content: sanitizeInput(content).trim(),
      parentId: parentId || null,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(comment);
}
