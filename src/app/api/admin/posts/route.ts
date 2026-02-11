import { NextRequest } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

const postCreateSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  thumbnailUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "50"),
      100
    );

    const [posts, total] = await Promise.all([
      prisma.boardPost.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.boardPost.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      data: posts,
      meta: { total, page, limit, totalPages },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = postCreateSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { message: "유효하지 않은 입력입니다.", details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { category, title, content, thumbnailUrl, isPublished } = parsed.data;

    const post = await prisma.boardPost.create({
      data: {
        authorId: session.user.id,
        category,
        title,
        content,
        thumbnailUrl: thumbnailUrl ?? null,
        isPublished: isPublished ?? true,
      },
    });

    return Response.json({ data: post }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
