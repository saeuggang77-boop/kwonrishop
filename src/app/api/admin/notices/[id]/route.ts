import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

// DELETE - 공지사항 삭제 (관리자만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rateLimitError = await rateLimitRequest(request, 10, 60000);
  if (rateLimitError) return rateLimitError;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const { id } = await params;

    // 공지사항인지 확인
    const notice = await prisma.post.findUnique({
      where: { id },
    });

    if (!notice || notice.tag !== "공지") {
      return NextResponse.json(
        { error: "공지사항을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("공지사항 삭제 오류:", error);
    return NextResponse.json(
      { error: "공지사항 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
