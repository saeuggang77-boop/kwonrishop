import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - 공지사항 목록 조회 (누구나 가능)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active") === "true";
    const limit = searchParams.get("limit");

    const where = {
      tag: "공지",
    };

    const notices = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : undefined,
      include: {
        author: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error("공지사항 조회 오류:", error);
    return NextResponse.json(
      { error: "공지사항을 불러오지 못했습니다" },
      { status: 500 }
    );
  }
}

// POST - 공지사항 작성 (관리자만)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    const notice = await prisma.post.create({
      data: {
        title,
        content,
        tag: "공지",
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error("공지사항 작성 오류:", error);
    return NextResponse.json(
      { error: "공지사항 작성에 실패했습니다" },
      { status: 500 }
    );
  }
}
