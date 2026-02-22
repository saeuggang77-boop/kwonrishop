"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Crown,
  Star,
  Shield,
  FileText,
  Search,
  Calculator,
  BarChart3,
  Users,
  ArrowUp,
  Flame,
  RefreshCw,
  Zap,
  Megaphone,
  ChevronDown,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { SELLER_AD_PLANS, REPORT_PLAN } from "@/lib/utils/constants";
import { VIEWER_PLANS } from "@/lib/utils/subscription";

type Tab = "seller" | "buyer";

const BUYER_FREE_FEATURES = [
  { icon: Search, label: "매물 검색 & 조회" },
  { icon: BarChart3, label: "매물 비교 (무제한)" },
  { icon: Calculator, label: "시세 비교 위젯" },
  { icon: Star, label: "창업 시뮬레이터" },
  { icon: Shield, label: "안전도 등급 확인" },
  { icon: Users, label: "전문가 상담" },
];

export default function PricingPage() {
  const [tab, setTab] = useState<Tab>("seller");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      {/* Header + Tabs */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#1B3A5C] md:text-3xl">
          서비스 요금 안내
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          권리샵의 서비스 요금을 한눈에 확인하세요
        </p>

        {/* Tab switcher */}
        <div className="mx-auto mt-8 inline-flex rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setTab("seller")}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
              tab === "seller"
                ? "bg-white text-[#1B3A5C] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            매도자
          </button>
          <button
            onClick={() => setTab("buyer")}
            className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
              tab === "buyer"
                ? "bg-white text-[#1B3A5C] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            매수자
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* 매도자 탭 */}
      {/* ════════════════════════════════════════ */}
      {tab === "seller" && (
        <div className="mt-10 space-y-12">
          {/* ── 매물 광고 ── */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1B3A5C]">
              <Megaphone className="h-5 w-5 text-[#F59E0B]" />
              매물 광고
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              광고로 매물 노출을 극대화하세요
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {SELLER_AD_PLANS.map((plan) => {
                const isVip = plan.tier === "VIP";
                return (
                  <div
                    key={plan.tier}
                    className={
                      isVip
                        ? "relative flex flex-col rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-md"
                        : "relative flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    }
                  >
                    {isVip && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3.5 py-0.5 text-xs font-bold text-white">
                        추천
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {isVip ? (
                        <Crown className="h-5 w-5 text-amber-500" />
                      ) : (
                        <Star className="h-5 w-5 text-blue-600" />
                      )}
                      <span
                        className={
                          isVip
                            ? "rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700"
                            : "rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700"
                        }
                      >
                        {plan.label}
                      </span>
                    </div>

                    <div className="mt-4">
                      <span className={isVip ? "text-3xl font-bold text-amber-600" : "text-3xl font-bold text-blue-700"}>
                        ₩{formatNumber(plan.price)}
                      </span>
                      <span className="text-sm text-gray-500"> / {plan.days}일</span>
                      <p className="mt-1 text-xs text-gray-400">
                        (부가세 별도 · VAT 포함 ₩{formatNumber(plan.priceWithVat)})
                      </p>
                    </div>

                    <ul className="mt-5 flex-1 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className={isVip ? "mt-0.5 h-4 w-4 shrink-0 text-amber-500" : "mt-0.5 h-4 w-4 shrink-0 text-blue-600"} />
                          <span className="text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      disabled
                      className="mt-5 block w-full rounded-lg bg-gray-300 py-3 text-center text-sm font-medium text-gray-500 cursor-not-allowed"
                    >
                      오픈 예정
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 소액 부스트 ── */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1B3A5C]">
              <Zap className="h-5 w-5 text-purple-500" />
              소액 부스트 서비스
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              소액으로 빠르게 매물 노출을 높여보세요
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {/* 점프업 */}
              <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <ArrowUp className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="mt-3 text-base font-bold text-[#1B3A5C]">점프업</h3>
                <div className="mt-1.5">
                  <span className="text-2xl font-bold text-blue-600">₩10,000</span>
                  <span className="text-sm text-gray-500"> / 회</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-gray-700">24시간 점포찾기 일반매물 상단 고정</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-gray-700">여러 개면 로테이션 공평 노출</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-gray-700">24시간 후 자동 해제</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-gray-700">하루 최대 3회 구매 가능</span>
                  </li>
                </ul>
                <button disabled className="mt-5 block w-full rounded-lg bg-gray-300 py-2.5 text-center text-sm font-medium text-gray-500 cursor-not-allowed">
                  오픈 예정
                </button>
              </div>

              {/* 급매 태그 */}
              <div className="relative flex flex-col rounded-2xl border-2 border-red-300 bg-white p-5 shadow-md">
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-3 py-0.5 text-[10px] font-bold text-white">
                  인기
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <Flame className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="mt-3 text-base font-bold text-[#1B3A5C]">급매 태그</h3>
                <div className="mt-1.5">
                  <span className="text-2xl font-bold text-red-600">₩100,000</span>
                  <span className="text-sm text-gray-500"> / 30일</span>
                </div>
                <ul className="mt-4 flex-1 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span className="text-gray-700">빨간 &lsquo;급매&rsquo; 태그 표시</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span className="text-gray-700">급매 필터 노출</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span className="text-gray-700">노출 순서에는 영향 없음</span>
                  </li>
                </ul>
                <button disabled className="mt-5 block w-full rounded-lg bg-gray-300 py-2.5 text-center text-sm font-medium text-gray-500 cursor-not-allowed">
                  오픈 예정
                </button>
              </div>

              {/* 자동 갱신 */}
              <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="mt-3 text-base font-bold text-[#1B3A5C]">자동 갱신</h3>
                <div className="mt-1.5">
                  <span className="text-2xl font-bold text-green-600">₩150,000</span>
                  <span className="text-sm text-gray-500"> / 30일</span>
                </div>
                <p className="mt-0.5 text-xs font-medium text-green-600">개별 점프업 대비 50% 할인!</p>
                <ul className="mt-4 flex-1 space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-gray-700">매일 자동 점프업 (30회)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-gray-700">매일 24시간 3열 상단 로테이션</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span className="text-gray-700">별도 클릭 없이 자동 실행</span>
                  </li>
                </ul>
                <button disabled className="mt-5 block w-full rounded-lg bg-gray-300 py-2.5 text-center text-sm font-medium text-gray-500 cursor-not-allowed">
                  오픈 예정
                </button>
              </div>
            </div>
          </section>

          {/* ── 노출 구조 안내 ── */}
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1B3A5C]">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              점포찾기 노출 구조
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              점포찾기 페이지에서 매물이 어떤 순서로 표시되는지 안내합니다
            </p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">1</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">프리미엄 매물</p>
                  <p className="text-xs text-amber-600">VIP 광고 매물 2개 — 골드 테두리 + 로테이션 노출</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">2</span>
                <div>
                  <p className="text-sm font-semibold text-blue-800">오늘의 추천매물</p>
                  <p className="text-xs text-blue-600">추천 광고 매물 2개 — 그린 테두리 + 로테이션 노출</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">3</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-800">점프업 매물</p>
                  <p className="text-xs text-indigo-600">점프업 구매 매물 2개 — 24시간 상단 고정 + 로테이션 노출</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-500 text-xs font-bold text-white">4</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">일반 매물</p>
                  <p className="text-xs text-gray-500">전체 매물 무한스크롤 — 공평 로테이션 순서</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              * 필터 사용 시 1~3열은 숨겨지고, 필터 결과만 표시됩니다.
            </p>
          </section>

          {/* ── 매도자 무료 등록 배너 ── */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Megaphone className="h-5 w-5 text-[#F59E0B]" />
              <span className="text-sm font-bold text-[#1B3A5C] md:text-base">
                매도자 매물 등록은 월 2건까지 무료!
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              추가 등록이나 광고 노출이 필요하시면 위의 광고 플랜을 이용해주세요.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* 매수자 탭 */}
      {/* ════════════════════════════════════════ */}
      {tab === "buyer" && (
        <BuyerTab />
      )}
    </div>
  );
}

/* ════════════════════════════════════════ */
/* BuyerTab — 수정 2·3·5·6 통합           */
/* ════════════════════════════════════════ */

const COMPARISON_ROWS: { label: string; free: boolean; paid: boolean }[] = [
  { label: "사진, 제목, 위치, 업종", free: true, paid: true },
  { label: "가격정보 (보증금/월세/권리금/관리비)", free: true, paid: true },
  { label: "매물정보 (면적/층수/영업기간)", free: true, paid: true },
  { label: "월매출/월순이익 숫자", free: true, paid: true },
  { label: "투자회수 기간 숫자", free: true, paid: true },
  { label: "주변시세 비교", free: true, paid: true },
  { label: "위치정보, 전문가 문의, 댓글", free: true, paid: true },
  { label: "상세 비용 구조 (재료비/인건비/월세 등)", free: false, paid: true },
  { label: "매출 구성 도넛 차트", free: false, paid: true },
  { label: "투자 수익률 상세 분석", free: false, paid: true },
  { label: "매출 증빙자료 원본 (B등급)", free: false, paid: true },
  { label: "홈택스 인증 월별 매출 데이터", free: false, paid: true },
];

const REPORT_FEATURES_VISIBLE = REPORT_PLAN.features.slice(0, 3);
const REPORT_FEATURES_HIDDEN = REPORT_PLAN.features.slice(3);

const FAQ_ITEMS = [
  { q: "건별 열람과 월 구독의 차이점은?", a: "건별 열람은 선택한 매물 1개의 수익 데이터를 7일간 볼 수 있습니다. 월 구독은 모든 매물의 수익 데이터를 무제한으로 열람할 수 있어, 여러 매물을 비교하실 때 유리합니다." },
  { q: "구독은 언제든 해지할 수 있나요?", a: "네, 언제든 해지 가능하며 남은 기간까지는 정상 이용 가능합니다. 위약금은 없습니다." },
  { q: "무료로 볼 수 있는 정보는?", a: "매물 사진, 가격정보(보증금/월세/권리금), 기본 매물정보, 월매출/월순이익 숫자, 투자회수 기간, 주변시세 비교, 위치정보 등은 모두 무료입니다." },
  { q: "환불은 가능한가요?", a: "결제 후 7일 이내, 서비스 미이용 시 전액 환불이 가능합니다. 이용가이드의 환불 정책을 확인해주세요." },
  { q: "매도자 매물 등록도 무료인가요?", a: "네, 매도자는 월 2건까지 무료로 매물을 등록할 수 있습니다. 더 많은 노출이 필요하시면 광고 상품을 이용해주세요." },
  { q: "권리진단서 발급까지 얼마나 걸리나요?", a: "AI 분석 기반으로 신청 후 즉시 결과를 확인할 수 있습니다. PDF 리포트도 바로 다운로드 가능합니다." },
];

function BuyerTab() {
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

  return (
    <div className="mt-10 space-y-12">
      {/* ── 1. 무료 기능 (최상단으로 이동) ── */}
      <section>
        <h2 className="text-lg font-bold text-[#1B3A5C]">
          이 모든 기능이 무료!
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {BUYER_FREE_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B3A5C]/10">
                  <Icon className="h-5 w-5 text-[#1B3A5C]" />
                </div>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. 수익분석 열람 (소제목 + 비교 테이블) ── */}
      <section>
        <h3 className="text-center text-base font-bold text-gray-700">더 깊은 분석이 필요하다면?</h3>

        <h2 className="mt-6 flex items-center gap-2 text-lg font-bold text-[#1B3A5C]">
          <BarChart3 className="h-5 w-5 text-teal-500" />
          매물 수익분석 열람
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          상세 비용 구조, 매출 차트, ROI 분석을 열람할 수 있습니다
        </p>

        {/* 비교 테이블 (수정 3) */}
        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-[1fr_80px_80px] border-b border-gray-200 bg-gray-50 md:grid-cols-[1fr_120px_120px]">
            <div className="px-4 py-3 text-xs font-bold text-gray-600">정보 항목</div>
            <div className="px-2 py-3 text-center text-xs font-bold text-gray-600">무료</div>
            <div className="px-2 py-3 text-center">
              <span className="text-xs font-bold text-teal-700">유료 열람</span>
              <span className="ml-1 rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-600">월 ₩9,900~</span>
            </div>
          </div>
          {/* 테이블 본문 */}
          {COMPARISON_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_80px_80px] items-center md:grid-cols-[1fr_120px_120px] ${i < COMPARISON_ROWS.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="px-4 py-2.5 text-xs text-gray-700 md:text-sm">{row.label}</div>
              <div className="px-2 py-2.5 text-center">
                {row.free
                  ? <span className="text-green-500">✅</span>
                  : <span className="text-gray-300">—</span>}
              </div>
              <div className="px-2 py-2.5 text-center">
                <span className="text-green-500">✅</span>
              </div>
            </div>
          ))}
        </div>

        {/* Plan cards */}
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {/* 건별 */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <span className="w-fit rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
              {VIEWER_PLANS.SINGLE.name}
            </span>
            <div className="mt-3">
              <span className="text-2xl font-bold text-gray-800">₩{VIEWER_PLANS.SINGLE.price.toLocaleString()}</span>
              <span className="text-sm text-gray-500"> / 건</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{VIEWER_PLANS.SINGLE.description}</p>
            <ul className="mt-4 flex-1 space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span className="text-gray-700">매물 1개 수익 데이터 열람</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span className="text-gray-700">구매 후 7일간 무제한 열람</span>
              </li>
            </ul>
            <Link href="/listings" className="mt-5 block w-full rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.97]">
              매물에서 구매하기
            </Link>
          </div>

          {/* 월 구독 */}
          <div className="relative flex flex-col rounded-2xl border-2 border-teal-400 bg-white p-5 shadow-md">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-0.5 text-[10px] font-bold text-white">
              {VIEWER_PLANS.MONTHLY.badge}
            </span>
            <span className="w-fit rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              {VIEWER_PLANS.MONTHLY.name}
            </span>
            <div className="mt-3">
              <span className="text-2xl font-bold text-teal-700">₩{VIEWER_PLANS.MONTHLY.price.toLocaleString()}</span>
              <span className="text-sm text-gray-500"> / 월</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{VIEWER_PLANS.MONTHLY.description}</p>
            <ul className="mt-4 flex-1 space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span className="text-gray-700">모든 매물 수익 데이터</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span className="text-gray-700">비용 구조 + 도넛 차트</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span className="text-gray-700">ROI 상세 분석</span>
              </li>
            </ul>
            <Link href="/premium" className="mt-5 block w-full rounded-lg bg-teal-600 py-2.5 text-center text-sm font-medium text-white hover:bg-teal-700 active:scale-[0.97]">
              월 구독 시작하기
            </Link>
          </div>

          {/* 연 구독 */}
          <div className="flex flex-col rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
            <span className="w-fit rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              {VIEWER_PLANS.YEARLY.name}
            </span>
            <div className="mt-3">
              <span className="text-2xl font-bold text-teal-700">₩{VIEWER_PLANS.YEARLY.price.toLocaleString()}</span>
              <span className="text-sm text-gray-500"> / 년</span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-teal-600">
              월 {VIEWER_PLANS.YEARLY.monthlyEquivalent?.toLocaleString()}원 — {VIEWER_PLANS.YEARLY.discountPct}% 할인
            </p>
            <p className="mt-1 text-sm text-gray-500">{VIEWER_PLANS.YEARLY.description}</p>
            <ul className="mt-4 flex-1 space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span className="text-gray-700">월 구독의 모든 기능</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span className="text-gray-700">연 결제 시 33% 할인</span>
              </li>
            </ul>
            <Link href="/premium" className="mt-5 block w-full rounded-lg border border-teal-600 py-2.5 text-center text-sm font-medium text-teal-700 hover:bg-teal-50 active:scale-[0.97]">
              연 구독 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. 권리진단서 (간소화 — 수정 2) ── */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#1B3A5C]">
          <FileText className="h-5 w-5 text-purple-500" />
          권리진단서
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          거래 전 필수! 전문 분석으로 안전한 점포 거래
        </p>

        <div className="mt-6 mx-auto max-w-lg">
          <div className="flex flex-col rounded-2xl border-2 border-purple-300 bg-white p-6 shadow-md">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                {REPORT_PLAN.label}
              </span>
            </div>

            <div className="mt-4">
              <span className="text-3xl font-bold text-purple-700">
                ₩{formatNumber(REPORT_PLAN.price)}
              </span>
              <span className="text-sm text-gray-500"> / 건</span>
              <p className="mt-1 text-xs text-gray-400">
                (부가세 별도 · VAT 포함 ₩{formatNumber(REPORT_PLAN.priceWithVat)})
              </p>
            </div>

            {/* 기본 3개 항목 */}
            <ul className="mt-5 space-y-2.5">
              {REPORT_FEATURES_VISIBLE.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>

            {/* 더보기 토글 */}
            {showMoreFeatures && (
              <ul className="mt-2 space-y-2.5">
                {REPORT_FEATURES_HIDDEN.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setShowMoreFeatures((v) => !v)}
              className="mt-3 flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700"
            >
              {showMoreFeatures ? (
                <>접기 <ChevronDown className="h-3 w-3 rotate-180 transition-transform" /></>
              ) : (
                <>+{REPORT_FEATURES_HIDDEN.length}개 항목 더보기 <ChevronDown className="h-3 w-3 transition-transform" /></>
              )}
            </button>

            <Link
              href="/reports/request"
              className="mt-5 block w-full rounded-lg bg-purple-600 py-3 text-center text-sm font-medium text-white hover:bg-purple-700 active:scale-[0.97]"
            >
              권리진단서 신청하기
            </Link>
            <Link
              href="/reports/sample"
              className="mt-2 block text-center text-xs text-purple-500 underline underline-offset-2 hover:text-purple-700"
            >
              샘플 미리보기
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. FAQ (수정 6 — 3개 추가) ── */}
      <section>
        <h2 className="text-lg font-bold text-[#1B3A5C]">자주 묻는 질문</h2>
        <div className="mt-4 space-y-3">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-800">{item.q}</p>
              <p className="mt-1.5 text-sm text-gray-600">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
