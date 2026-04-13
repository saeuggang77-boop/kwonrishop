import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthlyAiUsage, checkBudgetStatus } from "@/lib/ai-usage";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 401 });
    }

    // 1. 전체 유령회원 수
    const totalGhosts = await prisma.user.count({
      where: { isGhost: true },
    });

    // 2. 원고 풀 통계
    const [unusedPosts, usedPosts, unusedComments, usedComments, unusedReplies, usedReplies] = await Promise.all([
      prisma.contentPool.count({
        where: { type: "POST", isUsed: false },
      }),
      prisma.contentPool.count({
        where: { type: "POST", isUsed: true },
      }),
      prisma.contentPool.count({
        where: { type: "COMMENT", isUsed: false },
      }),
      prisma.contentPool.count({
        where: { type: "COMMENT", isUsed: true },
      }),
      prisma.contentPool.count({
        where: { type: "REPLY", isUsed: false },
      }),
      prisma.contentPool.count({
        where: { type: "REPLY", isUsed: true },
      }),
    ]);

    // 3. 오늘 고스트가 생성한 게시글/댓글 수 (KST 자정 기준)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstNow = new Date(now.getTime() + kstOffset);
    const todayStart = new Date(
      Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) - kstOffset
    );

    const [todayPosts, allTodayComments] = await Promise.all([
      prisma.post.count({
        where: {
          createdAt: { gte: todayStart },
          author: { isGhost: true },
        },
      }),
      prisma.comment.count({
        where: {
          createdAt: { gte: todayStart },
          author: { isGhost: true },
        },
      }),
    ]);

    const todayTopLevelComments = await prisma.comment.count({
      where: {
        createdAt: { gte: todayStart },
        author: { isGhost: true },
        parentId: null,
      },
    });

    const todayReplies = allTodayComments - todayTopLevelComments;

    // 4. 성격별 유령회원 수
    const ghostsByPersonality = await prisma.user.groupBy({
      by: ["ghostPersonality"],
      where: { isGhost: true },
      _count: true,
    });

    return NextResponse.json({
      poolStats: [
        {
          type: "POST",
          total: unusedPosts + usedPosts,
          used: usedPosts,
          remaining: unusedPosts,
        },
        {
          type: "COMMENT",
          total: unusedComments + usedComments,
          used: usedComments,
          remaining: unusedComments,
        },
        {
          type: "REPLY",
          total: unusedReplies + usedReplies,
          used: usedReplies,
          remaining: unusedReplies,
        },
      ],
      ghostStats: ghostsByPersonality.map((g) => ({
        personality: g.ghostPersonality || "UNKNOWN",
        count: g._count,
      })),
      totalGhostUsers: totalGhosts,
      todayActivity: {
        posts: todayPosts,
        comments: todayTopLevelComments,
        replies: todayReplies,
      },
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "통계 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
