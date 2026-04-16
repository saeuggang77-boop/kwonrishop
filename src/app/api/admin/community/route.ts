import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitRequest } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const rateLimitError = await rateLimitRequest(req, 60, 60000);
  if (rateLimitError) return rateLimitError;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 접근 가능합니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const keyword = searchParams.get("keyword")?.trim() || "";
  const userType = searchParams.get("userType") || "ALL"; // ALL | ghost | normal
  const sort = searchParams.get("sort") || "recent"; // recent | oldest | views | comments

  const where: Record<string, unknown> = {};

  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { content: { contains: keyword, mode: "insensitive" } },
    ];
  }

  if (userType === "ghost") {
    where.author = { isGhost: true };
  } else if (userType === "normal") {
    where.author = { isGhost: false };
  }

  type PostOrderBy =
    | { createdAt: "asc" | "desc" }
    | { viewCount: "asc" | "desc" }
    | { comments: { _count: "asc" | "desc" } };

  const orderByMap: Record<string, PostOrderBy> = {
    recent: { createdAt: "desc" },
    oldest: { createdAt: "asc" },
    views: { viewCount: "desc" },
    comments: { comments: { _count: "desc" } },
  };
  const orderBy: PostOrderBy = orderByMap[sort] ?? { createdAt: "desc" };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        tag: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            isGhost: true,
          },
        },
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
