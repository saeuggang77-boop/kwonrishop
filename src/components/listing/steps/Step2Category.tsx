"use client";

import { useEffect, useState } from "react";
import { useListingFormStore } from "@/store/listingForm";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  subCategories: { id: string; name: string }[];
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

  function handleNumberInput(
    field: string,
    value: string,
  ) {
    const num = value === "" ? 0 : parseInt(value.replace(/,/g, ""), 10);
    if (!isNaN(num)) {
      updateData({ [field]: num });
    }
  }

  function formatNumber(value: number): string {
    return value === 0 ? "" : value.toLocaleString();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">업종 / 금액</h2>
      <p className="text-sm text-gray-500 mb-6">업종과 거래 금액을 입력해주세요</p>

      <div className="space-y-6">
        {/* 대분류 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            업종 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
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
                }}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-sm transition-colors ${
                  data.categoryId === cat.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-xs font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 소분류 */}
        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              세부 업종 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedCategory.subCategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() =>
                    updateData({
                      subCategoryId: sub.id,
                      subCategoryName: sub.name,
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    data.subCategoryId === sub.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 금액 */}
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium text-gray-900">거래 금액 (만원)</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">보증금</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatNumber(data.deposit)}
                onChange={(e) => handleNumberInput("deposit", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">월세</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatNumber(data.monthlyRent)}
                onChange={(e) => handleNumberInput("monthlyRent", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">권리금</label>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={data.premiumNone}
                  onChange={(e) =>
                    updateData({
                      premiumNone: e.target.checked,
                      premium: e.target.checked ? 0 : data.premium,
                    })
                  }
                  className="rounded border-gray-300"
                />
                무권리
              </label>
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={data.premiumNegotiable}
                  onChange={(e) =>
                    updateData({ premiumNegotiable: e.target.checked })
                  }
                  className="rounded border-gray-300"
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
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
              />
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              관리비 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={data.maintenanceFee !== null ? formatNumber(data.maintenanceFee) : ""}
              onChange={(e) => handleNumberInput("maintenanceFee", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
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
