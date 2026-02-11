import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "30");

    const where: Record<string, unknown> = { isPublished: true };
    if (category) where.category = category;

    const [posts, total] = await Promise.all([
      prisma.boardPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.boardPost.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
