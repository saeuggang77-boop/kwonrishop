import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBearerToken } from "@/lib/cron-auth";
import { rateLimitRequest } from "@/lib/rate-limit";
import { listAllFranchiseBrands } from "@/lib/api/ftc";

/**
 * 크론잡: 공정위 프랜차이즈 브랜드 자동 동기화
 * - 공정위 API에서 전체 브랜드 목록을 가져와 DB에 upsert
 * - 매주 월요일 새벽 4시 실행 권장
 * - 11,834개 브랜드를 100건씩 페이지 순회
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

    const rl = rateLimitRequest(request, 1, 300000); // 5분에 1회
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const yr = new Date().getFullYear().toString();
    const pageSize = 100;
    let page = 1;
    let totalSynced = 0;
    let totalPages = 1;

    console.log(`[CronSync] 공정위 프랜차이즈 동기화 시작 (yr=${yr})`);

    // 전체 페이지 순회
    do {
      const result = await listAllFranchiseBrands(page, pageSize, yr);
      totalPages = result.totalPages;

      for (const brand of result.brands) {
        try {
          const ftcId = `${brand.companyName}_${brand.brandName}`.replace(/\s+/g, "");

          await prisma.franchiseBrand.upsert({
            where: { ftcId },
            update: {
              brandName: brand.brandName,
              companyName: brand.companyName,
              industry: brand.industry,
              totalStores: brand.totalStores || 0,
              avgRevenue: brand.avgRevenue || 0,
              ftcRawData: {
                newStores: brand.newStores,
                contractEnd: brand.contractEnd,
                contractCancel: brand.contractCancel,
                revenuePerArea: brand.revenuePerArea,
                year: brand.year,
              },
              // managerId, tier, tierExpiresAt 등은 변경하지 않음 (유료회원 보호)
            },
            create: {
              ftcId,
              brandName: brand.brandName,
              companyName: brand.companyName,
              industry: brand.industry,
              totalStores: brand.totalStores || 0,
              avgRevenue: brand.avgRevenue || 0,
              tier: "FREE",
              ftcRawData: {
                newStores: brand.newStores,
                contractEnd: brand.contractEnd,
                contractCancel: brand.contractCancel,
                revenuePerArea: brand.revenuePerArea,
                year: brand.year,
              },
            },
          });
          totalSynced++;
        } catch (err) {
          console.error(`[CronSync] 브랜드 upsert 실패: ${brand.brandName}`, err);
        }
      }

      console.log(`[CronSync] 페이지 ${page}/${totalPages} 완료 (${result.brands.length}건)`);
      page++;
    } while (page <= totalPages);

    console.log(`[CronSync] 동기화 완료: ${totalSynced}건`);

    return NextResponse.json({
      success: true,
      totalSynced,
      totalPages,
      year: yr,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CronSync] 공정위 동기화 크론잡 오류:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
