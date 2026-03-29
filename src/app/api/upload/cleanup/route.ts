import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { deleteFromS3, isS3Configured } from "@/lib/s3";
import { unlink } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  // CSRF protection
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { urls } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "삭제할 URL이 없습니다." }, { status: 400 });
    }

    const deletedCount = await cleanupImages(urls);

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error("이미지 정리 오류:", error);
    return NextResponse.json({ error: "이미지 정리 중 오류가 발생했습니다." }, { status: 500 });
  }
}

async function cleanupImages(urls: string[]): Promise<number> {
  let deletedCount = 0;

  for (const url of urls) {
    try {
      if (isS3Configured()) {
        // S3에서 삭제
        const key = url.replace(/^https?:\/\/[^/]+\//, ""); // URL에서 키 추출
        await deleteFromS3(key);
        deletedCount++;
      } else {
        // 로컬 파일시스템에서 삭제
        if (url.startsWith("/uploads/")) {
          const filename = url.replace("/uploads/", "");
          const filePath = path.join(process.cwd(), "public", "uploads", filename);
          await unlink(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error(`이미지 삭제 실패: ${url}`, error);
      // 개별 실패는 무시하고 계속 진행
    }
  }

  return deletedCount;
}
