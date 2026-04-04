import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 20, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: postId } = await params;

  // 사이트이용문의: 작성자와 관리자만 댓글 작성 가능
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { tag: true, authorId: true },
  });
  if (post?.tag === "사이트이용문의") {
    const isAuthor = post.authorId === session.user.id;
    if (!isAuthor) {
      const viewer = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      if (viewer?.role !== "ADMIN") {
        return NextResponse.json({ error: "작성자와 관리자만 댓글을 작성할 수 있습니다." }, { status: 403 });
      }
    }
  }

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
