"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, FileText,
  Download, ArrowLeft, BarChart3, Target, Clock, Building,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ReportDetail {
  id: string;
  status: string;
  listing: {
    id: string;
    title: string;
    address: string;
    city: string;
    district: string;
    businessCategory: string;
  };
  plan: { name: string; displayName: string; price: number };
  data: {
    id: string;
    inputData: Record<string, unknown>;
    analysisResult: {
      valuation: {
        regionAvgPremium: number;
        industryAvgPremium: number;
        fairMin: number;
        fairMax: number;
        currentPremium: number;
        verdict: string;
        recoveryMonths: number;
        facilityPremium: number;
        monthlyRevenue: number;
        monthlyProfit: number;
      };
      risks: {
        items: { item: string; status: string; detail: string }[];
        totalScore: number;
        grade: string;
      };
      checklist?: { id: number; item: string; checked: boolean }[];
    };
    pdfUrl: string | null;
  } | null;
  createdAt: string;
}

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

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<{ id: number; item: string; checked: boolean }[]>([]);

  useEffect(() => {
    fetch(`/api/report-purchases/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setReport(json.data);
          if (json.data.data?.analysisResult?.checklist) {
            setChecklist(json.data.data.analysisResult.checklist);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleCheck = (checkId: number) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === checkId ? { ...c, checked: !c.checked } : c))
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!report || !report.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gray-500">리포트를 찾을 수 없습니다.</p>
        <Link href="/my/reports" className="mt-4 inline-block text-blue-600 hover:underline">
          내 리포트 목록으로
        </Link>
      </div>
    );
  }

  const { valuation, risks } = report.data.analysisResult;
  const isPremium = report.plan.name === "PREMIUM";
  const gradeStyle = GRADE_STYLES[risks.grade] ?? GRADE_STYLES.C;
  const checkedCount = checklist.filter((c) => c.checked).length;

  const verdictColor = valuation.verdict === "적정" ? "text-green-600" : valuation.verdict === "저가" ? "text-blue-600" : "text-red-600";
  const verdictBg = valuation.verdict === "적정" ? "bg-green-100" : valuation.verdict === "저가" ? "bg-blue-100" : "bg-red-100";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/my/reports" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" /> 내 리포트 목록
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">권리분석 리포트</h1>
            <p className="mt-1 text-gray-500">{report.listing.title} - {report.listing.address}</p>
          </div>
          <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
            isPremium ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
          }`}>
            {report.plan.displayName}
          </span>
        </div>
      </div>

      {/* 1. 권리금 적정성 평가 */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-blue-900">권리금 적정성 평가</h2>
        </div>
        <div className="p-6">
          {/* Verdict Badge */}
          <div className="mb-6 flex items-center gap-3">
            <span className={`rounded-lg px-4 py-2 text-lg font-bold ${verdictBg} ${verdictColor}`}>
              {valuation.verdict === "적정" ? "적정가" : valuation.verdict === "저가" ? "저가" : "고가"}
            </span>
            <p className="text-sm text-gray-600">
              현재 권리금 {valuation.currentPremium.toLocaleString()}만원은{" "}
              <strong className={verdictColor}>
                {valuation.verdict === "적정"
                  ? "적정 범위 내"
                  : valuation.verdict === "저가"
                  ? "시세 대비 저렴한 수준"
                  : "시세 대비 높은 수준"}
              </strong>
              입니다.
            </p>
          </div>

          {/* Comparison bars */}
          <div className="space-y-4">
            <ComparisonBar
              label="지역 평균 권리금"
              value={valuation.regionAvgPremium}
              current={valuation.currentPremium}
              max={Math.max(valuation.regionAvgPremium, valuation.industryAvgPremium, valuation.currentPremium) * 1.3}
            />
            <ComparisonBar
              label="업종별 평균 권리금"
              value={valuation.industryAvgPremium}
              current={valuation.currentPremium}
              max={Math.max(valuation.regionAvgPremium, valuation.industryAvgPremium, valuation.currentPremium) * 1.3}
            />
          </div>

          {/* Fair range bar */}
          <div className="mt-6">
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
          </div>

          {/* Key metrics */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MetricCard
              icon={<Clock className="h-4 w-4" />}
              label="권리금 회수 기간"
              value={`${valuation.recoveryMonths}개월`}
              sub={valuation.recoveryMonths > 24 ? "장기 회수" : "단기 회수"}
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
              value={valuation.monthlyRevenue > 0 ? `${(valuation.currentPremium / valuation.monthlyRevenue).toFixed(1)}배` : "-"}
              sub="권리금 / 월매출"
            />
          </div>
        </div>
      </section>

      {/* 2. 권리 위험요소 분석 */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-blue-900">권리 위험요소 분석</h2>
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
                className={`h-full rounded-full ${
                  risks.totalScore <= 10
                    ? "bg-green-500"
                    : risks.totalScore <= 30
                    ? "bg-yellow-500"
                    : risks.totalScore <= 50
                    ? "bg-orange-500"
                    : "bg-red-500"
                }`}
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

      {/* 3. 임대차 계약 체크리스트 (PREMIUM only) */}
      {isPremium && checklist.length > 0 && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white px-6 py-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold text-blue-900">임대차 계약 체크리스트</h2>
            </div>
            <span className="text-sm text-gray-500">
              {checkedCount}/{checklist.length} 완료
            </span>
          </div>
          <div className="p-6">
            {/* Progress */}
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${(checkedCount / checklist.length) * 100}%` }}
              />
            </div>
            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                    item.checked
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-100 bg-white hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleCheck(item.id)}
                    className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                  />
                  <span className={`text-sm ${item.checked ? "text-blue-700 line-through" : "text-gray-700"}`}>
                    {item.item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. PDF Download (PREMIUM only) */}
      {isPremium && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-6">
            <div>
              <h3 className="font-bold text-blue-900">PDF 리포트 다운로드</h3>
              <p className="mt-1 text-sm text-gray-500">권리샵 로고 + 워터마크가 포함된 전체 분석 리포트</p>
            </div>
            <button
              onClick={() => {
                const url = report.data?.pdfUrl;
                if (url) {
                  window.open(url, "_blank");
                } else {
                  toast("info", "PDF가 아직 생성되지 않았습니다. 잠시 후 다시 시도해주세요.");
                }
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              PDF 다운로드
            </button>
          </div>
        </section>
      )}

      {/* Not premium upsell */}
      {!isPremium && (
        <section className="mb-8 overflow-hidden rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-6 text-center">
          <Target className="mx-auto h-8 w-8 text-blue-400" />
          <h3 className="mt-3 font-bold text-blue-900">PREMIUM 리포트로 업그레이드</h3>
          <p className="mt-2 text-sm text-gray-600">
            임대차 계약 체크리스트 20항목 + 상세 위험요소 분석 + PDF 다운로드
          </p>
          <Link
            href={`/reports/request/${report.listing.id}`}
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            PREMIUM으로 업그레이드
          </Link>
        </section>
      )}

      {/* Footer */}
      <div className="rounded-lg bg-yellow-50 p-4 text-xs leading-relaxed text-yellow-800">
        <p className="font-medium">면책사항</p>
        <p className="mt-1">
          본 분석 리포트는 입력된 정보를 기반으로 한 참고 자료이며, 법적 효력이 없습니다.
          중요한 거래 결정 시 반드시 전문가 (변호사, 공인중개사) 상담을 받으시기 바랍니다.
        </p>
      </div>
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  current,
  max,
}: {
  label: string;
  value: number;
  current: number;
  max: number;
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
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon} {label}
      </p>
      <p className="mt-2 text-lg font-bold text-blue-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
    </div>
  );
}
