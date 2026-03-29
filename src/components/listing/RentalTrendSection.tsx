"use client";
import { useEffect, useState } from "react";

interface RentalTrendSectionProps {
  regionCode: string;       // 법정동코드 (addressJibun에서 추출)
  categoryName?: string;    // 업종명
  deposit: number;          // 이 매물 보증금
  monthlyRent: number;      // 이 매물 월세
  premium: number;          // 이 매물 권리금
  premiumNone?: boolean;    // 무권리금
}

interface RentalTrendData {
  avgDeposit: number;
  avgMonthlyRent: number;
  avgPremium: number;
  vacancyRate: number;
  nationalAvgVacancyRate: number;
  rentChangeRate: number;
  avgInvestmentYield: number;
  region: string;
  quarter: string;
  industryType: string;
}

export default function RentalTrendSection({
  regionCode,
  categoryName,
  deposit,
  monthlyRent,
  premium,
  premiumNone,
}: RentalTrendSectionProps) {
  const [data, setData] = useState<RentalTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({ regionCode });
        if (categoryName) params.append("industryType", categoryName);

        const response = await fetch(`/api/external/rental-trends?${params}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching rental trends:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [regionCode, categoryName]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return null; // 섹션 자체를 숨김
  }

  const fmt = (n: number) => n.toLocaleString();

  // 게이지 비교 함수
  const renderGauge = (label: string, myValue: number, avgValue: number) => {
    if (avgValue <= 0) return null;

    const maxValue = avgValue * 2;
    const myWidth = Math.min((myValue / maxValue) * 100, 100);
    const avgMarker = 50; // 항상 50% 위치
    const diffPct = avgValue > 0 ? ((myValue - avgValue) / avgValue) * 100 : 0;
    const isCheaper = diffPct < 0;
    const isEqual = Math.abs(diffPct) < 1;

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-900">{fmt(myValue)}만</span>
            <span className="text-xs text-gray-400 ml-1">/ 평균 {fmt(avgValue)}만</span>
          </div>
        </div>

        {/* 게이지 바 */}
        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
          {/* 평균 마커 (점선) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
            style={{ left: `${avgMarker}%` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full">
              <span className="text-[10px] text-gray-500 whitespace-nowrap">평균</span>
            </div>
          </div>

          {/* 내 매물 바 */}
          <div
            className={`absolute top-1 bottom-1 left-0 rounded transition-all ${
              isCheaper ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${myWidth}%` }}
          />
        </div>

        {/* 하단 텍스트 */}
        <div className="text-xs text-center">
          {isEqual ? (
            <span className="text-gray-600">평균 수준</span>
          ) : isCheaper ? (
            <span className="text-green-600">평균 대비 {Math.abs(diffPct).toFixed(0)}% 저렴</span>
          ) : (
            <span className="text-red-600">평균 대비 {diffPct.toFixed(0)}% 높음</span>
          )}
        </div>
      </div>
    );
  };

  // 가격 적정성 요약 생성
  const getSummary = () => {
    const items: string[] = [];

    if (deposit && data.avgDeposit) {
      const diff = ((deposit - data.avgDeposit) / data.avgDeposit * 100);
      if (diff > 5) items.push(`보증금은 지역 평균보다 ${diff.toFixed(0)}% 높고`);
      else if (diff < -5) items.push(`보증금은 지역 평균보다 ${Math.abs(diff).toFixed(0)}% 저렴하고`);
      else items.push("보증금은 평균 수준이고");
    }

    if (monthlyRent && data.avgMonthlyRent) {
      const diff = ((monthlyRent - data.avgMonthlyRent) / data.avgMonthlyRent * 100);
      if (diff > 5) items.push(`월세는 ${diff.toFixed(0)}% 높으며`);
      else if (diff < -5) items.push(`월세는 ${Math.abs(diff).toFixed(0)}% 저렴하며`);
      else items.push("월세는 평균 수준이며");
    }

    if (!premiumNone && premium && data.avgPremium) {
      const diff = ((premium - data.avgPremium) / data.avgPremium * 100);
      if (diff > 5) items.push(`권리금은 ${diff.toFixed(0)}% 높습니다`);
      else if (diff < -5) items.push(`권리금은 ${Math.abs(diff).toFixed(0)}% 저렴합니다`);
      else items.push("권리금은 평균 수준입니다");
    }

    // 종합 평가
    let conclusion = "";
    const lowMonthlyRent = monthlyRent && data.avgMonthlyRent && monthlyRent < data.avgMonthlyRent;
    const lowDeposit = deposit && data.avgDeposit && deposit < data.avgDeposit;
    const highBoth = deposit && data.avgDeposit && monthlyRent && data.avgMonthlyRent &&
                     deposit > data.avgDeposit && monthlyRent > data.avgMonthlyRent;

    if (lowMonthlyRent) conclusion = " → 운영 부담이 적은 매물입니다.";
    else if (lowDeposit) conclusion = " → 초기 투자 부담이 적은 매물입니다.";
    else if (highBoth) conclusion = " → 프리미엄 입지의 매물입니다.";

    return items.join(", ") + (conclusion || ".");
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base font-bold text-gray-900">
          💰 지역 임대 시세 ({data.region} {data.industryType})
        </h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            한국부동산원 공식
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        출처: 한국부동산원 부동산통계정보 R-ONE ({data.quarter} 기준)
      </p>

      {/* 게이지 비교 3종 */}
      <div className="space-y-4">
        {renderGauge("보증금", deposit, data.avgDeposit)}
        {renderGauge("월세", monthlyRent, data.avgMonthlyRent)}
        {!premiumNone && renderGauge("권리금", premium, data.avgPremium)}
      </div>

      {/* 가격 적정성 요약 카드 */}
      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-lg">📋</span>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 mb-1">가격 적정성 요약</h4>
            <p className="text-xs text-gray-700 leading-relaxed">{getSummary()}</p>
          </div>
        </div>
      </div>

      {/* 부가 정보 3개 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* 공실률 */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">공실률</div>
          <div className="text-lg font-bold text-gray-900">{data.vacancyRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">
            {data.vacancyRate < data.nationalAvgVacancyRate ? (
              <span className="text-green-600">전국 대비 양호</span>
            ) : (
              <span className="text-orange-600">전국 대비 주의</span>
            )}
          </div>
        </div>

        {/* 임대가격 변동률 */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">임대가격 변동률</div>
          <div className={`text-lg font-bold ${
            data.rentChangeRate > 0 ? "text-red-600" : data.rentChangeRate < 0 ? "text-blue-600" : "text-gray-900"
          }`}>
            {data.rentChangeRate > 0 ? "+" : ""}{data.rentChangeRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">전분기 대비</div>
        </div>

        {/* 투자수익률 */}
        <div className="bg-gray-50 rounded-xl p-3 col-span-2 md:col-span-1">
          <div className="text-xs text-gray-500 mb-1">평균 투자수익률</div>
          <div className="text-lg font-bold text-gray-900">{data.avgInvestmentYield.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">지역 평균</div>
        </div>
      </div>
    </div>
  );
}
