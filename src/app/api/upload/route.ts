import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { uploadToS3, isS3Configured } from "@/lib/s3";

export async function POST(req: NextRequest) {
  // Rate limiting: 10 uploads per minute
  const ip = getClientIp(req);
  const limiter = rateLimit(ip, 10, 60000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: "업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // CSRF protection
  if (!validateOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  // 파일 크기 제한 (10MB)
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하만 가능합니다." }, { status: 400 });
  }

  // 이미지 파일만 허용 (MIME type 검사)
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "이미지 파일만 업로드 가능합니다." }, { status: 400 });
  }

  // 파일 확장자 화이트리스트 검증
  const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: "허용되지 않은 파일 형식입니다. (jpg, png, gif, webp만 가능)" },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${random}${ext}`;

    // S3 사용 가능 여부 확인
    if (isS3Configured()) {
      // S3에 업로드
      const key = `uploads/${filename}`;
      const url = await uploadToS3(buffer, key, file.type);
      return NextResponse.json({ url });
    } else {
      // S3 미설정 시 로컬 파일시스템 사용 (개발용)
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);

      return NextResponse.json({ url: `/uploads/${filename}` });
    }
  } catch (error) {
    console.error("업로드 오류:", error);
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }
}
