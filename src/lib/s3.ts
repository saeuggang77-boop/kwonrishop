import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// S3 클라이언트 생성 (AWS S3, Cloudflare R2, MinIO 모두 호환)
const s3 = new S3Client({
  region: process.env.S3_REGION || "ap-northeast-2",
  endpoint: process.env.S3_ENDPOINT, // R2/MinIO용, AWS는 비워둠
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: !!process.env.S3_ENDPOINT, // AWS 외 서비스용
});

const bucketName = process.env.S3_BUCKET_NAME || "kwonrishop-uploads";

/**
 * S3에 파일 업로드
 * @param file - 업로드할 파일 버퍼
 * @param key - S3 저장 키 (경로 포함)
 * @param contentType - MIME 타입
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3.send(command);

  // 공개 URL 생성
  if (process.env.S3_PUBLIC_URL) {
    // R2/MinIO 등 커스텀 엔드포인트
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  } else {
    // AWS S3
    const region = process.env.S3_REGION || "ap-northeast-2";
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
}

/**
 * S3에서 파일 삭제
 * @param key - 삭제할 파일의 S3 키
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3.send(command);
}

/**
 * S3 설정이 올바른지 확인
 * @returns S3 사용 가능 여부
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}
