"use client";

import Link from "next/link";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp,
  BarChart3, Clock, Building, ArrowLeft, Eye,
} from "lucide-react";

/* ─── Mock Data ─── */
const MOCK_LISTING = {
  title: "강남역 카페 양도 (샘플)",
  address: "서울특별시 강남구 강남대로 396",
};

const MOCK_VALUATION = {
  regionAvgPremium: 12000,
  industryAvgPremium: 10000,
  fairMin: 8000,
  fairMax: 15000,
  currentPremium: 11000,
  verdict: "적정" as const,
  recoveryMonths: 14,
  facilityPremium: 5000,
  monthlyRevenue: 2500,
  monthlyProfit: 800,
};

const MOCK_RISKS = {
  items: [
    { item: "임대차 계약 잔여기간", status: "안전", detail: "잔여 36개월 (안정적)" },
    { item: "건물 등기부등본 확인", status: "안전", detail: "근저당 없음" },
    { item: "상권 변동성 분석", status: "주의", detail: "유동인구 5% 감소 추세" },
    { item: "권리금 회수 가능성", status: "위험", detail: "재건축 예정 구역" },
  ],
  totalScore: 25,
  grade: "B",
};

/* ─── Style Maps ─── */
const GRADE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  A: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "안전" },
  B: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", label: "양호" },
  C: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "주의" },
  D: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "위험" },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  "안전": <CheckCircle className="h-5 w-5 text-green-500" />,
  "주의": <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  "위험": <XCircle className="h-5 w-5 text-red-500" />,
};

/* ─── Sub-components ─── */
function ComparisonBar({
  label, value, current, max,
}: {
  label: string; value: number; current: number; max: number;
}) {
  const barWidth = (value / max) * 100;
  const currentPos = (current / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{value.toLocaleString()}만원</span>
      </div>
      <div className="relative mt-1 h-5 rounded bg-gray-100">
        <div className="h-full rounded bg-blue-200" style={{ width: `${barWidth}%` }} />
        <div
          className="absolute top-0 h-full w-0.5 bg-red-500"
          style={{ left: `${currentPos}%` }}
          title={`현재: ${current.toLocaleString()}만원`}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon, label, value, sub,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon} {label}
      </p>
      <p className="mt-2 text-lg font-bold text-[#1B3A5C]">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
export default function ReportSamplePage() {
  const valuation = MOCK_VALUATION;
  const risks = MOCK_RISKS;
  const gradeStyle = GRADE_STYLES[risks.grade] ?? GRADE_STYLES.C;

  const verdictColor = "text-green-600";
  const verdictBg = "bg-green-100";

  const barMax = Math.max(valuation.regionAvgPremium, valuation.industryAvgPremium, valuation.currentPremium) * 1.3;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B3A5C]"
        >
          <ArrowLeft className="h-4 w-4" /> 홈으로
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#1B3A5C]">권리진단서 샘플</h1>
              <span className="rounded-full bg-[#F59E0B]/15 px-2.5 py-0.5 text-xs font-bold text-[#F59E0B]">
                <Eye className="mr-1 inline h-3 w-3" />
                미리보기
              </span>
            </div>
            <p className="mt-1 text-gray-500">
              {MOCK_LISTING.title} - {MOCK_LISTING.address}
            </p>
          </div>
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-gray-700">
            BASIC
          </span>
        </div>
      </div>

      {/* 1. Valuation Section -- always visible */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
          <BarChart3 className="h-5 w-5 text-[#1B3A5C]" />
          <h2 className="text-lg font-bold text-[#1B3A5C]">권리금 적정성 평가</h2>
        </div>
        <div className="p-6">
          {/* Verdict Badge */}
          <div className="mb-6 flex items-center gap-3">
            <span className={`rounded-lg px-4 py-2 text-lg font-bold ${verdictBg} ${verdictColor}`}>
              적정가
            </span>
            <p className="text-sm text-gray-600">
              현재 권리금 {valuation.currentPremium.toLocaleString()}만원은{" "}
              <strong className={verdictColor}>적정 범위 내</strong>입니다.
            </p>
          </div>

          {/* Comparison bars */}
          <div className="space-y-4">
            <ComparisonBar
              label="지역 평균 권리금"
              value={valuation.regionAvgPremium}
              current={valuation.currentPremium}
              max={barMax}
            />
            <ComparisonBar
              label="업종별 평균 권리금"
              value={valuation.industryAvgPremium}
              current={valuation.currentPremium}
              max={barMax}
            />
          </div>
        </div>
      </section>

      {/* Full report content */}
      <div>
        <div>

          {/* Fair range bar */}
          <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
              <TrendingUp className="h-5 w-5 text-[#1B3A5C]" />
              <h2 className="text-lg font-bold text-[#1B3A5C]">적정가 범위 및 핵심 지표</h2>
            </div>
            <div className="p-6">
              <p className="mb-2 text-sm font-medium text-gray-700">적정가 범위</p>
              <div className="relative h-8 rounded-full bg-gray-200">
                <div
                  className="absolute top-0 h-full rounded-full bg-green-200"
                  style={{
                    left: `${(valuation.fairMin / (valuation.fairMax * 1.4)) * 100}%`,
                    width: `${((valuation.fairMax - valuation.fairMin) / (valuation.fairMax * 1.4)) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-blue-800"
                  style={{ left: `${(valuation.currentPremium / (valuation.fairMax * 1.4)) * 100}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{valuation.fairMin.toLocaleString()}만원</span>
                <span className="font-medium text-blue-700">현재: {valuation.currentPremium.toLocaleString()}만원</span>
                <span>{valuation.fairMax.toLocaleString()}만원</span>
              </div>

              {/* Key metrics */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MetricCard
                  icon={<Clock className="h-4 w-4" />}
                  label="권리금 회수 기간"
                  value={`${valuation.recoveryMonths}개월`}
                  sub="단기 회수"
                />
                <MetricCard
                  icon={<Building className="h-4 w-4" />}
                  label="시설 권리금 (감가반영)"
                  value={`${valuation.facilityPremium.toLocaleString()}만원`}
                  sub="인테리어 감가상각 반영"
                />
                <MetricCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="월 매출 대비 배수"
                  value={`${(valuation.currentPremium / valuation.monthlyRevenue).toFixed(1)}배`}
                  sub="권리금 / 월매출"
                />
              </div>
            </div>
          </section>

          {/* 2. Risk Analysis */}
          <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#1B3A5C]" />
                <h2 className="text-lg font-bold text-[#1B3A5C]">권리 위험요소 분석</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-lg border px-3 py-1 text-sm font-bold ${gradeStyle.bg} ${gradeStyle.text} ${gradeStyle.border}`}>
                  {risks.grade}등급
                </span>
                <span className="text-sm text-gray-500">({gradeStyle.label})</span>
              </div>
            </div>
            <div className="p-6">
              {/* Risk score bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">종합 위험 점수</span>
                  <span className="font-bold">{risks.totalScore}점</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-yellow-500"
                    style={{ width: `${Math.min(100, risks.totalScore)}%` }}
                  />
                </div>
              </div>

              {/* Risk items */}
              <div className="space-y-3">
                {risks.items.map((risk, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {STATUS_ICON[risk.status]}
                      <span className="text-sm font-medium text-gray-800">{risk.item}</span>
                    </div>
                    <span className="text-sm text-gray-600">{risk.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Watermark */}
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-center text-xs text-blue-600">
            본 권리진단서는 권리샵에서 발급되었습니다
          </div>

          {/* Disclaimer */}
          <div className="rounded-lg bg-yellow-50 p-4 text-xs leading-relaxed text-yellow-800">
            <p className="font-medium">면책사항</p>
            <p className="mt-1">
              본 권리진단서는 권리샵이 제공하는 참고용 분석 자료이며, 법적 효력이 있는 공식 문서가 아닙니다.
              실제 거래 시 반드시 공인중개사, 법률 전문가와 상담하시기 바랍니다.
              분석 결과의 정확성을 보증하지 않으며, 이를 근거로 한 거래 손실에 대해 책임지지 않습니다.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-accent px-8 text-sm font-bold text-white shadow-lg transition-all hover:bg-accent-dark active:scale-[0.97]"
          >
            권리진단서 신청하기
          </Link>
          <p className="mt-3 text-xs text-gray-400">
            이 페이지는 샘플 데이터로 구성된 미리보기입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
