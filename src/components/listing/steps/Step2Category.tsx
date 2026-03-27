"use client";

import { useEffect, useState } from "react";
import { useListingFormStore } from "@/store/listingForm";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  subCategories: { id: string; name: string; icon?: string | null }[];
}

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2Category({ onNext, onPrev }: Props) {
  const { data, updateData } = useListingFormStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => setError("카테고리를 불러오지 못했습니다."));
  }, []);

  const selectedCategory = categories.find((c) => c.id === data.categoryId);

  function handleSubmit() {
    if (!data.categoryId) {
      setError("업종을 선택해주세요.");
      return;
    }
    if (!data.subCategoryId) {
      setError("세부 업종을 선택해주세요.");
      return;
    }
    onNext();
  }

  function handleNumberInput(field: string, value: string) {
    const num = value === "" ? 0 : parseInt(value.replace(/,/g, ""), 10);
    if (!isNaN(num)) {
      updateData({ [field]: num });
    }
  }

  function formatNumber(value: number): string {
    return value === 0 ? "" : value.toLocaleString();
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
        {selectedCategory
          ? `${selectedCategory.name} 중에 업종이 어떻게 되시나요?`
          : "업종이 어떻게 되시나요?"}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {selectedCategory ? "세부 업종을 선택해주세요" : "대분류 업종을 먼저 선택해주세요"}
      </p>

      <div className="space-y-6">
        {/* 대분류: 미선택 시 큰 카드, 선택 시 칩으로 축소 */}
        {!selectedCategory ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              업종 대분류 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    updateData({
                      categoryId: cat.id,
                      categoryName: cat.name,
                      subCategoryId: "",
                      subCategoryName: "",
                    });
                    setError("");
                  }}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-sm transition-all hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 border-gray-200 dark:border-gray-600"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              선택된 업종
            </label>
            <button
              type="button"
              onClick={() => {
                updateData({
                  categoryId: "",
                  categoryName: "",
                  subCategoryId: "",
                  subCategoryName: "",
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <span className="text-lg">{selectedCategory.icon}</span>
              <span className="font-medium">{selectedCategory.name}</span>
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* 소분류: 아이콘 카드 그리드 */}
        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              세부 업종 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {selectedCategory.subCategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    updateData({
                      subCategoryId: sub.id,
                      subCategoryName: sub.name,
                    });
                    setError("");
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm transition-all ${
                    data.subCategoryId === sub.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {sub.icon && <span className="text-xl">{sub.icon}</span>}
                  <span className="text-xs font-medium text-center leading-tight">{sub.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 금액 - 업종 선택 후 표시 */}
        {data.subCategoryId && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white">거래 금액 (만원)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">보증금</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatNumber(data.deposit)}
                  onChange={(e) => handleNumberInput("deposit", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">월세</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatNumber(data.monthlyRent)}
                  onChange={(e) => handleNumberInput("monthlyRent", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">권리금</label>
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={data.premiumNone}
                    onChange={(e) =>
                      updateData({
                        premiumNone: e.target.checked,
                        premium: e.target.checked ? 0 : data.premium,
                      })
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  무권리
                </label>
                <label className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={data.premiumNegotiable}
                    onChange={(e) =>
                      updateData({ premiumNegotiable: e.target.checked })
                    }
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  협의가능
                </label>
              </div>
              {!data.premiumNone && (
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatNumber(data.premium)}
                  onChange={(e) => handleNumberInput("premium", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
                />
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                관리비 <span className="text-gray-400 dark:text-gray-500">(선택)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={data.maintenanceFee !== null ? formatNumber(data.maintenanceFee) : ""}
                onChange={(e) => handleNumberInput("maintenanceFee", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          이전
        </button>
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
