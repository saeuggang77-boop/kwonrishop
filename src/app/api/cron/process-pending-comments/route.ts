import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBearerToken } from "@/lib/cron-auth";

/**
 * 예약 댓글/답글 발행 프로세서 - 매 5분 실행
 * PendingComment 테이블에서 scheduledFor <= now 인 항목을 Comment 테이블로 이관
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!verifyBearerToken(authHeader, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 처리 대상 조회 (scheduledFor <= now AND status = PENDING, 최대 50개)
    const pending = await prisma.pendingComment.findMany({
      where: {
        scheduledFor: { lte: now },
        status: "PENDING",
      },
      orderBy: { scheduledFor: "asc" },
      take: 50,
    });

    if (pending.length === 0) {
      return NextResponse.json({ message: "No pending comments to process", processed: 0 });
    }

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of pending) {
      // 동시성 락: PENDING → PROCESSING
      const updated = await prisma.pendingComment.updateMany({
        where: { id: item.id, status: "PENDING" },
        data: { status: "PROCESSING" },
      });

      // 다른 워커가 먼저 처리 중이면 건너뜀
      if (updated.count === 0) {
        skipped++;
        continue;
      }

      try {
        // 답글인 경우: 부모 PendingComment가 이미 발행됐는지 확인
        let parentCommentId: string | null = null;

        if (item.parentPendingId) {
          const parentPending = await prisma.pendingComment.findUnique({
            where: { id: item.parentPendingId },
            select: { status: true, createdCommentId: true },
          });

          if (!parentPending || parentPending.status !== "COMPLETED" || !parentPending.createdCommentId) {
            // 부모가 아직 발행 안 됨 → 다음 크론에서 재시도
            await prisma.pendingComment.update({
              where: { id: item.id },
              data: { status: "PENDING" },
            });
            skipped++;
            continue;
          }

          // 부모가 이미 답글(parentId 있는)인 경우 2단 평탄화
          const parentComment = await prisma.comment.findUnique({
            where: { id: parentPending.createdCommentId },
            select: { parentId: true },
          });

          if (parentComment?.parentId) {
            // 부모가 답글이면 그 부모(최상위)로 연결
            parentCommentId = parentComment.parentId;
          } else {
            parentCommentId = parentPending.createdCommentId;
          }
        }

        // Comment 테이블에 insert
        const comment = await prisma.comment.create({
          data: {
            authorId: item.authorId,
            postId: item.postId,
            content: item.content,
            parentId: parentCommentId,
            createdAt: item.scheduledFor,
          },
        });

        // PendingComment 완료 처리
        await prisma.pendingComment.update({
          where: { id: item.id },
          data: {
            status: "COMPLETED",
            createdCommentId: comment.id,
          },
        });

        // 댓글 발행 시 조회수 증가 (+2~5)
        const viewIncrement = Math.floor(Math.random() * 4) + 2;
        await prisma.post.update({
          where: { id: item.postId },
          data: { viewCount: { increment: viewIncrement } },
        });

        processed++;
      } catch (error) {
        console.error(`PendingComment ${item.id} 처리 실패:`, error);

        const newRetryCount = item.retryCount + 1;
        const newStatus = newRetryCount >= 3 ? "FAILED" : "PENDING";

        await prisma.pendingComment.update({
          where: { id: item.id },
          data: {
            status: newStatus,
            retryCount: newRetryCount,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });

        failed++;
      }
    }

    return NextResponse.json({
      message: "Pending comments processed",
      processed,
      skipped,
      failed,
      total: pending.length,
    });
  } catch (error) {
    console.error("process-pending-comments cron error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
