import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json(
        { error: { message: "관리자 권한이 필요합니다." } },
        { status: 403 }
      );
    }

    const posts = await prisma.boardPost.findMany({
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ data: posts });
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
    const { category, title, content, thumbnailUrl, isPublished } = body;

    if (!category || !title || !content) {
      return Response.json(
        { error: { message: "필수 필드가 누락되었습니다." } },
        { status: 400 }
      );
    }

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
