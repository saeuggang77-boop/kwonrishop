"use client";

import { useRef } from "react";
import Image from "next/image";
import { useListingFormStore } from "@/store/listingForm";

const IMAGE_TYPES = [
  { value: "EXTERIOR", label: "외부" },
  { value: "INTERIOR", label: "내부" },
  { value: "KITCHEN", label: "주방" },
  { value: "OTHER", label: "기타" },
];

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function Step6Photos({ onNext, onPrev }: Props) {
  const { data, updateData } = useListingFormStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const newImages = files.map((file, i) => ({
      file,
      url: URL.createObjectURL(file),
      type: "OTHER",
      sortOrder: data.images.length + i,
    }));
    updateData({ images: [...data.images, ...newImages] });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    const updated = data.images.filter((_, i) => i !== index);
    updateData({ images: updated });
  }

  function updateImageType(index: number, type: string) {
    const updated = data.images.map((img, i) =>
      i === index ? { ...img, type } : img,
    );
    updateData({ images: updated });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">사진 / 연락처</h2>
      <p className="text-sm text-gray-500 mb-6">매물 사진을 등록하고 연락처 공개 여부를 설정해주세요</p>

      <div className="space-y-6">
        {/* 사진 업로드 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              매물 사진 <span className="text-gray-400">(최대 15장)</span>
            </label>
            <span className="text-sm text-gray-400">{data.images.length}/15</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="grid grid-cols-3 gap-3">
            {data.images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={img.url}
                  alt={`사진 ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs"
                >
                  X
                </button>
                <select
                  value={img.type}
                  onChange={(e) => updateImageType(i, e.target.value)}
                  className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-1 border-none outline-none"
                >
                  {IMAGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {data.images.length < 15 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"
              >
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">추가</span>
              </button>
            )}
          </div>
        </div>

        {/* 연락처 공개 */}
        <div className="border-t pt-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.contactPublic}
              onChange={(e) => updateData({ contactPublic: e.target.checked })}
              className="mt-0.5 rounded border-gray-300"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">연락처 공개</span>
              <p className="text-xs text-gray-500 mt-0.5">
                체크하면 매물 상세 페이지에서 연락처가 바로 노출됩니다.
                체크하지 않으면 채팅으로만 연락 가능합니다.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          이전
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
