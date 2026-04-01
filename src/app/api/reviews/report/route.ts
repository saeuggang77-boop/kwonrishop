import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { validateOrigin } from "@/lib/csrf";
import { rateLimitRequest } from "@/lib/rate-limit";

// 리뷰 신고
export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const rl = rateLimitRequest(req, 5, 60000); // 1분에 5회 제한
  if (!rl.success) {
    return NextResponse.json({ error: "요청이 너무 많습니다." }, { status: 429 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { reviewId, reason, detail } = body;

    // 필수 필드 검증
    if (!reviewId || !reason) {
      return NextResponse.json(
        { error: "리뷰 ID와 신고 사유를 입력해주세요." },
        { status: 400 }
      );
    }

    // 신고 사유 검증
    const validReasons = ["SPAM", "ABUSE", "FALSE_INFO", "OTHER"];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "올바른 신고 사유를 선택해주세요." },
        { status: 400 }
      );
    }

    // 리뷰 존재 확인
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, reviewerId: true },
    });

    if (!review) {
      return NextResponse.json({ error: "리뷰를 찾을 수 없습니다." }, { status: 404 });
    }

    // 본인 리뷰 신고 방지
    if (review.reviewerId === session.user.id) {
      return NextResponse.json(
        { error: "본인이 작성한 리뷰는 신고할 수 없습니다." },
        { status: 403 }
      );
    }

    // 중복 신고 확인 (같은 사용자가 같은 리뷰를 이미 신고했는지)
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        targetType: "REVIEW",
        targetId: reviewId,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "이미 이 리뷰를 신고하셨습니다." },
        { status: 400 }
      );
    }

    // 신고 생성
    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType: "REVIEW",
        targetId: reviewId,
        reason,
        detail: detail ? sanitizeHtml(detail) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { message: "신고가 접수되었습니다.", reportId: report.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("리뷰 신고 오류:", error);
    return NextResponse.json(
      { error: "신고 접수 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
