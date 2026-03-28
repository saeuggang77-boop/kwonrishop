"use client";

import { useCompareStore } from "@/store/compareStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface ListingPreview {
  id: string;
  storeName: string | null;
  addressRoad: string | null;
  images: { url: string }[];
}

export default function CompareBar() {
  const { compareIds, removeFromCompare, clearCompare } = useCompareStore();
  const router = useRouter();
  const [previews, setPreviews] = useState<ListingPreview[]>([]);

  useEffect(() => {
    if (compareIds.length > 0) {
      fetchPreviews();
    } else {
      setPreviews([]);
    }
  }, [compareIds]);

  async function fetchPreviews() {
    try {
      const res = await fetch("/api/listings/compare-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: compareIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviews(data.listings || []);
      }
    } catch (err) {
      console.error("Failed to fetch previews", err);
    }
  }

  if (compareIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-600 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              비교 매물 {compareIds.length}개 선택됨
            </span>

            <div className="flex gap-2 overflow-x-auto flex-1 min-w-0">
              {previews.map((listing) => (
                <div
                  key={listing.id}
                  className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 group"
                >
                  {listing.images[0] ? (
                    <Image
                      src={listing.images[0].url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <button
                    onClick={() => removeFromCompare(listing.id)}
                    className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-bl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                    aria-label={`${listing.storeName || listing.addressRoad || '매물'} 비교 목록에서 제거`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clearCompare}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="비교 목록 전체 초기화"
            >
              초기화
            </button>
            <button
              onClick={() => router.push("/listings/compare")}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              aria-label={`선택한 ${compareIds.length}개 매물 비교하기`}
            >
              비교하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
