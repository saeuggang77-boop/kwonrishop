import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBearerToken } from "@/lib/cron-auth";
import { rateLimitRequest } from "@/lib/rate-limit";
import { syncAllDisclosures } from "@/lib/api/ftc-disclosure";

/**
 * 크론잡: 공정위 정보공개서 동기화
 * - 정보공개서 목록 API에서 사업자번호, ftcDocId 매칭
 * - 본문 HTML 파싱으로 대표자명, 가맹비, 교육비, 보증금 추출
 * - 통계 API 크론(sync-franchise)과 분리하여 timeout 방지
 * - 매주 월요일 새벽 5시 실행 권장 (통계 API 이후)
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

    const rateLimitError = await rateLimitRequest(request, 1, 300000); // 5분에 1회
    if (rateLimitError) return rateLimitError;

    if (!process.env.FTC_DISCLOSURE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "FTC_DISCLOSURE_API_KEY not configured",
      }, { status: 500 });
    }

    const yr = new Date().getFullYear().toString();

    console.log(`[CronDisclosure] 정보공개서 동기화 시작`);

    const result = await syncAllDisclosures(prisma, {
      years: [yr, String(parseInt(yr) - 1)],
      delayMs: 300,
      maxContentFetch: 30, // Vercel 60초 timeout 내에서 안전하게
      onProgress: (msg) => console.log(`[CronDisclosure] ${msg}`),
    });

    console.log(`[CronDisclosure] 완료: matched=${result.matched}, parsed=${result.contentParsed}, errors=${result.errors}`);

    return NextResponse.json({
      success: true,
      ...result,
      year: yr,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CronDisclosure] 정보공개서 동기화 크론잡 오류:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
