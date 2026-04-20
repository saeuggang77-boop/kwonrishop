// 브라우저 측 이미지 압축 유틸
// Vercel 프로덕션의 request body limit(~4.5MB)에 걸려 413 에러가 나는 고해상도 사진 업로드 실패 방지

interface CompressOptions {
  /** 긴 변 최대 픽셀 (기본 2000) */
  maxDim?: number;
  /** 인코딩 품질 0~1 (기본 0.85) */
  quality?: number;
  /** 이 크기 이하면 원본 그대로 반환 (기본 3.5MB) */
  skipBelowBytes?: number;
}

/**
 * File을 canvas로 리사이즈·재인코딩하여 크기를 줄인 File로 변환.
 * - 이미지가 아니면 원본 그대로 반환
 * - 이미 충분히 작으면 원본 그대로 반환
 * - WebP 지원 시 WebP, 아니면 JPEG 사용
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  // 기본값 2400px / quality 0.92 — Retina/4K 디스플레이에서도 선명, Vercel 4.5MB 한도는 충분히 여유
  const maxDim = options.maxDim ?? 2400;
  const quality = options.quality ?? 0.92;
  const skipBelowBytes = options.skipBelowBytes ?? 3.5 * 1024 * 1024;

  // 이미지 파일 아니면 그대로
  if (!file.type.startsWith("image/")) return file;

  // 충분히 작으면 그대로
  if (file.size <= skipBelowBytes) return file;

  try {
    const img = await loadImage(file);
    const { width, height } = scaleDownSize(img.naturalWidth, img.naturalHeight, maxDim);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, width, height);

    // WebP 지원 확인
    const supportsWebP = canvas
      .toDataURL("image/webp")
      .startsWith("data:image/webp");
    const mime = supportsWebP ? "image/webp" : "image/jpeg";
    const ext = supportsWebP ? "webp" : "jpg";

    const blob = await canvasToBlob(canvas, mime, quality);
    if (!blob) return file;

    // 압축 후가 오히려 크면 원본 반환 (매우 드문 경우)
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.${ext}`, { type: mime });
  } catch {
    // 실패 시 원본 반환 (업로드 자체는 시도)
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function scaleDownSize(
  origW: number,
  origH: number,
  maxDim: number,
): { width: number; height: number } {
  if (origW <= maxDim && origH <= maxDim) {
    return { width: origW, height: origH };
  }
  const ratio = origW > origH ? maxDim / origW : maxDim / origH;
  return {
    width: Math.round(origW * ratio),
    height: Math.round(origH * ratio),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}
