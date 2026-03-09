"use client";

import { useListingFormStore } from "@/store/listingForm";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function Step4Additional({ onNext, onPrev }: Props) {
  const { data, updateData } = useListingFormStore();

  function numInput(field: string, value: string) {
    const num = value === "" ? null : parseInt(value.replace(/,/g, ""), 10);
    if (value === "" || !isNaN(num!)) {
      updateData({ [field]: num });
    }
  }

  function fmt(value: number | null): string {
    return value !== null ? value.toLocaleString() : "";
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">추가정보</h2>
      <p className="text-sm text-gray-500 mb-6">매출/지출 정보를 입력하면 매수자 신뢰도가 높아집니다</p>

      <div className="space-y-6">
        {/* 매출 */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">월 매출 (만원)</h3>
          <input
            type="text"
            inputMode="numeric"
            placeholder="월 평균 매출"
            value={fmt(data.monthlyRevenue)}
            onChange={(e) => numInput("monthlyRevenue", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
          />
        </div>

        {/* 운영 형태 */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">운영 형태</h3>
          <div className="flex gap-2">
            {[
              { value: "SOLO" as const, label: "혼자 운영" },
              { value: "FAMILY" as const, label: "가족/동업" },
              { value: "EMPLOYEE" as const, label: "직원 고용" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateData({ operationType: opt.value })}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  data.operationType === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {data.operationType === "FAMILY" && (
            <input
              type="number"
              placeholder="가족/동업자 수"
              value={data.familyWorkers ?? ""}
              onChange={(e) => numInput("familyWorkers", e.target.value)}
              className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          )}
          {data.operationType === "EMPLOYEE" && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <input
                type="number"
                placeholder="정직원 수"
                value={data.employeesFull ?? ""}
                onChange={(e) => numInput("employeesFull", e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="파트타임 수"
                value={data.employeesPart ?? ""}
                onChange={(e) => numInput("employeesPart", e.target.value)}
                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* 지출 */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">월 지출 (만원)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { field: "expenseMaterial", label: "재료비" },
              { field: "expenseLabor", label: "인건비" },
              { field: "expenseRent", label: "월세" },
              { field: "expenseMaintenance", label: "관리비" },
              { field: "expenseUtility", label: "공과금" },
              { field: "expenseOther", label: "기타경비" },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={fmt((data as unknown as Record<string, number | null>)[field])}
                  onChange={(e) => numInput(field, e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 순이익 */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">월 순이익 (만원)</h3>
          <input
            type="text"
            inputMode="numeric"
            placeholder="월 평균 순이익"
            value={fmt(data.monthlyProfit)}
            onChange={(e) => numInput("monthlyProfit", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-right"
          />
          <textarea
            placeholder="순이익 관련 부연설명 (선택)"
            value={data.profitDescription}
            onChange={(e) => updateData({ profitDescription: e.target.value })}
            rows={2}
            className="mt-2 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
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
