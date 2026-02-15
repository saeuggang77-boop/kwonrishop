"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp,
  BarChart3, Clock, Building, ArrowLeft, Eye, Lock, Star,
  DollarSign, PieChart as PieChartIcon, Users, MapPin,
  Calendar, ArrowRight, ChevronLeft, ChevronRight, FileText,
  Percent, Activity, Store, Landmark, Target,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, AreaChart, Area,
} from "recharts";

/* ═══════════════════════════════════════════════════════════════ */
/*  Mock Data                                                      */
/* ═══════════════════════════════════════════════════════════════ */

const MOCK = {
  listing: {
    title: "강남역 카페 양도",
    address: "서울특별시 강남구 강남대로 396",
    category: "카페/베이커리",
    floor: "1층",
    area: 20,
    diagnosisDate: "2026년 2월 11일",
  },
  summary: {
    grade: "B",
    gradeLabel: "양호",
    score: 75,
    oneLiner: "권리금은 적정 범위이나, 상권 변동성과 재건축 가능성에 주의가 필요합니다",
  },
  valuation: {
    currentPremium: 11000,
    aiEstimateMin: 9500,
    aiEstimateMax: 12000,
    regionAvg: 12000,
    industryAvg: 10000,
    perPyeong: 550,
    regionPerPyeong: 600,
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
  },
  metrics: [
    { icon: Clock, label: "권리금 회수 기간", value: "14개월", sub: "단기 회수" },
    { icon: Building, label: "시설 권리금 (감가반영)", value: "5,000만원", sub: "인테리어 감가상각 반영" },
    { icon: TrendingUp, label: "월 매출 대비 배수", value: "4.4배", sub: "권리금 / 월매출" },
    { icon: Target, label: "평당 권리금", value: "550만원", sub: "지역 평균 600만원" },
    { icon: Percent, label: "보증금 대비 비율", value: "220%", sub: "권리금 / 보증금" },
    { icon: Activity, label: "월 순익 대비 회수기간", value: "11개월", sub: "순이익 기준 회수" },
  ],
  profitability: {
    monthlySales: 2500,
    monthlyCost: 1700,
    monthlyProfit: 800,
    yearlyProfit: 9600,
    roi: 87.3,
    costs: [
      { name: "임대료", value: 350, color: "#1B3A5C" },
      { name: "인건비", value: 400, color: "#3B82F6" },
      { name: "재료비", value: 600, color: "#60A5FA" },
      { name: "관리비+기타", value: 350, color: "#93C5FD" },
    ],
  },
  commerce: {
    dailyFootTraffic: 45000,
    ageGroup: "20~30대 68%",
    genderRatio: { male: 45, female: 55 },
    competitors: 12,
    commerceGrade: "A",
    weeklyTraffic: [
      { day: "월", value: 42000 }, { day: "화", value: 41000 },
      { day: "수", value: 43000 }, { day: "목", value: 44000 },
      { day: "금", value: 52000 }, { day: "토", value: 58000 },
      { day: "일", value: 38000 },
    ],
    hourlyTraffic: [
      { hour: "8시", value: 1200 }, { hour: "10시", value: 3500 },
      { hour: "12시", value: 6800 }, { hour: "14시", value: 4200 },
      { hour: "16시", value: 3800 }, { hour: "18시", value: 7500 },
      { hour: "20시", value: 5200 }, { hour: "22시", value: 2100 },
    ],
  },
  lease: [
    { item: "임대차 계약 잔여기간", value: "36개월 (안정적)", safe: true },
    { item: "월세 적정성", value: "평당 17.5만원 (지역 평균 18만원)", safe: true },
    { item: "보증금 비율", value: "보증금/권리금 = 45% (적정)", safe: true },
    { item: "임대인 변경 이력", value: "없음", safe: true },
    { item: "건물 노후도", value: "준공 2015년 (11년차)", safe: false },
    { item: "재건축/재개발 여부", value: "예정 구역", safe: false },
  ],
  risks: [
    { item: "임대차 계약 잔여기간", status: "안전" as const, detail: "잔여 36개월 — 장기 계약이 보장되어 안정적인 운영이 가능합니다." },
    { item: "건물 등기부등본 확인", status: "안전" as const, detail: "근저당 없음 — 건물에 담보 설정이 없어 임차인 보호에 유리합니다." },
    { item: "상권 변동성 분석", status: "주의" as const, detail: "유동인구 5% 감소 추세 — 최근 6개월간 해당 상권 유동인구가 점진적으로 줄고 있습니다." },
    { item: "권리금 회수 가능성", status: "위험" as const, detail: "재건축 예정 구역 — 건물 철거 시 임차인 권리금 보호가 어려울 수 있습니다." },
    { item: "주변 대형 프랜차이즈 진출", status: "주의" as const, detail: "반경 200m 내 스타벅스·투썸 등 대형 프랜차이즈 3개 — 경쟁 심화 가능성이 있습니다." },
    { item: "임대료 인상률 추이 (3년)", status: "안전" as const, detail: "연평균 3.2% 인상 — 서울 평균(4.1%)보다 낮아 안정적입니다." },
    { item: "업종 포화도", status: "주의" as const, detail: "반경 500m 카페 밀집도 상위 15% — 경쟁 강도가 높은 지역입니다." },
  ],
  reviews: [
    { name: "김**", text: "권리진단서 덕분에 안전하게 거래했습니다. 위험요소를 미리 파악할 수 있어서 큰 도움이 됐어요.", rating: 5 },
    { name: "이**", text: "권리금이 적정한지 객관적으로 확인할 수 있어서 좋았습니다. 협상에도 큰 도움이 됐어요.", rating: 5 },
    { name: "박**", text: "권리진단서를 발급받았는데 상권 분석이 정말 상세해서 만족합니다. 강력 추천합니다.", rating: 5 },
  ],
};

const PIE_COLORS = ["#1B3A5C", "#3B82F6", "#93C5FD"];

/* ═══════════════════════════════════════════════════════════════ */
/*  Animated Gauge                                                 */
/* ═══════════════════════════════════════════════════════════════ */
function AnimatedGauge({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
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
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [score]);
  return (
    <div ref={ref} className="relative flex h-28 w-28 items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="#3B82F6" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={`${(animated / 100) * 327} 327`}
          transform="rotate(-90 60 60)" className="transition-all duration-500" />
      </svg>
      <div className="text-center">
        <span className="text-2xl font-bold text-navy">{animated}</span>
        <span className="text-xs text-gray-400">/100</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Blurred Section Wrapper                                        */
/* ═══════════════════════════════════════════════════════════════ */
function BlurredSection({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="pointer-events-none select-none blur-[6px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[2px]">
        <Lock className="h-8 w-8 text-navy/50" />
        <p className="mt-2 text-sm font-bold text-navy">{label ?? "권리진단서 발급 시 확인 가능"}</p>
        <Link href="/reports/request" className="mt-2 rounded-lg bg-navy px-4 py-1.5 text-xs font-medium text-white hover:bg-navy-dark">
          권리진단서 발급받기
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Section Header                                                 */
/* ═══════════════════════════════════════════════════════════════ */
function SectionHeader({ icon: Icon, title, badge }: { icon: React.ComponentType<{ className?: string }>; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[#E8F0FE] to-white px-6 py-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-navy" />
        <h2 className="text-lg font-bold text-navy">{title}</h2>
      </div>
      {badge}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Grade Badge                                                    */
/* ═══════════════════════════════════════════════════════════════ */
const GRADE_CONFIG: Record<string, { ring: string; bg: string; text: string; border: string }> = {
  A: { ring: "ring-green-400", bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  B: { ring: "ring-blue-400", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  C: { ring: "ring-yellow-400", bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  D: { ring: "ring-red-400", bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  "안전": <CheckCircle className="h-5 w-5 shrink-0 text-blue-500" />,
  "주의": <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />,
  "위험": <XCircle className="h-5 w-5 shrink-0 text-red-500" />,
};

const STATUS_STYLE: Record<string, string> = {
  "안전": "border-blue-100 bg-blue-50/50",
  "주의": "border-amber-100 bg-amber-50/50",
  "위험": "border-red-100 bg-red-50/50",
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Review Carousel                                                */
/* ═══════════════════════════════════════════════════════════════ */
function ReviewCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % MOCK.reviews.length), 4000);
    return () => clearInterval(t);
  }, []);
  const r = MOCK.reviews[idx];
  return (
    <div className="relative mt-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center gap-1">
        {Array.from({ length: r.rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="mt-2 text-sm text-gray-700 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
      <p className="mt-2 text-xs font-medium text-gray-500">{r.name} 님</p>
      <div className="absolute right-3 top-3 flex gap-1">
        {MOCK.reviews.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-navy" : "w-1.5 bg-gray-300"}`} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Custom Tooltip                                                 */
/* ═══════════════════════════════════════════════════════════════ */
function ChartTooltip({ active, payload, label, suffix }: { active?: boolean; payload?: { value: number }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-gray-600">{label}</p>
      <p className="mt-0.5 font-bold text-navy">{payload[0].value.toLocaleString()}{suffix ?? ""}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  PAGE                                                           */
/* ═══════════════════════════════════════════════════════════════ */
export default function ReportSamplePage() {
  const d = MOCK;
  const gc = GRADE_CONFIG[d.summary.grade] ?? GRADE_CONFIG.C;

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8">

      {/* ─── Watermark ─── */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center" aria-hidden>
        <p className="rotate-[-30deg] select-none text-[80px] font-black tracking-widest text-navy/[0.04] md:text-[120px]">
          SAMPLE
        </p>
      </div>

      {/* ─── Back ─── */}
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> 홈으로
      </Link>

      {/* ═══ 1. 상단 요약 카드 ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-navy to-[#2D5F8A] px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-white/80" />
            <h1 className="text-lg font-bold text-white">권리진단서 샘플</h1>
            <span className="ml-auto rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold text-white/90">
              <Eye className="mr-1 inline h-3 w-3" />미리보기
            </span>
          </div>
          <p className="mt-1 text-sm text-white/60">
            {d.listing.title} | {d.listing.category} | {d.listing.floor} {d.listing.area}평
          </p>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            {/* Grade Circle */}
            <div className="flex flex-col items-center gap-2">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full ring-4 ${gc.ring} ${gc.bg}`}>
                <div className="text-center">
                  <span className={`text-3xl font-black ${gc.text}`}>{d.summary.grade}</span>
                  <p className={`text-xs font-bold ${gc.text}`}>{d.summary.gradeLabel}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">종합 등급</span>
            </div>
            {/* Score Gauge + Summary */}
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <AnimatedGauge score={d.summary.score} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500">종합 점수</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-700">{d.summary.oneLiner}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {d.listing.diagnosisDate}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {d.listing.address}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. 권리금 적정성 평가 ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader icon={BarChart3} title="권리금 적정성 평가" />
        <div className="p-6">
          {/* Current Price */}
          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-500">현재 권리금</p>
              <p className="text-3xl font-black text-navy">{d.valuation.currentPremium.toLocaleString()}<span className="text-lg font-bold">만원</span></p>
            </div>
            <div className="rounded-xl bg-[#E8F0FE] px-5 py-3">
              <p className="text-xs text-gray-500">AI 추정 적정가</p>
              <p className="text-lg font-bold text-navy">{d.valuation.aiEstimateMin.toLocaleString()} ~ {d.valuation.aiEstimateMax.toLocaleString()}만원</p>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "지역 평균 권리금", value: `${d.valuation.regionAvg.toLocaleString()}만원` },
              { label: "업종별 평균 권리금", value: `${d.valuation.industryAvg.toLocaleString()}만원` },
              { label: "평당 권리금", value: `${d.valuation.perPyeong}만원` },
              { label: "지역 평당 평균", value: `${d.valuation.regionPerPyeong}만원` },
            ].map(c => (
              <div key={c.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-[11px] text-gray-500">{c.label}</p>
                <p className="mt-1 text-base font-bold text-navy">{c.value}</p>
              </div>
            ))}
          </div>

          {/* Fair Range Gauge */}
          <div className="mb-6">
            <p className="mb-2 text-sm font-medium text-gray-700">적정가 범위</p>
            <div className="relative h-8 rounded-full bg-gray-200">
              <div className="absolute top-0 h-full rounded-full bg-blue-200"
                style={{
                  left: `${(d.valuation.aiEstimateMin / (d.valuation.aiEstimateMax * 1.4)) * 100}%`,
                  width: `${((d.valuation.aiEstimateMax - d.valuation.aiEstimateMin) / (d.valuation.aiEstimateMax * 1.4)) * 100}%`,
                }} />
              <div className="absolute top-1/2 -translate-y-1/2"
                style={{ left: `${(d.valuation.currentPremium / (d.valuation.aiEstimateMax * 1.4)) * 100}%` }}>
                <div className="flex flex-col items-center">
                  <div className="h-8 w-1 rounded-full bg-navy" />
                </div>
              </div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>{d.valuation.aiEstimateMin.toLocaleString()}만원</span>
              <span className="font-bold text-navy">현재: {d.valuation.currentPremium.toLocaleString()}만원</span>
              <span>{d.valuation.aiEstimateMax.toLocaleString()}만원</span>
            </div>
          </div>

          {/* Charts Row: Composition Pie + Trend Line */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pie: Composition */}
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">권리금 구성 분석</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={d.valuation.composition} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                      {d.valuation.composition.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {d.valuation.composition.map((c, i) => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-gray-600">{c.name}</span>
                      <span className="ml-auto font-bold text-navy">{c.pct}%</span>
                      <span className="text-gray-400">{c.value.toLocaleString()}만</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Line: 6-Month Trend */}
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">최근 6개월 인근 권리금 추이</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={d.valuation.trend}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={["dataMin - 500", "dataMax + 500"]} tickFormatter={v => `${(v / 10000 * 10000).toLocaleString()}`} />
                  <Tooltip content={<ChartTooltip suffix="만원" />} />
                  <Area type="monotone" dataKey="value" stroke="#1B3A5C" strokeWidth={2} fill="url(#trendGrad)" dot={{ fill: "#1B3A5C", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. 핵심 지표 ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader icon={TrendingUp} title="핵심 지표" />
        <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-3">
          {d.metrics.map(m => (
            <div key={m.label} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </p>
              <p className="mt-2 text-lg font-bold text-navy">{m.value}</p>
              <p className="mt-0.5 text-[11px] text-gray-400">{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 4. 수익성 분석 ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader icon={DollarSign} title="수익성 분석" />
        <div className="p-6">
          {/* KPI Row */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: "월 예상 매출", value: `${d.profitability.monthlySales.toLocaleString()}만`, color: "text-navy" },
              { label: "월 예상 비용", value: `${d.profitability.monthlyCost.toLocaleString()}만`, color: "text-gray-600" },
              { label: "월 예상 순이익", value: `${d.profitability.monthlyProfit.toLocaleString()}만`, color: "text-blue-600" },
              { label: "연 예상 순이익", value: `${d.profitability.yearlyProfit.toLocaleString()}만`, color: "text-blue-700" },
              { label: "투자 수익률(ROI)", value: `${d.profitability.roi}%`, color: "text-navy" },
            ].map(k => (
              <div key={k.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="text-[11px] text-gray-500">{k.label}</p>
                <p className={`mt-1 text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div>
              <p className="mb-3 text-center text-sm font-medium text-gray-700">비용 구조</p>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={d.profitability.costs} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {d.profitability.costs.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {d.profitability.costs.map(c => {
                const pct = Math.round((c.value / d.profitability.monthlyCost) * 100);
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: c.color }} />
                    <span className="w-20 text-sm text-gray-600">{c.name}</span>
                    <div className="flex-1">
                      <div className="h-2.5 rounded-full bg-gray-100">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                    <span className="w-16 text-right text-sm font-bold text-navy">{c.value}만</span>
                    <span className="w-10 text-right text-xs text-gray-400">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. 상권 분석 (일부 블러) ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader icon={Users} title="상권 분석"
          badge={<span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">상권 {d.commerce.commerceGrade}등급 (핵심상권)</span>} />
        <div className="p-6">
          {/* Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "일 평균 유동인구", value: `${d.commerce.dailyFootTraffic.toLocaleString()}명`, sub: "높음" },
              { label: "주요 연령대", value: d.commerce.ageGroup, sub: "핵심 소비층" },
              { label: "성별 비율", value: `남 ${d.commerce.genderRatio.male}% / 여 ${d.commerce.genderRatio.female}%`, sub: "" },
              { label: "주변 경쟁업체", value: `${d.commerce.competitors}개`, sub: "반경 200m 카페" },
            ].map(c => (
              <div key={c.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-[11px] text-gray-500">{c.label}</p>
                <p className="mt-1 text-base font-bold text-navy">{c.value}</p>
                {c.sub && <p className="text-[10px] text-gray-400">{c.sub}</p>}
              </div>
            ))}
          </div>

          {/* Weekly Traffic Bar Chart (visible) */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-gray-700">요일별 유동인구</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.commerce.weeklyTraffic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip suffix="명" />} />
                <Bar dataKey="value" fill="#1B3A5C" radius={[4, 4, 0, 0]}
                  label={{ position: "top", fontSize: 10, fill: "#6B7280", formatter: (v: string | number | boolean | null | undefined) => typeof v === "number" ? `${(v / 1000).toFixed(1)}k` : "" }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Traffic (BLURRED) */}
          <BlurredSection label="시간대별 유동인구 — 권리진단서 발급 시 확인 가능">
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">시간대별 유동인구</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={d.commerce.hourlyTraffic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </BlurredSection>
        </div>
      </section>

      {/* ═══ 권리진단서 발급 배너 ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border-2 border-navy/20 bg-gradient-to-r from-navy to-[#2D5F8A] p-6 text-center md:p-8">
        <Lock className="mx-auto h-8 w-8 text-white/60" />
        <h3 className="mt-3 text-lg font-bold text-white">권리진단서를 발급받으면 더 자세한 분석을 확인할 수 있습니다</h3>
        <p className="mt-1 text-sm text-white/60">상권 시간대 분석, 경쟁업체 상세, 임대료 인상률 추이 등</p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/reports/request" className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-navy hover:bg-gray-100">
            권리진단서 발급받기
          </Link>
        </div>
      </section>

      {/* ═══ 6. 임대차 분석 ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader icon={Landmark} title="임대차 분석" />
        <div className="p-6">
          <div className="space-y-3">
            {d.lease.map(l => (
              <div key={l.item} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${l.safe ? "border-blue-100 bg-blue-50/30" : "border-amber-100 bg-amber-50/30"}`}>
                <div className="flex items-center gap-3">
                  {l.safe ? <CheckCircle className="h-5 w-5 shrink-0 text-blue-500" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />}
                  <span className="text-sm font-medium text-gray-800">{l.item}</span>
                </div>
                <span className={`text-sm ${l.safe ? "text-gray-600" : "font-medium text-amber-700"}`}>{l.value}</span>
              </div>
            ))}
          </div>

          {/* Blurred: Rent Increase Trend */}
          <div className="mt-6">
            <BlurredSection label="임대료 인상률 추이 — 권리진단서 발급 시 확인 가능">
              <div>
                <p className="mb-3 text-sm font-medium text-gray-700">최근 3년 임대료 인상률</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={[{ year: "2024", rate: 2.8 }, { year: "2025", rate: 3.5 }, { year: "2026", rate: 3.2 }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Bar dataKey="rate" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BlurredSection>
          </div>
        </div>
      </section>

      {/* ═══ 7. 위험요소 분석 ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader icon={Shield} title="위험요소 분석"
          badge={
            <span className={`rounded-lg border px-3 py-1 text-sm font-bold ${gc.bg} ${gc.text} ${gc.border}`}>
              {d.summary.grade}등급 ({d.summary.gradeLabel})
            </span>
          } />
        <div className="p-6">
          {/* Score Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">종합 안전 점수</span>
              <span className="font-bold text-navy">{d.summary.score}/100점</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-gradient-to-r from-[#1B3A5C] to-[#3B82F6]"
                style={{ width: `${d.summary.score}%` }} />
            </div>
          </div>

          {/* Risk Items */}
          <div className="space-y-3">
            {d.risks.map((risk, i) => {
              const isBlurred = risk.item === "주변 대형 프랜차이즈 진출";
              const content = (
                <div className={`rounded-lg border px-4 py-3 ${STATUS_STYLE[risk.status]}`}>
                  <div className="flex items-center gap-3">
                    {STATUS_ICON[risk.status]}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-800">{risk.item}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          risk.status === "안전" ? "bg-blue-100 text-blue-700"
                          : risk.status === "주의" ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                        }`}>{risk.status}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{risk.detail}</p>
                    </div>
                  </div>
                </div>
              );
              if (isBlurred) {
                return <BlurredSection key={i} label="경쟁업체 분석 — 권리진단서 발급 시 확인 가능">{content}</BlurredSection>;
              }
              return <div key={i}>{content}</div>;
            })}
          </div>
        </div>
      </section>

      {/* ═══ 8. 면책사항 ═══ */}
      <div className="mb-8 space-y-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-center text-xs text-blue-600">
          본 권리진단서는 권리샵에서 발급되었습니다 | SAMPLE DATA
        </div>
        <div className="rounded-lg bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
          <p className="font-medium">면책사항</p>
          <p className="mt-1">
            본 권리진단서는 권리샵이 제공하는 참고용 분석 자료이며, 법적 효력이 있는 공식 문서가 아닙니다.
            실제 거래 시 반드시 공인중개사, 법률 전문가와 상담하시기 바랍니다.
            분석 결과의 정확성을 보증하지 않으며, 이를 근거로 한 거래 손실에 대해 책임지지 않습니다.
          </p>
        </div>
      </div>

      {/* ═══ 9. 하단 CTA ═══ */}
      <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#E8F0FE] to-[#DBEAFE] p-6 text-center md:p-10">
          <h3 className="text-xl font-bold text-navy md:text-2xl">이 매물의 권리진단서를 발급받으세요</h3>
          <p className="mt-2 text-sm text-gray-500">지금 신청하면 <strong className="text-navy">10분 내 발급</strong> 완료</p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
            <Link href="/reports/request"
              className="flex min-h-[48px] w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-purple-600 px-8 text-sm font-bold text-white shadow-lg transition-all hover:bg-purple-700 active:scale-[0.97] md:w-auto">
              <Shield className="h-4 w-4" /> 권리진단서 신청하기 <span className="text-white/70 font-normal">30,000원</span>
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-400">VAT 별도 | 발급 후 PDF 다운로드 + 이메일 발송</p>
        </div>

        {/* Reviews */}
        <div className="border-t border-gray-200 px-6 pb-6 pt-2">
          <p className="mt-4 text-center text-sm font-bold text-navy">고객 후기</p>
          <ReviewCarousel />
        </div>
      </section>

    </div>
  );
}
