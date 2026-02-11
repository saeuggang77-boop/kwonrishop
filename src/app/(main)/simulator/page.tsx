"use client";

import { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Calculator,
  Wallet,
  TrendingUp,
  Clock,
  Percent,
  Lock,
  ChevronLeft,
  ChevronRight,
  Save,
  FileDown,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { REGIONS } from "@/lib/utils/constants";

// ── Recharts (dynamic import to avoid SSR issues) ──────────────────────
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);
const PieChart = dynamic(
  () => import("recharts").then((m) => m.PieChart),
  { ssr: false },
);
const Pie = dynamic(
  () => import("recharts").then((m) => m.Pie),
  { ssr: false },
);
const Cell = dynamic(
  () => import("recharts").then((m) => m.Cell),
  { ssr: false },
);
const RTooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false },
);
const Legend = dynamic(
  () => import("recharts").then((m) => m.Legend),
  { ssr: false },
);
const LineChart = dynamic(
  () => import("recharts").then((m) => m.LineChart),
  { ssr: false },
);
const Line = dynamic(
  () => import("recharts").then((m) => m.Line),
  { ssr: false },
);
const XAxis = dynamic(
  () => import("recharts").then((m) => m.XAxis),
  { ssr: false },
);
const YAxis = dynamic(
  () => import("recharts").then((m) => m.YAxis),
  { ssr: false },
);
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false },
);
const ReferenceLine = dynamic(
  () => import("recharts").then((m) => m.ReferenceLine),
  { ssr: false },
);
const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false },
);
const Bar = dynamic(
  () => import("recharts").then((m) => m.Bar),
  { ssr: false },
);

// ── Types ──────────────────────────────────────────────────────────────
interface SimulatorState {
  // Step 1
  businessType: string;
  city: string;
  district: string;
  area: number;
  // Step 2
  keyMoney: number;
  deposit: number;
  interiorCost: number;
  equipmentCost: number;
  otherInitialCost: number;
  // Step 3
  monthlyRent: number;
  monthlyMaintenance: number;
  monthlyLabor: number;
  monthlyMaterial: number;
  monthlyOther: number;
  employees: number;
  // Step 4
  isManualRevenue: boolean;
  dailyCustomers: number;
  avgSpending: number;
  monthlyDays: number;
  manualRevenue: number;
}

// ── Constants ──────────────────────────────────────────────────────────
const BUSINESS_TYPES = [
  { label: "카페/베이커리", emoji: "☕" },
  { label: "치킨", emoji: "🍗" },
  { label: "한식", emoji: "🍚" },
  { label: "미용실", emoji: "💇" },
  { label: "편의점", emoji: "🏪" },
  { label: "기타", emoji: "🔖" },
];

const STEPS = [
  { num: 1, label: "기본 설정" },
  { num: 2, label: "초기 투자" },
  { num: 3, label: "월 고정비" },
  { num: 4, label: "예상 매출" },
];

const INDUSTRY_AVG: Record<string, { avgRevenue: number; avgProfitRate: number }> = {
  "카페/베이커리": { avgRevenue: 2500, avgProfitRate: 18 },
  "치킨": { avgRevenue: 3000, avgProfitRate: 22 },
  "한식": { avgRevenue: 3500, avgProfitRate: 20 },
  "미용실": { avgRevenue: 2000, avgProfitRate: 30 },
  "편의점": { avgRevenue: 4000, avgProfitRate: 15 },
  "기타": { avgRevenue: 2500, avgProfitRate: 20 },
};

const PIE_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#2EC4B6"];

const INITIAL_STATE: SimulatorState = {
  businessType: "",
  city: "",
  district: "",
  area: 20,
  keyMoney: 0,
  deposit: 0,
  interiorCost: 0,
  equipmentCost: 0,
  otherInitialCost: 0,
  monthlyRent: 0,
  monthlyMaintenance: 0,
  monthlyLabor: 0,
  monthlyMaterial: 0,
  monthlyOther: 0,
  employees: 0,
  isManualRevenue: false,
  dailyCustomers: 50,
  avgSpending: 15000,
  monthlyDays: 25,
  manualRevenue: 0,
};

// ── Helper ─────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

// ── Main Component ─────────────────────────────────────────────────────
export default function SimulatorPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [state, setState] = useState<SimulatorState>(INITIAL_STATE);
  const [showResults, setShowResults] = useState(false);

  const isPro =
    session?.user?.subscriptionTier === "PREMIUM" ||
    session?.user?.subscriptionTier === "ENTERPRISE";

  // ── State updater ────────────────────────────────────────────────────
  function update<K extends keyof SimulatorState>(key: K, value: SimulatorState[K]) {
    setState((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-estimate labor cost when employees change
      if (key === "employees") {
        next.monthlyLabor = (value as number) * 220;
      }
      return next;
    });
  }

  // ── Calculations ─────────────────────────────────────────────────────
  const totalInitialManwon =
    state.keyMoney + state.deposit + state.interiorCost + state.equipmentCost + state.otherInitialCost;

  const monthlyExpense =
    state.monthlyRent + state.monthlyMaintenance + state.monthlyLabor + state.monthlyMaterial + state.monthlyOther;

  const monthlyRevenue = state.isManualRevenue
    ? state.manualRevenue
    : Math.round((state.dailyCustomers * state.avgSpending * state.monthlyDays) / 10000);

  const monthlyProfit = monthlyRevenue - monthlyExpense;

  const paybackMonths =
    monthlyProfit > 0 ? Math.ceil(totalInitialManwon / monthlyProfit) : Infinity;

  const roi =
    totalInitialManwon > 0 ? (monthlyProfit * 12) / totalInitialManwon * 100 : 0;

  // ── Chart data ───────────────────────────────────────────────────────
  const pieData = useMemo(() => {
    const entries = [
      { name: "재료비", value: state.monthlyMaterial },
      { name: "인건비", value: state.monthlyLabor },
      { name: "임대료", value: state.monthlyRent },
      { name: "관리비", value: state.monthlyMaintenance },
      { name: "기타비용", value: state.monthlyOther },
      { name: "순이익", value: Math.max(0, monthlyProfit) },
    ];
    return entries.filter((e) => e.value > 0);
  }, [state.monthlyMaterial, state.monthlyLabor, state.monthlyRent, state.monthlyMaintenance, state.monthlyOther, monthlyProfit]);

  const lineData = useMemo(() => {
    const data: { month: string; 낙관: number; 기본: number; 비관: number }[] = [];
    let cumOptimistic = -totalInitialManwon;
    let cumBase = -totalInitialManwon;
    let cumPessimistic = -totalInitialManwon;

    for (let m = 1; m <= 12; m++) {
      cumOptimistic += Math.round(monthlyProfit * 1.2);
      cumBase += monthlyProfit;
      cumPessimistic += Math.round(monthlyProfit * 0.8);
      data.push({
        month: `${m}월`,
        낙관: cumOptimistic,
        기본: cumBase,
        비관: cumPessimistic,
      });
    }
    return data;
  }, [totalInitialManwon, monthlyProfit]);

  const industryAvg = INDUSTRY_AVG[state.businessType] ?? INDUSTRY_AVG["기타"];
  const myProfitRate = monthlyRevenue > 0 ? Math.round((monthlyProfit / monthlyRevenue) * 100) : 0;

  const barCompareData = useMemo(
    () => [
      { name: "월 매출 (만원)", 내매출: monthlyRevenue, 업종평균: industryAvg.avgRevenue },
      { name: "순이익률 (%)", 내순이익률: myProfitRate, 업종평균순이익률: industryAvg.avgProfitRate },
    ],
    [monthlyRevenue, industryAvg, myProfitRate],
  );

  // ── Sensitivity data ─────────────────────────────────────────────────
  const revenueSensitivity = [-10, -20, -30].map((pct) => {
    const adjusted = Math.round(monthlyRevenue * (1 + pct / 100));
    const profit = adjusted - monthlyExpense;
    return { label: `매출 ${pct}%`, revenue: adjusted, profit };
  });

  const rentSensitivity = [10, 20].map((pct) => {
    const adjustedRent = Math.round(state.monthlyRent * (1 + pct / 100));
    const adjustedExpense = monthlyExpense - state.monthlyRent + adjustedRent;
    const profit = monthlyRevenue - adjustedExpense;
    return { label: `임대료 +${pct}%`, rent: adjustedRent, profit };
  });

  // ── Handlers ─────────────────────────────────────────────────────────
  function handleShowResults() {
    setShowResults(true);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleReset() {
    setState(INITIAL_STATE);
    setStep(1);
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSave() {
    if (!session?.user) {
      toast("error", "로그인 후 시뮬레이션을 저장할 수 있습니다.");
      return;
    }
    try {
      const res = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...state,
          monthlyRevenue,
          monthlyProfit,
          totalInitialCost: totalInitialManwon,
          paybackMonths: paybackMonths === Infinity ? null : paybackMonths,
          roi,
        }),
      });
      if (res.ok) {
        toast("success", "시뮬레이션이 저장되었습니다.");
      } else {
        toast("error", "저장에 실패했습니다. 다시 시도해주세요.");
      }
    } catch {
      toast("error", "저장에 실패했습니다. 다시 시도해주세요.");
    }
  }

  function handlePdfDownload() {
    if (!isPro) {
      toast("info", "PDF 다운로드는 프로회원 전용 기능입니다.");
      return;
    }
    toast("info", "PDF 다운로드 기능은 준비 중입니다.");
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/10">
          <Calculator className="h-7 w-7 text-mint" />
        </div>
        <h1 className="text-2xl font-bold text-navy">창업 시뮬레이터</h1>
        <p className="mt-2 text-sm text-gray-500">
          내 조건에 맞는 창업 수익성을 분석해보세요
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-10 flex items-center justify-center">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (s.num <= step || showResults) setStep(s.num);
              }}
              className="flex flex-col items-center"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  step >= s.num
                    ? "bg-mint text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.num}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  step >= s.num ? "text-mint" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-8 sm:w-14 ${
                  step > s.num ? "bg-mint" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        {/* ── Step 1 ───────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="mb-6 text-lg font-bold text-navy">기본 설정</h2>

            {/* 업종 선택 */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                업종 선택
              </label>
              <div className="grid grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((bt) => (
                  <button
                    key={bt.label}
                    type="button"
                    onClick={() => update("businessType", bt.label)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-colors ${
                      state.businessType === bt.label
                        ? "border-mint bg-mint/10 text-navy"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{bt.emoji}</span>
                    <span>{bt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 지역 선택 */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                지역 선택
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={state.city}
                  onChange={(e) => {
                    update("city", e.target.value);
                    update("district", "");
                  }}
                  aria-label="시/도 선택"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                >
                  <option value="">시/도 선택</option>
                  {Object.keys(REGIONS).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  value={state.district}
                  onChange={(e) => update("district", e.target.value)}
                  aria-label="구/군 선택"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                >
                  <option value="">구/군 선택</option>
                  {(REGIONS[state.city] ?? []).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 예상 면적 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                예상 면적:{" "}
                <span className="font-bold text-mint">{state.area}평</span>
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={state.area}
                onChange={(e) => update("area", Number(e.target.value))}
                className="w-full accent-[#2EC4B6]"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>10평</span>
                <span>100평</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2 ───────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="mb-6 text-lg font-bold text-navy">초기 투자 비용</h2>
            <div className="space-y-4">
              <NumberInput label="권리금" value={state.keyMoney} onChange={(v) => update("keyMoney", v)} suffix="만원" />
              <NumberInput label="보증금" value={state.deposit} onChange={(v) => update("deposit", v)} suffix="만원" />
              <NumberInput label="인테리어" value={state.interiorCost} onChange={(v) => update("interiorCost", v)} suffix="만원" />
              <NumberInput label="설비/장비" value={state.equipmentCost} onChange={(v) => update("equipmentCost", v)} suffix="만원" />
              <NumberInput label="기타 초기비용" value={state.otherInitialCost} onChange={(v) => update("otherInitialCost", v)} suffix="만원" />
            </div>
            <div className="mt-6 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm font-bold text-navy">합계</span>
              <span className="text-lg font-bold text-navy">
                {fmt(totalInitialManwon)} 만원
              </span>
            </div>
          </div>
        )}

        {/* ── Step 3 ───────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="mb-6 text-lg font-bold text-navy">월 고정비</h2>
            <div className="space-y-4">
              <NumberInput label="월 임대료" value={state.monthlyRent} onChange={(v) => update("monthlyRent", v)} suffix="만원" />
              <NumberInput label="월 관리비" value={state.monthlyMaintenance} onChange={(v) => update("monthlyMaintenance", v)} suffix="만원" />
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <NumberInput label="월 인건비" value={state.monthlyLabor} onChange={(v) => update("monthlyLabor", v)} suffix="만원" />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    직원 수
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={state.employees}
                      onChange={(e) => update("employees", Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-right text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                    />
                    <span className="shrink-0 text-sm text-gray-500">명</span>
                  </div>
                </div>
              </div>
              <NumberInput label="월 재료비/원가" value={state.monthlyMaterial} onChange={(v) => update("monthlyMaterial", v)} suffix="만원" />
              <NumberInput label="기타 고정비" value={state.monthlyOther} onChange={(v) => update("monthlyOther", v)} suffix="만원" />
            </div>
            <div className="mt-6 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <span className="text-sm font-bold text-navy">합계</span>
              <span className="text-lg font-bold text-navy">
                {fmt(monthlyExpense)} 만원 / 월
              </span>
            </div>
          </div>
        )}

        {/* ── Step 4 ───────────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="mb-6 text-lg font-bold text-navy">예상 매출</h2>

            {/* Toggle */}
            <div className="mb-6 flex overflow-hidden rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => update("isManualRevenue", false)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  !state.isManualRevenue
                    ? "bg-mint text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                자동 계산
              </button>
              <button
                type="button"
                onClick={() => update("isManualRevenue", true)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  state.isManualRevenue
                    ? "bg-mint text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                직접 입력
              </button>
            </div>

            {!state.isManualRevenue ? (
              <div className="space-y-6">
                {/* 일 평균 고객수 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    일 평균 고객수:{" "}
                    <span className="font-bold text-mint">
                      {fmt(state.dailyCustomers)}명
                    </span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    value={state.dailyCustomers}
                    onChange={(e) =>
                      update("dailyCustomers", Number(e.target.value))
                    }
                    className="w-full accent-[#2EC4B6]"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>10명</span>
                    <span>500명</span>
                  </div>
                </div>

                {/* 객단가 */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    객단가:{" "}
                    <span className="font-bold text-mint">
                      {fmt(state.avgSpending)}원
                    </span>
                  </label>
                  <input
                    type="range"
                    min={5000}
                    max={50000}
                    step={1000}
                    value={state.avgSpending}
                    onChange={(e) =>
                      update("avgSpending", Number(e.target.value))
                    }
                    className="w-full accent-[#2EC4B6]"
                  />
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>5,000원</span>
                    <span>50,000원</span>
                  </div>
                </div>

                {/* 월 영업일수 */}
                <NumberInput
                  label="월 영업일수"
                  value={state.monthlyDays}
                  onChange={(v) => update("monthlyDays", v)}
                  suffix="일"
                />

                {/* 예상 월 매출 */}
                <div className="rounded-lg bg-mint/10 px-4 py-3 text-center">
                  <span className="text-sm text-gray-600">예상 월 매출 </span>
                  <span className="text-xl font-bold text-mint">
                    {fmt(monthlyRevenue)} 만원
                  </span>
                </div>
              </div>
            ) : (
              <NumberInput
                label="월 매출"
                value={state.manualRevenue}
                onChange={(v) => update("manualRevenue", v)}
                suffix="만원"
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mint/90"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleShowResults}
              className="flex items-center gap-1.5 rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
            >
              <Calculator className="h-4 w-4" />
              시뮬레이션 결과 보기
            </button>
          )}
        </div>
      </div>

      {/* ── Results Section ─────────────────────────────────────────── */}
      {showResults && (
        <div ref={resultRef} className="mt-10">
          <h2 className="mb-6 text-xl font-bold text-navy">시뮬레이션 결과</h2>

          {/* Pro gate */}
          <div className="relative">
            {!isPro && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-md">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy/10">
                    <Lock className="h-8 w-8 text-navy" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-navy">
                    프로회원 전용 기능
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    시뮬레이션 상세 결과는 프로회원만 열람할 수 있습니다
                  </p>
                  <Link
                    href="/premium/checkout"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy/90"
                  >
                    <Lock className="h-4 w-4" />
                    프로회원 가입하기
                  </Link>
                </div>
              </div>
            )}

            <div className={!isPro ? "pointer-events-none select-none" : ""}>
              {/* KPI Cards */}
              <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  icon={<Wallet className="h-5 w-5" />}
                  label="총 초기 투자금"
                  value={`${fmt(totalInitialManwon)} 만원`}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-100"
                />
                <KpiCard
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="예상 월 순이익"
                  value={`${fmt(monthlyProfit)} 만원`}
                  iconColor={monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}
                  iconBg={monthlyProfit >= 0 ? "bg-green-100" : "bg-red-100"}
                  valueColor={monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}
                />
                <KpiCard
                  icon={<Clock className="h-5 w-5" />}
                  label="투자금 회수 기간"
                  value={paybackMonths === Infinity ? "회수 불가" : `${fmt(paybackMonths)}개월`}
                  iconColor="text-orange-600"
                  iconBg="bg-orange-100"
                />
                <KpiCard
                  icon={<Percent className="h-5 w-5" />}
                  label="연 투자 수익률"
                  value={`${roi.toFixed(1)}%`}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-100"
                />
              </div>

              {/* Pie Chart — 월 수익 구조 */}
              <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-navy">
                  월 수익 구조
                </h3>
                {typeof window !== "undefined" && pieData.length > 0 && (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) =>
                          `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((_entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={PIE_COLORS[idx % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RTooltip
                        formatter={(value) => `${fmt(Number(value ?? 0))} 만원`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Line Chart — 12개월 누적 손익 */}
              <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-navy">
                  12개월 누적 손익
                </h3>
                {typeof window !== "undefined" && (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => `${fmt(v)}`}
                      />
                      <RTooltip
                        formatter={(value) => `${fmt(Number(value ?? 0))} 만원`}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" label="BEP" />
                      <Line
                        type="monotone"
                        dataKey="낙관"
                        stroke="#2EC4B6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="기본"
                        stroke="#0B3B57"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="비관"
                        stroke="#FF6B6B"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bar Chart — 업종 평균 비교 */}
              <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-navy">
                  업종 평균 비교
                </h3>
                {typeof window !== "undefined" && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barCompareData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RTooltip />
                      <Legend />
                      <Bar
                        dataKey="내매출"
                        fill="#2EC4B6"
                        name="내 매출"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="업종평균"
                        fill="#0B3B57"
                        name="업종 평균 매출"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="내순이익률"
                        fill="#4ECDC4"
                        name="내 순이익률"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="업종평균순이익률"
                        fill="#45B7D1"
                        name="업종 평균 순이익률"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Sensitivity Analysis Table */}
              <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-navy">
                  민감도 분석
                </h3>

                {/* Revenue sensitivity */}
                <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  매출 변동
                </h4>
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                          시나리오
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                          조정 매출 (만원)
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                          월 순이익 (만원)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueSensitivity.map((row) => (
                        <tr
                          key={row.label}
                          className="border-b border-gray-100"
                        >
                          <td className="px-3 py-2.5 font-medium">
                            {row.label}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {fmt(row.revenue)}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-right font-bold ${
                              row.profit < 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {fmt(row.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Rent sensitivity */}
                <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  임대료 변동
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-500">
                          시나리오
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                          조정 임대료 (만원)
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">
                          월 순이익 (만원)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentSensitivity.map((row) => (
                        <tr
                          key={row.label}
                          className="border-b border-gray-100"
                        >
                          <td className="px-3 py-2.5 font-medium">
                            {row.label}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {fmt(row.rent)}
                          </td>
                          <td
                            className={`px-3 py-2.5 text-right font-bold ${
                              row.profit < 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {fmt(row.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mint/90"
                >
                  <Save className="h-4 w-4" />
                  시뮬레이션 저장
                </button>
                <button
                  type="button"
                  onClick={handlePdfDownload}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {isPro ? (
                    <FileDown className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  PDF 다운로드
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  다시 시뮬레이션
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────
function NumberInput({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="shrink-0 text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          value={value || ""}
          placeholder="0"
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-right text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
        />
        <span className="shrink-0 text-sm text-gray-500">{suffix}</span>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  iconColor,
  iconBg,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p
            className={`mt-0.5 truncate text-lg font-bold ${valueColor ?? "text-navy"}`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
