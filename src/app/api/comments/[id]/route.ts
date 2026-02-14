import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ---------------------------------------------------------------------------
// DELETE /api/comments/[id] — delete a comment (and its replies via cascade)
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "인증이 필요합니다" },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const comment = await prisma.listingComment.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인의 댓글만 삭제할 수 있습니다" },
        { status: 403 }
      );
    }

    // Delete the comment — cascade will remove replies too
    await prisma.listingComment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "댓글 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
