import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeHtml, sanitizeInput } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";

// 게시글 목록
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const tag = searchParams.get("tag");

  const where: Record<string, unknown> = {};
  if (tag) where.tag = tag;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        tag: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// 게시글 작성
export async function POST(req: NextRequest) {
  // Rate limiting: 5 posts per minute
  const ip = getClientIp(req);
  const limiter = rateLimit(ip, 5, 60000);
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
