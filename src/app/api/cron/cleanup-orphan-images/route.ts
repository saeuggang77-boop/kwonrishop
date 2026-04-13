import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBearerToken } from "@/lib/cron-auth";
import { rateLimitRequest } from "@/lib/rate-limit";
import { deleteFromS3, isS3Configured } from "@/lib/s3";
import { unlink, readdir } from "fs/promises";
import path from "path";

/**
 * 크론잡: 고아 이미지 정리
 * - 24시간 이상 된 업로드 파일 중 DB에 연결되지 않은 이미지 삭제
 * - 매일 새벽 3시 실행 권장
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
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
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24시간 전

    let deletedCount = 0;

    if (isS3Configured()) {
      // S3 환경: DB에서 사용 중인 모든 이미지 URL 수집
      const [listingImages, listingDocs, partnerImages, equipmentImages] = await Promise.all([
        prisma.listingImage.findMany({ select: { url: true } }),
        prisma.listingDocument.findMany({ select: { url: true } }),
        prisma.partnerImage.findMany({ select: { url: true } }),
        prisma.equipmentImage.findMany({ select: { url: true } }),
      ]);

      const usedUrls = new Set([
        ...listingImages.map(img => img.url),
        ...listingDocs.map(doc => doc.url),
        ...partnerImages.map(img => img.url),
        ...equipmentImages.map(img => img.url),
      ]);

      // S3의 모든 파일 목록 가져오기는 비용이 많이 들므로
      // 로컬 임시 테이블이나 별도 추적 시스템 필요
      // 현재는 cleanup API를 통한 즉시 삭제로 처리
      console.log("S3 환경: cleanup API를 통한 즉시 삭제 방식 사용");
    } else {
      // 로컬 파일시스템: 고아 파일 직접 스캔
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      try {
        const files = await readdir(uploadDir);

        // DB에서 사용 중인 모든 파일명 수집
        const [listingImages, listingDocs, partnerImages, equipmentImages] = await Promise.all([
          prisma.listingImage.findMany({ select: { url: true } }),
          prisma.listingDocument.findMany({ select: { url: true } }),
          prisma.partnerImage.findMany({ select: { url: true } }),
          prisma.equipmentImage.findMany({ select: { url: true } }),
        ]);

        const usedFilenames = new Set([
          ...listingImages.map(img => img.url.replace("/uploads/", "")),
          ...listingDocs.map(doc => doc.url.replace("/uploads/", "")),
          ...partnerImages.map(img => img.url.replace("/uploads/", "")),
          ...equipmentImages.map(img => img.url.replace("/uploads/", "")),
        ]);

        // 24시간 이상 된 고아 파일 삭제
        for (const filename of files) {
          if (!usedFilenames.has(filename)) {
            // 파일명에서 타임스탬프 추출 (예: 1234567890-abc123.jpg)
            const timestamp = parseInt(filename.split("-")[0]);

            if (!isNaN(timestamp) && timestamp < cutoffTime.getTime()) {
              try {
                const filePath = path.join(uploadDir, filename);
                await unlink(filePath);
                deletedCount++;
              } catch (error) {
                console.error(`파일 삭제 실패: ${filename}`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error("업로드 디렉토리 읽기 실패:", error);
      }
    }

    console.log(`고아 이미지 정리 완료: ${deletedCount}개 삭제`);

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("고아 이미지 정리 크론잡 오류:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
