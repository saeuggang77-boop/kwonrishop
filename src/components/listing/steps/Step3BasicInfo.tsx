"use client";

import { useState } from "react";
import { useListingFormStore } from "@/store/listingForm";
import { validatePostTitle, TITLE_MAX } from "@/lib/validate-title";

const THEMES = ["무권리", "급매", "프랜차이즈", "사무실", "공실", "임대인매물", "신규인테리어", "역세권", "대로변", "1층", "배달전문"];

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function Step3BasicInfo({ onNext, onPrev }: Props) {
  const { data, updateData } = useListingFormStore();
  const [titleError, setTitleError] = useState<string>("");

  function handleStoreNameChange(value: string) {
    updateData({ storeName: value });
    if (value.trim().length === 0) {
      setTitleError("");
      return;
    }
    const v = validatePostTitle(value);
    setTitleError(v.ok ? "" : v.error || "");
  }

  function toggleTheme(theme: string) {
    const current = data.themes || [];
    if (current.includes(theme)) {
      updateData({ themes: current.filter((t) => t !== theme) });
    } else {
      updateData({ themes: [...current, theme] });
    }
  }

  function handlePyeongChange(value: string) {
    const pyeong = value === "" ? null : parseFloat(value);
    updateData({
      areaPyeong: pyeong,
      areaSqm: pyeong !== null ? Math.round(pyeong * 3.3058 * 100) / 100 : null,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">기본정보</h2>
      <p className="text-sm text-gray-500 mb-6">매물의 기본 정보를 입력해주세요</p>

      <div className="space-y-5">
        {/* 브랜드 타입 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">운영 형태</label>
          <div className="flex gap-3">
            {[
              { value: "PRIVATE" as const, label: "개인매장" },
              { value: "FRANCHISE" as const, label: "프랜차이즈" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateData({ brandType: opt.value })}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  data.brandType === opt.value
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 게시글 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            게시글 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="예: 강남역 도보 5분 한식당 양도양수"
            maxLength={50}
            value={data.storeName ?? ""}
            onChange={(e) => handleStoreNameChange(e.target.value)}
            className={`w-full px-4 py-3 min-h-[44px] border rounded-lg focus:ring-2 outline-none ${
              titleError
                ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-green-500 focus:border-green-500"
            }`}
          />
          <div className="mt-1 flex justify-between items-start gap-2">
            <p className={`text-xs ${titleError ? "text-red-600" : "text-gray-500"}`}>
              {titleError || "5~30자 · 매물 목록·검색에 그대로 노출됩니다 · 이모지·★·# 등 특수문자 사용 불가"}
            </p>
            <span
              className={`text-xs flex-shrink-0 ${
                (data.storeName?.trim().length ?? 0) > TITLE_MAX
                  ? "text-red-600 font-semibold"
                  : "text-gray-400"
              }`}
            >
              {data.storeName?.trim().length ?? 0}/{TITLE_MAX}
            </span>
          </div>
        </div>

        {/* 층수 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">층수</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={data.isBasement}
                onChange={(e) => updateData({ isBasement: e.target.checked })}
                className="rounded border-gray-300"
              />
              지하/반지하
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">해당층</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="예: 1"
                  value={data.currentFloor ?? ""}
                  onChange={(e) =>
                    updateData({ currentFloor: e.target.value ? parseInt(e.target.value) : null })
                  }
                  className="w-full px-3 py-3 min-h-[44px] pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">층</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">전체층</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="예: 5"
                  value={data.totalFloor ?? ""}
                  onChange={(e) =>
                    updateData({ totalFloor: e.target.value ? parseInt(e.target.value) : null })
                  }
                  className="w-full px-3 py-3 min-h-[44px] pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">층</span>
              </div>
            </div>
          </div>
        </div>

        {/* 면적 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">면적</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">평수</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="예: 15"
                  value={data.areaPyeong ?? ""}
                  onChange={(e) => handlePyeongChange(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">평</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">m² (자동계산)</label>
              <input
                type="text"
                readOnly
                value={data.areaSqm !== null ? `${data.areaSqm} m²` : ""}
                className="w-full px-3 py-2.5 min-h-[44px] border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* 테마 태그 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            테마 <span className="text-gray-400">(선택, 복수 가능)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme}
                type="button"
                onClick={() => toggleTheme(theme)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  data.themes?.includes(theme)
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* 주차 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">주차</label>
          <label className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
            <input
              type="checkbox"
              checked={data.parkingNone}
              onChange={(e) => updateData({ parkingNone: e.target.checked })}
              className="rounded border-gray-300"
            />
            주차 불가
          </label>
          {!data.parkingNone && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">전체 주차</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={data.parkingTotal ?? ""}
                    onChange={(e) =>
                      updateData({ parkingTotal: e.target.value ? parseInt(e.target.value) : null })
                    }
                    className="w-full px-3 py-3 min-h-[44px] pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">대</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">세대당 주차</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={data.parkingPerUnit ?? ""}
                    onChange={(e) =>
                      updateData({ parkingPerUnit: e.target.value ? parseInt(e.target.value) : null })
                    }
                    className="w-full px-3 py-3 min-h-[44px] pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">대</span>
                </div>
              </div>
            </div>
          )}
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
          onClick={() => {
            // 층수 검증: 해당층이 전체층보다 클 수 없음
            if (data.currentFloor && data.totalFloor && data.currentFloor > data.totalFloor) {
              import("@/lib/toast").then(({ toast }) => {
                toast.error("해당층이 전체층보다 클 수 없습니다.");
              });
              return;
            }
            // 면적과 층수가 비어있으면 넛지 토스트 표시
            if (!data.areaPyeong || !data.currentFloor) {
              import("@/lib/toast").then(({ toast }) => {
                toast.info("정보를 입력하면 조회수가 높아집니다");
              });
            }
            onNext();
          }}
          className="px-8 py-3 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
