import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBearerToken } from "@/lib/cron-auth";
import { rateLimitRequest } from "@/lib/rate-limit";

/**
 * 크론잡: PENDING 결제 자동 정리
 * - 30분 이상 PENDING 상태인 AdPurchase → CANCELLED로 변경
 * - 결제 미완료 건의 DB 오염 방지
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
    }

    if (!verifyBearerToken(authHeader, cronSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitError = await rateLimitRequest(request, 2, 60000);
    if (rateLimitError) return rateLimitError;

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const result = await prisma.adPurchase.updateMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: thirtyMinutesAgo,
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} stale PENDING payments`);
    }

    return NextResponse.json({
      success: true,
      cancelledCount: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cleanup pending cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
