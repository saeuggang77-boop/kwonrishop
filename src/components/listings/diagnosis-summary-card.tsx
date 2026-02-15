"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield, ShieldCheck, TrendingUp, Clock, Target,
  AlertTriangle, CheckCircle, XCircle, ChevronRight,
  FileText, Sparkles, BarChart3, Percent, Activity,
  Building, Zap, Eye, Award,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════ */
/*  Types                                                          */
/* ═══════════════════════════════════════════════════════════════ */

interface DiagnosisSummaryData {
  grade: "A" | "B" | "C";
  gradeLabel: string;
  score: number;
  oneLiner: string;
  currentPremium: number;     // 만원
  aiEstimateMin: number;      // 만원
  aiEstimateMax: number;      // 만원
  composition: { name: string; value: number; pct: number }[];
  trend: { month: string; value: number }[];
  metrics: { label: string; value: string; sub: string }[];
  risks: { item: string; status: "안전" | "주의" | "위험"; detail: string }[];
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Mock Data — TODO: 실제 API 연결 시 props로 교체                   */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK_DIAGNOSIS: DiagnosisSummaryData = {
  grade: "B",
  gradeLabel: "양호",
  score: 75,
  oneLiner: "권리금은 적정 범위이나, 상권 변동성에 주의가 필요합니다",
  currentPremium: 11000,
  aiEstimateMin: 9500,
  aiEstimateMax: 12000,
  composition: [
    { name: "영업권리금", value: 6600, pct: 60 },
    { name: "시설권리금", value: 3300, pct: 30 },
    { name: "바닥권리금", value: 1100, pct: 10 },
  ],
  trend: [
    { month: "9월", value: 10200 },
    { month: "10월", value: 10500 },
    { month: "11월", value: 10800 },
    { month: "12월", value: 11200 },
    { month: "1월", value: 10900 },
    { month: "2월", value: 11000 },
  ],
  metrics: [
    { label: "권리금 회수 기간", value: "14개월", sub: "단기 회수 가능" },
    { label: "시설 권리금", value: "3,300만원", sub: "감가상각 반영" },
    { label: "월매출 대비 배수", value: "4.4배", sub: "권리금/월매출" },
  ],
  risks: [
    { item: "상권 변동성", status: "주의", detail: "유동인구 5% 감소 추세" },
    { item: "재건축 가능성", status: "위험", detail: "재건축 예정 구역 포함" },
    { item: "임대차 계약", status: "안전", detail: "잔여 36개월로 안정적" },
  ],
};

const PIE_COLORS = ["#1B3A5C", "#3B82F6", "#93C5FD"];

const GRADE_STYLE: Record<string, { ring: string; bg: string; text: string; glow: string }> = {
  A: { ring: "ring-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700", glow: "shadow-emerald-200/60" },
  B: { ring: "ring-blue-400", bg: "bg-blue-50", text: "text-blue-700", glow: "shadow-blue-200/60" },
  C: { ring: "ring-amber-400", bg: "bg-amber-50", text: "text-amber-700", glow: "shadow-amber-200/60" },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  "안전": <CheckCircle className="h-4 w-4 shrink-0 text-blue-500" />,
  "주의": <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />,
  "위험": <XCircle className="h-4 w-4 shrink-0 text-red-500" />,
};

const STATUS_BADGE: Record<string, string> = {
  "안전": "bg-blue-100 text-blue-700",
  "주의": "bg-amber-100 text-amber-700",
  "위험": "bg-red-100 text-red-700",
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Animated Score Ring                                            */
/* ═══════════════════════════════════════════════════════════════ */

function AnimatedScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const step = () => {
            start += 2;
            if (start > score) { setAnimated(score); return; }
            setAnimated(start);
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [score]);

  const circumference = 2 * Math.PI * 42;
  const strokeOffset = circumference - (animated / 100) * circumference;

  return (
    <div ref={ref} className="relative flex h-20 w-20 items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          stroke="url(#scoreGradient)" strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          transform="rotate(-90 50 50)"
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1B3A5C" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <span className="text-xl font-black text-[#1B3A5C]">{animated}</span>
        <span className="text-[10px] text-gray-400">/100</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Chart Tooltip                                                  */
/* ═══════════════════════════════════════════════════════════════ */

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 font-bold text-[#1B3A5C]">{payload[0].value.toLocaleString()}만원</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  DiagnosisSummaryCard — 진단서 발급 완료 매물용                     */
/* ═══════════════════════════════════════════════════════════════ */

export function DiagnosisSummaryCard({
  listingId,
  // TODO: 실제 진단서 데이터를 props로 받도록 변경
  // data,
}: {
  listingId: string;
  // data?: DiagnosisSummaryData;
}) {
  // TODO: props.data가 있으면 사용, 없으면 mock
  const d = MOCK_DIAGNOSIS;
  const gc = GRADE_STYLE[d.grade] ?? GRADE_STYLE.C;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ── Navy Gradient Header ── */}
      <div className="bg-gradient-to-r from-[#1B3A5C] to-[#2D5F8A] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-white/80" />
            <h3 className="text-base font-bold text-white">권리진단서 결과</h3>
          </div>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white/90">
            진단 완료
          </span>
        </div>
      </div>

      {/* ── Summary Row: Grade + Score + One-liner ── */}
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Grade Circle */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ring-[3px] shadow-lg ${gc.ring} ${gc.bg} ${gc.glow}`}>
              <div className="text-center">
                <span className={`text-2xl font-black ${gc.text}`}>{d.grade}</span>
              </div>
            </div>
            <span className={`text-[11px] font-bold ${gc.text}`}>{d.gradeLabel}</span>
          </div>

          {/* Score Ring + Text */}
          <div className="flex flex-1 items-center gap-4">
            <AnimatedScoreRing score={d.score} />
            <div className="flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">종합 점수</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{d.oneLiner}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 권리금 적정성 ── */}
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#1B3A5C]" />
          <h4 className="text-sm font-bold text-[#1B3A5C]">권리금 적정성</h4>
        </div>

        {/* Current vs AI Estimate */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] text-gray-500">현재 권리금</p>
            <p className="text-2xl font-black text-[#1B3A5C]">
              {d.currentPremium.toLocaleString()}<span className="text-sm font-bold">만원</span>
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 px-4 py-2">
            <p className="text-[11px] text-gray-500">AI 추정 적정가</p>
            <p className="text-sm font-bold text-[#1B3A5C]">
              {d.aiEstimateMin.toLocaleString()} ~ {d.aiEstimateMax.toLocaleString()}만원
            </p>
          </div>
        </div>

        {/* Fair Range Bar */}
        <div className="mb-5">
          <p className="mb-1.5 text-[11px] font-medium text-gray-500">적정가 범위</p>
          <div className="relative h-6 rounded-full bg-gray-200">
            <div
              className="absolute top-0 h-full rounded-full bg-blue-200/70"
              style={{
                left: `${(d.aiEstimateMin / (d.aiEstimateMax * 1.4)) * 100}%`,
                width: `${((d.aiEstimateMax - d.aiEstimateMin) / (d.aiEstimateMax * 1.4)) * 100}%`,
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${(d.currentPremium / (d.aiEstimateMax * 1.4)) * 100}%` }}
            >
              <div className="h-6 w-1 rounded-full bg-[#1B3A5C]" />
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>{d.aiEstimateMin.toLocaleString()}만</span>
            <span className="font-bold text-[#1B3A5C]">현재: {d.currentPremium.toLocaleString()}만</span>
            <span>{d.aiEstimateMax.toLocaleString()}만</span>
          </div>
        </div>

        {/* Pie + Trend Charts */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Composition Pie */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <p className="mb-3 text-xs font-medium text-gray-500">권리금 구성</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={150} height={150}>
                <PieChart>
                  <Pie
                    data={d.composition}
                    dataKey="value"
                    cx="50%" cy="50%"
                    innerRadius={40} outerRadius={65}
                    paddingAngle={3}
                  >
                    {d.composition.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {d.composition.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-gray-600">{c.name}</span>
                    <span className="ml-auto font-bold text-[#1B3A5C]">{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6-Month Trend */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <p className="mb-3 text-xs font-medium text-gray-500">인근 권리금 추이</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={d.trend}>
                <defs>
                  <linearGradient id="summaryTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis hide domain={["dataMin - 300", "dataMax + 300"]} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="value"
                  stroke="#1B3A5C" strokeWidth={2}
                  fill="url(#summaryTrendGrad)"
                  dot={{ fill: "#1B3A5C", r: 2.5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── 핵심 지표 3개 ── */}
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#1B3A5C]" />
          <h4 className="text-sm font-bold text-[#1B3A5C]">핵심 지표</h4>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {d.metrics.map((m) => (
            <div key={m.label} className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
              <p className="text-[10px] font-medium text-gray-500">{m.label}</p>
              <p className="mt-1 text-base font-bold text-[#1B3A5C]">{m.value}</p>
              <p className="mt-0.5 text-[10px] text-gray-400">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 위험요소 상위 3개 ── */}
      <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#1B3A5C]" />
          <h4 className="text-sm font-bold text-[#1B3A5C]">위험요소</h4>
        </div>
        <div className="space-y-2">
          {d.risks.map((risk) => (
            <div
              key={risk.item}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3.5 py-2.5"
            >
              {STATUS_ICON[risk.status]}
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-800">{risk.item}</span>
                <p className="text-[11px] text-gray-500">{risk.detail}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[risk.status]}`}>
                {risk.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 전체 보기 버튼 ── */}
      <div className="px-5 py-4 sm:px-6">
        <Link
          href={`/reports/${listingId}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#1B3A5C] bg-[#1B3A5C]/5 px-4 py-3 text-sm font-bold text-[#1B3A5C] transition-colors hover:bg-[#1B3A5C]/10"
        >
          <FileText className="h-4 w-4" />
          전체 진단서 보기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  DiagnosisCTACard — 진단서 미발급 매물용                          */
/* ═══════════════════════════════════════════════════════════════ */

const CTA_FEATURES = [
  { icon: Shield, label: "권리금 적정성 분석" },
  { icon: TrendingUp, label: "수익성 평가" },
  { icon: AlertTriangle, label: "위험요소 진단" },
  { icon: BarChart3, label: "상권 분석" },
  { icon: Target, label: "AI 추정가" },
  { icon: Award, label: "종합 등급 부여" },
];

export function DiagnosisCTACard({
  listingId,
}: {
  listingId: string;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 border-[#F59E0B]/30 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 shadow-sm">
      {/* Header */}
      <div className="px-5 pb-0 pt-6 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-lg shadow-amber-200/50">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-[#1B3A5C] sm:text-xl">
              이 매물은 안전할까요?
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              AI 기반 권리진단서로 권리금 적정성과 위험요소를 한눈에 확인하세요
            </p>
          </div>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {CTA_FEATURES.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#1B3A5C]/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[#1B3A5C] shadow-sm"
            >
              <f.icon className="h-3 w-3 text-[#F59E0B]" />
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* Gold CTA Button */}
      <div className="px-5 pb-5 sm:px-6">
        <Link
          href={`/reports/request/${listingId}`}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-300/30 transition-all hover:from-[#D97706] hover:to-[#B45309] hover:shadow-amber-400/40 active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          권리진단서 발급받기
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
            30,000원
          </span>
        </Link>
        <p className="mt-2.5 text-center text-[11px] text-gray-400">
          10분 내 AI 진단 완료 &middot; PDF 다운로드 &middot; 이메일 발송
        </p>
      </div>
    </div>
  );
}
