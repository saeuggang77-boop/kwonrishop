"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, CheckCircle, Plus } from "lucide-react";

interface CategoryImage {
  category: string;
  key: string;
  url: string;
  preview: string;
}

interface ImageUploaderProps {
  listingId: string;
  onImagesChange: (images: { key: string; url: string; category: string }[]) => void;
}

const REQUIRED_CATEGORIES = [
  { id: "exterior", label: "외부 전경", emoji: "\u{1F3E2}" },
  { id: "interior", label: "내부 전경", emoji: "\u{1F3E0}" },
] as const;

const OPTIONAL_CATEGORIES = [
  { id: "kitchen", label: "주방", emoji: "\u{1F373}" },
  { id: "bathroom", label: "화장실", emoji: "\u{1F6BF}" },
  { id: "signage", label: "간판/외관", emoji: "\u{1FAA7}" },
  { id: "hall", label: "홀/좌석", emoji: "\u{1FA91}" },
  { id: "parking", label: "주차장", emoji: "\u{1F17F}\u{FE0F}" },
  { id: "other", label: "기타", emoji: "\u{1F4F7}" },
] as const;

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_OTHER = 4;

export function ImageUploader({ listingId, onImagesChange }: ImageUploaderProps) {
  const [images, setImages] = useState<CategoryImage[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeCategoryRef = useRef<string>("");

  const notify = useCallback(
    (imgs: CategoryImage[]) => {
      onImagesChange(imgs.map((img) => ({ key: img.key, url: img.url, category: img.category })));
    },
    [onImagesChange],
  );

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCountForCategory = (catId: string) => images.filter((img) => img.category === catId).length;

  const triggerUpload = (categoryId: string) => {
    if (categoryId !== "other" && getCountForCategory(categoryId) >= 1) return;
    if (categoryId === "other" && getCountForCategory(categoryId) >= MAX_OTHER) return;
    activeCategoryRef.current = categoryId;
    inputRef.current?.click();
  };

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const categoryId = activeCategoryRef.current;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("JPEG, PNG, WebP 이미지만 업로드 가능합니다.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    setUploading(categoryId);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("listingId", listingId);

      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message ?? "업로드 실패");
      }

      const { data } = await res.json();
      const preview = URL.createObjectURL(file);
      const newImage: CategoryImage = { category: categoryId, key: data.key, url: data.url, preview };

      setImages((prev) => {
        const updated = [...prev, newImage];
        notify(updated);
        return updated;
      });
    } catch {
      setError("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (categoryId: string, index: number) => {
    setImages((prev) => {
      const catImages = prev.filter((img) => img.category === categoryId);
      const target = catImages[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      const updated = prev.filter((img) => img !== target);
      notify(updated);
      return updated;
    });
  };

  const renderCategoryCard = (
    cat: { id: string; label: string; emoji: string },
    isRequired: boolean,
    size: "lg" | "sm",
  ) => {
    const catImages = images.filter((img) => img.category === cat.id);
    const hasImage = catImages.length > 0;
    const isUploading = uploading === cat.id;
    const isFirst = cat.id === "exterior";
    const canAddMore = cat.id === "other" ? catImages.length < MAX_OTHER : catImages.length < 1;

    const cardHeight = size === "lg" ? "h-40" : "h-28";

    // Single image or empty slot
    if (!hasImage) {
      return (
        <button
          key={cat.id}
          type="button"
          onClick={() => triggerUpload(cat.id)}
          disabled={isUploading}
          className={`relative flex ${cardHeight} w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
            isRequired
              ? "border-red-300 bg-red-50/30 hover:border-red-400 hover:bg-red-50/50"
              : "border-gray-300 bg-gray-50/30 hover:border-[#1B3A5C] hover:bg-gray-50"
          }`}
        >
          {isUploading ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#1B3A5C] border-t-transparent" />
          ) : (
            <span className={size === "lg" ? "text-4xl" : "text-2xl"}>{cat.emoji}</span>
          )}
          <span className="text-xs font-medium text-gray-500">{cat.label}</span>
          {isRequired && (
            <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              필수
            </span>
          )}
          {isFirst && (
            <span className="absolute left-2 top-2 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold text-white">
              대표
            </span>
          )}
        </button>
      );
    }

    // Has image(s)
    return (
      <div key={cat.id} className="space-y-2">
        {catImages.map((img, idx) => (
          <div
            key={img.key}
            className={`group relative ${cardHeight} w-full overflow-hidden rounded-xl border border-gray-200`}
          >
            <Image src={img.preview} alt={cat.label} fill className="object-cover" unoptimized />
            {/* Green check overlay */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-0.5">
              <CheckCircle className="h-3 w-3 text-white" />
              <span className="text-[10px] font-bold text-white">{cat.label}</span>
            </div>
            {/* Badges */}
            {isFirst && idx === 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold text-white">
                대표
              </span>
            )}
            {/* Remove */}
            <button
              type="button"
              onClick={() => removeImage(cat.id, idx)}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {/* Add more button for "other" category */}
        {cat.id === "other" && canAddMore && (
          <button
            type="button"
            onClick={() => triggerUpload(cat.id)}
            className="flex h-16 w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-[#1B3A5C] hover:text-[#1B3A5C]"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">기타 추가 ({catImages.length}/{MAX_OTHER})</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Required Photos */}
      <div>
        <p className="mb-2 text-sm font-semibold text-gray-800">
          필수 사진 (최소 2장) <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {REQUIRED_CATEGORIES.map((cat) => renderCategoryCard(cat, true, "lg"))}
        </div>
      </div>

      {/* Optional Photos */}
      <div className="mt-5">
        <p className="mb-1 text-sm font-semibold text-gray-800">추가 사진 (선택)</p>
        <p className="mb-3 text-xs text-gray-500">
          💡 주방/화장실 사진이 있으면 매수인 문의율이 높아집니다
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {OPTIONAL_CATEGORIES.map((cat) => renderCategoryCard(cat, false, "sm"))}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFile(e.target.files)}
        className="hidden"
      />

      {/* Status */}
      <p className="mt-3 text-xs text-gray-500">
        {images.length}장 업로드됨 | JPEG, PNG, WebP | 최대 10MB
      </p>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
