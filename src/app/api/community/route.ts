import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";

const postSelectFields = {
  id: true,
  title: true,
  tag: true,
  viewCount: true,
  likeCount: true,
  createdAt: true,
  author: { select: { id: true, name: true, image: true } },
  _count: { select: { comments: true } },
};

// 게시글 목록
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const tag = searchParams.get("tag");

  // 전체 보기: 공지 상단 고정 + 나머지 최신순
  if (!tag) {
    const [notices, posts, total] = await Promise.all([
      page === 1
        ? prisma.post.findMany({
            where: { tag: "공지" },
            orderBy: { createdAt: "desc" },
            select: postSelectFields,
          })
        : Promise.resolve([]),
      prisma.post.findMany({
        where: { NOT: { tag: "공지" } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: postSelectFields,
      }),
      prisma.post.count({ where: { NOT: { tag: "공지" } } }),
    ]);

    return NextResponse.json({
      posts: [...notices, ...posts],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  }

  // 특정 태그 필터
  const where = { tag };
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: postSelectFields,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}

// 게시글 작성
export async function POST(req: NextRequest) {
  // Rate limiting: 5 posts per minute
  const limiter = rateLimitRequest(req, 15, 60000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: "게시글 작성이 너무 빠릅니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // CSRF protection
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { title, content, tag } = await req.json();

  // 공지 태그는 관리자만 작성 가능
  if (tag === "공지") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "공지는 관리자만 작성할 수 있습니다." }, { status: 403 });
    }
  }

  // Sanitize inputs (title uses sanitizeInput, content uses sanitizeHtml for XSS prevention)
  const cleanTitle = sanitizeInput(title);
  const cleanContent = sanitizeHtml(content);

  if (!cleanTitle?.trim() || !cleanContent?.trim()) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      authorId: session.user.id,
      title: cleanTitle.trim(),
      content: cleanContent.trim(),
      tag: tag || null,
    },
  });

  return NextResponse.json({ id: post.id, success: true });
}
