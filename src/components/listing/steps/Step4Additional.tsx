"use client";

import { useState, useEffect } from "react";
import { useListingFormStore } from "@/store/listingForm";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export default function Step4Additional({ onNext, onPrev }: Props) {
  const { data, updateData } = useListingFormStore();

  // 월세/관리비 수동 편집 추적
  const [manualRentEdit, setManualRentEdit] = useState(
    data.expenseRent !== null && data.expenseRent !== data.monthlyRent
  );
  const [manualMaintenanceEdit, setManualMaintenanceEdit] = useState(
    data.expenseMaintenance !== null && data.expenseMaintenance !== data.maintenanceFee
  );

  // Step 2에서 입력한 월세를 자동 채움
  useEffect(() => {
    if (!manualRentEdit && data.monthlyRent > 0 && data.expenseRent === null) {
      updateData({ expenseRent: data.monthlyRent });
    }
  }, [data.monthlyRent, manualRentEdit]);

  // Step 2에서 입력한 관리비를 자동 채움
  useEffect(() => {
    if (!manualMaintenanceEdit && data.maintenanceFee && data.maintenanceFee > 0 && data.expenseMaintenance === null) {
      updateData({ expenseMaintenance: data.maintenanceFee });
    }
  }, [data.maintenanceFee, manualMaintenanceEdit]);

  const isAutoRent = !manualRentEdit && data.expenseRent !== null && data.expenseRent === data.monthlyRent;
  const isAutoMaintenance = !manualMaintenanceEdit && data.expenseMaintenance !== null && data.expenseMaintenance === data.maintenanceFee;

  function numInput(field: string, value: string) {
    const num = value === "" ? null : parseInt(value.replace(/,/g, ""), 10);
    if (value === "" || !isNaN(num!)) {
      updateData({ [field]: num !== null ? Math.max(0, num) : null });
    }
  }

  function fmt(value: number | null): string {
    return value !== null ? value.toLocaleString() : "";
  }

  // 총 매매금액 자동합산 (보증금 + 권리금)
  const investmentTotal = data.deposit + (data.premiumNone ? 0 : data.premium);

  // 매출대비 % 계산
  function revenuePercent(value: number | null): string {
    if (!value || !data.monthlyRevenue || data.monthlyRevenue === 0) return "";
    const pct = ((value / data.monthlyRevenue) * 100).toFixed(1);
    return `${pct}%`;
  }

  function percentColor(value: number | null): string {
    if (!value || !data.monthlyRevenue || data.monthlyRevenue === 0) return "";
    const pct = (value / data.monthlyRevenue) * 100;
    if (pct >= 30) return "text-red-500";
    return "text-navy-500";
  }

  // 순이익 자동계산
  const autoProfit =
    data.monthlyRevenue !== null
      ? data.monthlyRevenue -
        ((data.expenseMaterial ?? 0) +
          (data.expenseLabor ?? 0) +
          (data.expenseRent ?? 0) +
          (data.expenseMaintenance ?? 0) +
          (data.expenseUtility ?? 0) +
          (data.expenseOther ?? 0))
      : null;

  const expenseFields = [
    { field: "expenseMaterial", label: "재료비" },
    { field: "expenseLabor", label: "인건비" },
    { field: "expenseRent", label: "월세" },
    { field: "expenseMaintenance", label: "관리비" },
    { field: "expenseUtility", label: "공과금" },
    { field: "expenseOther", label: "기타경비" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      {/* 선택사항 안내 배너 */}
      <div className="mb-4 p-3 bg-navy-50 dark:bg-navy-900/50 border border-navy-200 dark:border-navy-700 rounded-lg">
        <p className="text-sm text-navy-700 dark:text-navy-300 font-medium">
          매출/지출 정보는 선택사항입니다. 입력하면 매물 신뢰도가 높아집니다.
        </p>
      </div>

      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">추가정보</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">매출/지출 정보를 입력하면 매수자 신뢰도가 높아집니다</p>

      <div className="space-y-6">
        {/* 총 매매금액 자동합산 */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">총 매매금액</h3>
          <div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">보증금 + 권리금</span>
              <span className="text-base font-semibold text-gray-900 dark:text-white">
                {investmentTotal.toLocaleString()}만원
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Step 2에서 입력한 금액이 자동으로 합산됩니다</p>
          </div>
        </div>

        {/* 매출 */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">월 매출</h3>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="월 평균 매출 (최근 6개월)"
              value={fmt(data.monthlyRevenue)}
              onChange={(e) => numInput("monthlyRevenue", e.target.value)}
              className="w-full px-3 py-2.5 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none text-right"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
          </div>
        </div>

        {/* 운영 형태 */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">운영 형태</h3>
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
                    ? "border-navy-500 bg-navy-50 dark:bg-navy-800/30 text-navy-700 dark:text-navy-300"
                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {data.operationType === "FAMILY" && (
            <div className="relative mt-2">
              <input
                type="number"
                placeholder="가족/동업자 수"
                value={data.familyWorkers ?? ""}
                onChange={(e) => numInput("familyWorkers", e.target.value)}
                className="w-full px-3 py-2.5 pr-8 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">명</span>
            </div>
          )}
          {data.operationType === "EMPLOYEE" && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="relative">
                <input
                  type="number"
                  placeholder="정직원 수"
                  value={data.employeesFull ?? ""}
                  onChange={(e) => numInput("employeesFull", e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] pr-8 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">명</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="파트타임 수"
                  value={data.employeesPart ?? ""}
                  onChange={(e) => numInput("employeesPart", e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] pr-8 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">명</span>
              </div>
            </div>
          )}
        </div>

        {/* 지출 + 매출대비% */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">월 지출</h3>
          <div className="grid grid-cols-2 gap-3">
            {expenseFields.map(({ field, label }) => {
              const val = (data as unknown as Record<string, number | null>)[field];
              const pct = revenuePercent(val);
              const pctClass = percentColor(val);
              const isAuto =
                (field === "expenseRent" && isAutoRent) ||
                (field === "expenseMaintenance" && isAutoMaintenance);
              return (
                <div key={field}>
                  <label className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="flex items-center gap-1">
                      {label}
                      {isAuto && <span className="text-navy-500 font-medium">자동</span>}
                    </span>
                    {pct && <span className={`font-medium ${pctClass}`}>{pct}</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={fmt(val)}
                      onChange={(e) => {
                        if (field === "expenseRent") setManualRentEdit(true);
                        if (field === "expenseMaintenance") setManualMaintenanceEdit(true);
                        numInput(field, e.target.value);
                      }}
                      className={`w-full px-3 py-3 min-h-[44px] pr-12 border ${isAuto ? "border-navy-200 dark:border-navy-600 bg-navy-50/50 dark:bg-navy-900/10" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"} text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none text-right`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 순이익 자동계산 */}
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">월 순이익</h3>
          {autoProfit !== null && (
            <div className="mb-2 px-4 py-2.5 bg-navy-50 dark:bg-navy-800/20 border border-navy-200 dark:border-navy-700 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-navy-700 dark:text-navy-300">자동계산</span>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-semibold ${autoProfit >= 0 ? "text-navy-700 dark:text-navy-300" : "text-red-500"}`}>
                    {autoProfit.toLocaleString()}만원
                  </span>
                  {data.monthlyRevenue && data.monthlyRevenue > 0 && (
                    <span className={`text-xs font-medium ${autoProfit >= 0 ? "text-navy-500" : "text-red-400"}`}>
                      ({((autoProfit / data.monthlyRevenue) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">매출 - 지출 합계 (아래에서 직접 수정도 가능)</p>
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder={autoProfit !== null ? `자동계산: ${autoProfit.toLocaleString()}` : "월 평균 순이익"}
              value={fmt(data.monthlyProfit)}
              onChange={(e) => numInput("monthlyProfit", e.target.value)}
              className="w-full px-3 py-2.5 pr-12 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none text-right"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">만원</span>
          </div>
          {data.monthlyProfit !== null && data.monthlyRevenue && data.monthlyRevenue > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
              매출대비 {((data.monthlyProfit / data.monthlyRevenue) * 100).toFixed(1)}%
            </p>
          )}
          <textarea
            placeholder="순이익 관련 부연설명 (선택, 최소 10자)"
            value={data.profitDescription}
            onChange={(e) => updateData({ profitDescription: e.target.value })}
            rows={2}
            className="mt-2 w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none resize-none"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          이전
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-navy-700 text-white rounded-lg font-medium hover:bg-navy-600 transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
