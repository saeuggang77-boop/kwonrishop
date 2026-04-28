import { put, del } from "@vercel/blob";

/**
 * Vercel Blob에 파일 업로드
 * @param file - 업로드할 파일 버퍼
 * @param key - 저장 경로 (예: uploads/1234-abc.jpg)
 * @param contentType - MIME 타입
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadToBlob(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const blob = await put(key, file, {
    access: "public",
    contentType,
  });

  return blob.url;
}

/**
 * Vercel Blob에서 파일 삭제
 * @param urlOrKey - 삭제할 파일의 URL
 */
export async function deleteFromBlob(urlOrKey: string): Promise<void> {
  try {
    await del(urlOrKey);
  } catch (error) {
    console.error("Blob 삭제 실패:", error);
  }
}

/**
 * Vercel Blob 설정이 올바른지 확인
 * @returns 사용 가능 여부
 */
export function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
