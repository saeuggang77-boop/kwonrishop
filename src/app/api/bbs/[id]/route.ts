import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorToResponse } from "@/lib/utils/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await prisma.boardPost.findUnique({
      where: { id },
    });

    if (!post) {
      return Response.json(
        { error: { message: "게시글을 찾을 수 없습니다." } },
        { status: 404 }
      );
    }

    if (!post.isPublished) {
      return Response.json(
        { error: { message: "공개되지 않은 게시글입니다." } },
        { status: 403 }
      );
    }

    // Increment view count
    await prisma.boardPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return Response.json({ data: { ...post, viewCount: post.viewCount + 1 } });
  } catch (error) {
    return errorToResponse(error);
  }
}
