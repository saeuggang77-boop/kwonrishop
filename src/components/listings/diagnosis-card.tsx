"use client";

import { useState } from "react";
import {
  ChevronDown,
  Shield,
  Star,
  TrendingUp,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { formatKRW } from "@/lib/utils/format";

interface DiagnosisCardProps {
  diagnosis: {
    id: string;
    diagnosisNumber: string;
    fairPremiumBusiness: number;
    fairPremiumFacility: number;
    fairPremiumFloor: number;
    fairPremiumTotal: number;
    premiumGap: number;
    premiumVerdict: string;
    profitMargin: number;
    avgProfitMargin: number;
    roiMonths: number;
    avgRoiMonths: number;
    profitRating: number;
    footTraffic: string;
    competitorDensity: string;
    stationDistance: string;
    locationRating: number;
    leaseRemaining: string;
    buildingAge: string;
    premiumProtection: boolean;
    riskRating: number;
    overallGrade: string;
    overallComment: string;
    createdAt: string | Date;
  };
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

function getVerdictStyle(verdict: string) {
  switch (verdict) {
    case "적정":
      return "bg-green-100 text-green-700";
    case "저평가":
      return "bg-blue-100 text-blue-700";
    case "다소 높음":
      return "bg-amber-100 text-amber-700";
    case "매우 높음":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function GapBar({ gap }: { gap: number }) {
  // gap is a percentage: positive means asking > fair, negative means asking < fair
  const clampedGap = Math.max(-50, Math.min(50, gap));
  const midPoint = 50;
  const barWidth = Math.abs(clampedGap);

  const isOverpriced = clampedGap > 0;
  const barColor = isOverpriced ? "bg-red-400" : "bg-green-400";

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>저평가</span>
        <span>적정</span>
        <span>고평가</span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-gray-200">
        {/* Center marker */}
        <div className="absolute top-0 left-1/2 h-full w-0.5 bg-gray-400 z-10" />
        {/* Gap bar */}
        <div
          className={`absolute top-0 h-full rounded-full ${barColor} transition-all duration-300`}
          style={{
            left: isOverpriced ? `${midPoint}%` : `${midPoint - barWidth}%`,
            width: `${barWidth}%`,
          }}
        />
        {/* Pointer */}
        <div
          className="absolute -top-1 h-5 w-1 rounded bg-[#0B3B57] z-20"
          style={{
            left: `${midPoint + clampedGap}%`,
            transform: "translateX(-50%)",
          }}
        />
      </div>
      <div className="text-center text-xs text-gray-600 mt-1">
        {gap > 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`} (실제 대비)
      </div>
    </div>
  );
}

export function DiagnosisCard({ diagnosis }: DiagnosisCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(diagnosis.createdAt).toLocaleDateString(
    "ko-KR"
  );

  const verdictStyle = getVerdictStyle(diagnosis.premiumVerdict);

  const gapLabel =
    diagnosis.premiumGap >= 0
      ? `+${diagnosis.premiumGap.toFixed(1)}%`
      : `${diagnosis.premiumGap.toFixed(1)}%`;

  return (
    <div className="rounded-xl border-2 border-purple-300 bg-purple-50 overflow-hidden">
      {/* Collapsed Header */}
      <div className="p-4 sm:p-5">
        {/* Top row: Title + diagnosis info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-[#0B3B57] text-lg">권리진단서</h3>
          </div>
          <div className="text-xs text-gray-500">
            진단일: {formattedDate} | {diagnosis.diagnosisNumber}
          </div>
        </div>

        <div className="border-t border-purple-200 my-3" />

        {/* Fair premium + verdict */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="text-[#0B3B57]">
            <span className="text-sm text-gray-600">적정 권리금: </span>
            <span className="font-bold text-lg">
              {formatKRW(diagnosis.fairPremiumTotal)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">실제 대비:</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${verdictStyle}`}
            >
              {diagnosis.premiumVerdict} ({gapLabel})
            </span>
          </div>
        </div>

        <div className="border-t border-purple-200 my-3" />

        {/* Ratings row */}
        <div className="flex flex-wrap gap-4 sm:gap-6 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-[#0B3B57]">수익성</span>
            <Stars rating={diagnosis.profitRating} />
            <span className="text-xs text-gray-500">
              ({diagnosis.profitRating}/5)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-[#0B3B57]">입지</span>
            <Stars rating={diagnosis.locationRating} />
            <span className="text-xs text-gray-500">
              ({diagnosis.locationRating}/5)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-[#0B3B57]">리스크</span>
            <Stars rating={diagnosis.riskRating} />
            <span className="text-xs text-gray-500">
              ({diagnosis.riskRating}/5)
            </span>
          </div>
        </div>

        <div className="border-t border-purple-200 my-3" />

        {/* Overall grade */}
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-lg px-3 py-1 shrink-0">
            {diagnosis.overallGrade}
          </span>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
            {diagnosis.overallComment}
          </p>
        </div>

        <div className="border-t border-purple-200 my-3" />

        {/* Toggle button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 w-full text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors cursor-pointer"
        >
          {expanded ? "상세 진단서 접기" : "상세 진단서 보기"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Expanded Sections */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t-2 border-purple-200 px-4 sm:px-5 pb-5 space-y-4 pt-4">
          {/* Section 1: Fair Premium Breakdown */}
          <section>
            <h4 className="flex items-center gap-2 font-bold text-[#0B3B57] mb-3">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              적정 권리금 산정내역
            </h4>
            <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      영업권리금
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#0B3B57]">
                      {formatKRW(diagnosis.fairPremiumBusiness)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      시설권리금
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#0B3B57]">
                      {formatKRW(diagnosis.fairPremiumFacility)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      바닥권리금
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#0B3B57]">
                      {formatKRW(diagnosis.fairPremiumFloor)}
                    </td>
                  </tr>
                  <tr className="bg-purple-50">
                    <td className="px-4 py-2.5 font-bold text-[#0B3B57]">
                      합계
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-purple-700 text-base">
                      {formatKRW(diagnosis.fairPremiumTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <GapBar gap={diagnosis.premiumGap} />
          </section>

          {/* Section 2: Profitability Detail */}
          <section>
            <h4 className="flex items-center gap-2 font-bold text-[#0B3B57] mb-3">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              수익성 상세
            </h4>
            <div className="bg-white rounded-lg border border-purple-200 p-4 space-y-4">
              {/* Profit margin comparison */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600">영업이익률</span>
                  <span className="font-semibold text-[#0B3B57]">
                    {diagnosis.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-4 w-full rounded-full bg-gray-200">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-purple-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, diagnosis.profitMargin)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>이 매물</span>
                  <span>
                    업종 평균: {diagnosis.avgProfitMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-gray-100 mt-1">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gray-400"
                    style={{
                      width: `${Math.min(100, diagnosis.avgProfitMargin)}%`,
                    }}
                  />
                </div>
              </div>

              {/* ROI months comparison */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-600">투자 회수 기간</span>
                  <span className="font-semibold text-[#0B3B57]">
                    {diagnosis.roiMonths}개월
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>이 매물</span>
                      <span>{diagnosis.roiMonths}개월</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (diagnosis.roiMonths / Math.max(diagnosis.roiMonths, diagnosis.avgRoiMonths, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>업종 평균</span>
                      <span>{diagnosis.avgRoiMonths}개월</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gray-400 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (diagnosis.avgRoiMonths / Math.max(diagnosis.roiMonths, diagnosis.avgRoiMonths, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm font-medium text-gray-600">
                  수익성 평점
                </span>
                <Stars rating={diagnosis.profitRating} />
                <span className="text-sm font-bold text-[#0B3B57]">
                  {diagnosis.profitRating}/5
                </span>
              </div>
            </div>
          </section>

          {/* Section 3: Location Detail */}
          <section>
            <h4 className="flex items-center gap-2 font-bold text-[#0B3B57] mb-3">
              <MapPin className="h-4 w-4 text-purple-600" />
              입지 상세
            </h4>
            <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      유동인구
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#0B3B57]">
                      {diagnosis.footTraffic}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      경쟁밀도
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#0B3B57]">
                      {diagnosis.competitorDensity}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      역세권
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#0B3B57]">
                      {diagnosis.stationDistance}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50">
                <span className="text-sm font-medium text-gray-600">
                  입지 평점
                </span>
                <Stars rating={diagnosis.locationRating} />
                <span className="text-sm font-bold text-[#0B3B57]">
                  {diagnosis.locationRating}/5
                </span>
              </div>
            </div>
          </section>

          {/* Section 4: Risk Detail */}
          <section>
            <h4 className="flex items-center gap-2 font-bold text-[#0B3B57] mb-3">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              리스크 상세
            </h4>
            <div className="bg-white rounded-lg border border-purple-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      임대차 잔여
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#0B3B57]">
                      {diagnosis.leaseRemaining}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      건물 연식
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#0B3B57]">
                      {diagnosis.buildingAge}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-2.5 text-gray-600 font-medium">
                      권리금 보호
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          diagnosis.premiumProtection
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {diagnosis.premiumProtection ? "O (보호 대상)" : "X (비보호)"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50">
                <span className="text-sm font-medium text-gray-600">
                  리스크 평점
                </span>
                <Stars rating={diagnosis.riskRating} />
                <span className="text-sm font-bold text-[#0B3B57]">
                  {diagnosis.riskRating}/5
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
