import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, image: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, name: true, image: true } },
            },
          },
        },
        where: { parentId: null },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  // 사이트이용문의: 작성자와 관리자만 내용 열람 가능
  if (post.tag === "사이트이용문의") {
    const session = await getServerSession(authOptions);
    const isAuthor = session?.user?.id === post.author.id;
    let isAdmin = false;
    if (session?.user?.id && !isAuthor) {
      const viewer = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      isAdmin = viewer?.role === "ADMIN";
    }

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({
        ...post,
        viewCount: post.viewCount + 1,
        content: "",
        comments: [],
        isRestricted: true,
      });
    }
  }

  return NextResponse.json({ ...post, viewCount: post.viewCount + 1 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const { title, content, tag } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  // 작성자 본인 또는 관리자만 수정 가능
  const editorRole = post.authorId === session.user.id
    ? null
    : (await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      }))?.role;
  if (post.authorId !== session.user.id && editorRole !== "ADMIN") {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  }

  // 공지 태그는 관리자만 (작성자가 본인이어도 ADMIN이 아니면 차단)
  if (tag === "공지") {
    const role = editorRole ?? (await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }))?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "공지는 관리자만 작성할 수 있습니다." }, { status: 403 });
    }
  }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      title: sanitizeInput(title),
      content: sanitizeHtml(content),
      tag: tag ? sanitizeInput(tag) : null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  // 작성자 또는 관리자만 삭제 가능
  if (post.authorId !== session.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
    }
  }

  // 댓글 먼저 삭제 (대댓글 → 댓글 순)
  await prisma.comment.deleteMany({
    where: { post: { id }, parentId: { not: null } },
  });
  await prisma.comment.deleteMany({
    where: { postId: id },
  });
  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
