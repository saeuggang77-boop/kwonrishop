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
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [manualLocationEdit, setManualLocationEdit] = useState(false);

  function fetchCategories() {
    setLoadingCategories(true);
    setError("");
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => { setCategories(data); setLoadingCategories(false); })
      .catch(() => { setError("카테고리를 불러오지 못했습니다."); setLoadingCategories(false); });
  }

  useEffect(() => { fetchCategories(); }, []);

  // 바닥권리금 자동계산: 총 권리금 - 영업 - 시설
  useEffect(() => {
    if (manualLocationEdit || data.premiumNone || data.premium === 0) return;
    const remaining = data.premium - (data.premiumBusiness || 0) - (data.premiumFacility || 0);
    const autoValue = Math.max(0, remaining);
    const currentValue = data.premiumLocation || 0;
    if (currentValue !== autoValue) {
      updateData({ premiumLocation: autoValue > 0 ? autoValue : null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.premium, data.premiumBusiness, data.premiumFacility, manualLocationEdit]);

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
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">
        {selectedCategory
          ? `${selectedCategory.name} 중에 업종이 어떻게 되시나요?`
          : "업종이 어떻게 되시나요?"}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {selectedCategory ? "세부 업종을 선택해주세요" : "대분류 업종을 먼저 선택해주세요"}
      </p>

      <div className="space-y-6">
        {/* 대분류: 미선택 시 큰 카드, 선택 시 칩으로 축소 */}
        {!selectedCategory ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              업종 대분류 <span className="text-red-500">*</span>
            </label>
            {loadingCategories && categories.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-gray-400">업종 불러오는 중...</div>
              </div>
            ) : error && categories.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-red-500 mb-3">{error}</p>
                <button type="button" onClick={fetchCategories} className="px-4 py-2 text-sm bg-green-700 text-cream rounded-full hover:bg-green-800 transition-colors">
                  다시 시도
                </button>
              </div>
            ) : null}
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
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-sm transition-all hover:border-green-400 hover:bg-green-50/50 border-gray-200"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 hover:bg-green-100 transition-colors"
            >
              <span className="text-lg">{selectedCategory.icon}</span>
              <span className="font-medium">{selectedCategory.name}</span>
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* 소분류: 아이콘 카드 그리드 */}
        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
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
          <div className="border-t border-line pt-6 space-y-4">
            <h3 className="font-medium text-gray-900">거래 금액 (만원)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">보증금</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatNumber(data.deposit)}
                    onChange={(e) => handleNumberInput("deposit", e.target.value)}
                    className="w-full px-3 py-3 min-h-[44px] pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">월세</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatNumber(data.monthlyRent)}
                    onChange={(e) => handleNumberInput("monthlyRent", e.target.value)}
                    className="w-full px-3 py-3 min-h-[44px] pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
                </div>
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
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={formatNumber(data.premium)}
                    onChange={(e) => handleNumberInput("premium", e.target.value)}
                    className="w-full px-3 py-3 min-h-[44px] pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-right"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                관리비 <span className="text-gray-400">(선택)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={data.maintenanceFee !== null ? formatNumber(data.maintenanceFee) : ""}
                  onChange={(e) => handleNumberInput("maintenanceFee", e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-right"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
              </div>
            </div>

            {/* 권리금 산정 (선택) */}
            {!data.premiumNone && data.premium > 0 && (
              <div className="border-t border-line pt-4 mt-2">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">
                  권리금 산정 <span className="text-gray-400 font-normal">(선택)</span>
                </h4>
                <div className="space-y-3">
                  {/* 영업권리금 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">영업권리금</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={data.premiumBusiness !== null ? formatNumber(data.premiumBusiness) : ""}
                          onChange={(e) => handleNumberInput("premiumBusiness", e.target.value)}
                          className="w-full px-3 py-2 pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-right text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">산정 사유</label>
                      <input
                        type="text"
                        placeholder="예: 안정적인 매출, 단골고객 확보"
                        value={data.premiumBusinessDesc}
                        onChange={(e) => updateData({ premiumBusinessDesc: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* 시설권리금 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">시설권리금</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={data.premiumFacility !== null ? formatNumber(data.premiumFacility) : ""}
                          onChange={(e) => handleNumberInput("premiumFacility", e.target.value)}
                          className="w-full px-3 py-2 pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-right text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">산정 사유</label>
                      <input
                        type="text"
                        placeholder="예: 최신 인테리어, 고가 주방기기"
                        value={data.premiumFacilityDesc}
                        onChange={(e) => updateData({ premiumFacilityDesc: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* 바닥권리금 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        바닥권리금
                        {!manualLocationEdit && (data.premiumBusiness || data.premiumFacility) ? (
                          <span className="text-green-500 ml-1">자동</span>
                        ) : null}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={data.premiumLocation !== null ? formatNumber(data.premiumLocation) : ""}
                          onChange={(e) => {
                            setManualLocationEdit(true);
                            handleNumberInput("premiumLocation", e.target.value);
                          }}
                          className={`w-full px-3 py-2 pr-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-right text-sm ${
                            !manualLocationEdit && (data.premiumBusiness || data.premiumFacility)
                              ? "border-green-200 bg-green-50/50 text-gray-900"
                              : "border-gray-300 bg-white text-gray-900"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">산정 사유</label>
                      <input
                        type="text"
                        placeholder="예: 역세권, 주요 상권 입지"
                        value={data.premiumLocationDesc}
                        onChange={(e) => updateData({ premiumLocationDesc: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* 합계 표시 */}
                  {(data.premiumBusiness || data.premiumFacility || data.premiumLocation) && (() => {
                    const total = (data.premiumBusiness || 0) + (data.premiumFacility || 0) + (data.premiumLocation || 0);
                    const diff = total - data.premium;
                    return (
                      <div className="pt-2 border-t border-line">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>산정 합계</span>
                          <span className={`font-medium ${diff === 0 ? "text-green-700" : diff > 0 ? "text-red-500" : "text-gray-900"}`}>
                            {formatNumber(total)} 만원
                          </span>
                        </div>
                        {diff === 0 && (
                          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                            총 권리금과 일치
                          </p>
                        )}
                        {diff > 0 && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                            산정 합계가 총 권리금보다 {formatNumber(diff)}만원 초과
                          </p>
                        )}
                        {diff < 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            총 권리금과 차이: {formatNumber(Math.abs(diff))}만원
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

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
          className="px-8 py-3 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
