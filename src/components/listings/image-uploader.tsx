"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface UploadedImage {
  key: string;
  url: string;
  preview: string;
}

interface ImageUploaderProps {
  listingId: string;
  onImagesChange: (images: { key: string; url: string }[]) => void;
}

const MAX_FILES = 10;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploader({ listingId, onImagesChange }: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_FILES - images.length;
    if (remaining <= 0) {
      setError(`최대 ${MAX_FILES}장까지 업로드 가능합니다.`);
      return;
    }

    const validFiles = Array.from(files).slice(0, remaining).filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("JPEG, PNG, WebP 이미지만 업로드 가능합니다.");
        return false;
      }
      if (file.size > MAX_SIZE) {
        setError("파일 크기는 10MB 이하여야 합니다.");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    const newImages: UploadedImage[] = [];

    for (const file of validFiles) {
      try {
        // Upload via FormData (works locally without S3)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("listingId", listingId);

        const res = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message ?? "업로드 실패");
        }

        const { data } = await res.json();
        const preview = URL.createObjectURL(file);
        newImages.push({ key: data.key, url: data.url, preview });
      } catch {
        setError("일부 이미지 업로드에 실패했습니다.");
      }
    }

    setUploading(false);
    const updated = [...images, ...newImages];
    setImages(updated);
    onImagesChange(updated.map((img) => ({ key: img.key, url: img.url })));
  };

  const removeImage = (index: number) => {
    const removed = images[index];
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onImagesChange(updated.map((img) => ({ key: img.key, url: img.url })));
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.key} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200">
            <Image
              src={img.preview}
              alt={`업로드 ${i + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-mint px-1.5 py-0.5 text-[10px] font-bold text-white">
                대표
              </span>
            )}
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {images.length < MAX_FILES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 transition-colors hover:border-mint hover:text-mint disabled:opacity-50"
          >
            {uploading ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-mint border-t-transparent" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-xs">{uploading ? "업로드 중..." : "이미지 추가"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <p className="mt-2 text-xs text-gray-500">
        {images.length}/{MAX_FILES}장 | JPEG, PNG, WebP | 최대 10MB
      </p>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
