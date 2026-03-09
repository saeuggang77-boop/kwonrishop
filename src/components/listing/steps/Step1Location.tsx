"use client";

import { useState } from "react";
import { useListingFormStore } from "@/store/listingForm";

interface Props {
  onNext: () => void;
}

export default function Step1Location({ onNext }: Props) {
  const { data, updateData } = useListingFormStore();
  const [error, setError] = useState("");

  function handleAddressSearch() {
    // 카카오 주소 API (다음 우편번호 서비스)
    if (typeof window === "undefined") return;

    const daum = (window as unknown as { daum?: { Postcode: new (opts: { oncomplete: (data: Record<string, string>) => void }) => { open: () => void } } }).daum;
    if (!daum?.Postcode) {
      setError("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new daum.Postcode({
      oncomplete: (result: Record<string, string>) => {
        updateData({
          zipCode: result.zonecode,
          addressJibun: result.jibunAddress || result.autoJibunAddress,
          addressRoad: result.roadAddress,
        });
        setError("");
      },
    }).open();
  }

  function handleSubmit() {
    if (!data.addressRoad && !data.addressJibun) {
      setError("주소를 검색해주세요.");
      return;
    }
    onNext();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">위치정보</h2>
      <p className="text-sm text-gray-500 mb-6">매물의 위치를 입력해주세요</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            주소 <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={handleAddressSearch}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left text-gray-500 hover:border-blue-400 transition-colors"
          >
            {data.addressRoad || "클릭하여 주소 검색"}
          </button>
          {data.addressRoad && (
            <div className="mt-2 text-sm text-gray-600 space-y-1">
              <p>도로명: {data.addressRoad}</p>
              {data.addressJibun && <p>지번: {data.addressJibun}</p>}
              {data.zipCode && <p>우편번호: {data.zipCode}</p>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상세주소 <span className="text-gray-400">(선택)</span>
          </label>
          <input
            type="text"
            placeholder="건물명, 층수 등"
            value={data.addressDetail}
            onChange={(e) => updateData({ addressDetail: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
