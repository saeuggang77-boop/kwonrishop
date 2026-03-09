"use client";

import { useListingFormStore } from "@/store/listingForm";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function Step5Description({ onNext, onPrev }: Props) {
  const { data, updateData } = useListingFormStore();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">매물설명</h2>
      <p className="text-sm text-gray-500 mb-6">매물에 대해 자유롭게 설명해주세요</p>

      <textarea
        placeholder={`예시:\n- 양도 사유: 개인 사정으로 양도합니다\n- 매장 특징: 역에서 도보 3분, 유동인구 많음\n- 인테리어: 2023년 신규 인테리어 완료\n- 단골 현황: 배달 + 홀 고객 꾸준\n- 기타: 레시피 및 운영 노하우 전수 가능`}
        value={data.description}
        onChange={(e) => updateData({ description: e.target.value })}
        rows={12}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
      />
      <p className="mt-2 text-xs text-gray-400 text-right">
        {data.description.length}자
      </p>

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
