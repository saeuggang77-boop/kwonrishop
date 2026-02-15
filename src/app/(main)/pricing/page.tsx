"use client";

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
  Megaphone,
  ArrowUp,
  Flame,
  RefreshCw,
  Zap,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { SELLER_AD_PLANS, REPORT_PLAN } from "@/lib/utils/constants";
import { VIEWER_PLANS, FREE_FEATURES, PAID_FEATURES, GRADE_A_FEATURES } from "@/lib/utils/subscription";

const BUYER_FREE_FEATURES = [
  { icon: Search, label: "매물 검색 & 조회" },
  { icon: BarChart3, label: "매물 비교 (무제한)" },
  { icon: Calculator, label: "시세 비교 위젯" },
  { icon: Star, label: "창업 시뮬레이터" },
  { icon: Shield, label: "안전도 등급 확인" },
  { icon: Users, label: "전문가 상담" },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#1B3A5C] md:text-4xl">
          서비스 요금 안내
        </h1>
        <p className="mt-3 text-gray-500">
          권리샵의 서비스 요금을 확인하세요
        </p>
      </div>

      {/* ── Section 1: 매도자 광고 ── */}
      <section className="mt-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <Megaphone className="h-4 w-4" />
            매도자 광고
          </div>
          <h2 className="mt-4 text-2xl font-bold text-[#1B3A5C]">
            매물을 빨리 팔고 싶으신가요?
          </h2>
          <p className="mt-2 text-gray-500">
            광고로 매물 노출을 극대화하세요
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {SELLER_AD_PLANS.map((plan) => {
            const isVip = plan.tier === "VIP";

            return (
              <div
                key={plan.tier}
                className={
                  isVip
                    ? "relative flex flex-col rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-lg"
                    : "relative flex flex-col rounded-2xl border border-blue-200 bg-white p-6 shadow-sm"
                }
              >
                {/* VIP 추천 badge */}
                {isVip && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1 text-xs font-bold text-white">
                    추천
                  </span>
                )}

                {/* Plan header */}
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

                {/* Price */}
                <div className="mt-4">
                  <span
                    className={
                      isVip
                        ? "text-3xl font-bold text-amber-600"
                        : "text-3xl font-bold text-blue-700"
                    }
                  >
                    ₩{formatNumber(plan.price)}
                  </span>
                  <span className="text-sm text-gray-500"> / {plan.days}일</span>
                  <p className="mt-1 text-xs text-gray-400">
                    (부가세 별도 · VAT 포함 ₩{formatNumber(plan.priceWithVat)})
                  </p>
                </div>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check
                        className={
                          isVip
                            ? "mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                            : "mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                        }
                      />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/premium/listing-ad"
                  className={
                    isVip
                      ? "mt-6 block w-full rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-amber-600 active:scale-[0.97]"
                      : "mt-6 block w-full rounded-lg border border-blue-600 px-4 py-3 text-center text-sm font-medium text-blue-700 transition-all hover:bg-blue-50 active:scale-[0.97]"
                  }
                >
                  {isVip ? "프리미엄 매물 광고 신청하기" : "오늘의 추천 매물 광고 신청하기"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 1.5: 소액 부스트 서비스 ── */}
      <section className="mt-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700 border border-purple-200">
            <Zap className="h-4 w-4" />
            소액 부스트 서비스
          </div>
          <h2 className="mt-4 text-2xl font-bold text-[#1B3A5C]">
            매물 광고 없이도 매물 노출을 높일 수 있어요
          </h2>
          <p className="mt-2 text-gray-500">
            소액으로 빠르게 매물 노출을 높여보세요
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Jump Up */}
          <div className="flex flex-col rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <ArrowUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#1B3A5C]">점프업</h3>
            <div className="mt-2">
              <span className="text-2xl font-bold text-blue-600">₩5,000</span>
              <span className="text-sm text-gray-500"> / 회</span>
            </div>
            <ul className="mt-4 flex-1 space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <span className="text-gray-700">24시간 검색 상단 노출</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <span className="text-gray-700">하루 최대 3회 구매 가능</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <span className="text-gray-700">해당 지역 검색에서 우선 표시</span>
              </li>
            </ul>
            <Link
              href="/my/ads"
              className="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.97]"
            >
              구매하기
            </Link>
          </div>

          {/* Urgent Tag */}
          <div className="relative flex flex-col rounded-2xl border-2 border-red-300 bg-white p-6 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-4 py-1 text-xs font-bold text-white">
              인기
            </span>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
              <Flame className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#1B3A5C]">급매 태그</h3>
            {/* Duration tabs */}
            <div className="mt-3 flex gap-1.5 rounded-lg bg-gray-100 p-1">
              <div className="flex-1 rounded-md bg-white px-3 py-2 text-center shadow-sm">
                <p className="text-sm font-bold text-red-600">7일</p>
                <p className="text-lg font-bold text-gray-900">₩9,900</p>
              </div>
              <div className="flex-1 relative rounded-md px-3 py-2 text-center hover:bg-gray-50 transition-colors">
                <span className="absolute -top-2 right-0 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  27% 할인
                </span>
                <p className="text-sm font-bold text-red-600">30일</p>
                <p className="text-lg font-bold text-gray-900">₩29,000</p>
              </div>
            </div>
            <ul className="mt-4 flex-1 space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span className="text-gray-700">빨간 &lsquo;급매&rsquo; 태그 매물에 표시</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span className="text-gray-700">&lsquo;급매 매물만 보기&rsquo; 필터 노출</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span className="text-gray-700">급매 사유 표시 (선택)</span>
              </li>
            </ul>
            <Link
              href="/my/ads"
              className="mt-6 block w-full rounded-lg bg-red-600 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-red-700 active:scale-[0.97]"
            >
              구매하기
            </Link>
          </div>

          {/* Auto Refresh */}
          <div className="flex flex-col rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <RefreshCw className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#1B3A5C]">자동 갱신</h3>
            <div className="mt-2">
              <span className="text-2xl font-bold text-green-600">₩79,000</span>
              <span className="text-sm text-gray-500"> / 30일</span>
            </div>
            <p className="mt-1 text-xs text-green-600 font-medium">개별 점프업 대비 47% 할인!</p>
            <ul className="mt-4 flex-1 space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-gray-700">매일 자동 점프업 (30회)</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-gray-700">30일간 매일 상단 노출</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-gray-700">별도 클릭 없이 자동 실행</span>
              </li>
            </ul>
            <Link
              href="/my/ads"
              className="mt-6 block w-full rounded-lg bg-green-600 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-green-700 active:scale-[0.97]"
            >
              구매하기
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 2: 권리진단서 ── */}
      <section className="mt-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <FileText className="h-4 w-4" />
            권리진단서
          </div>
          <h2 className="mt-4 text-2xl font-bold text-[#1B3A5C]">
            거래 전 필수! 권리진단서로 안전한 거래
          </h2>
          <p className="mt-2 text-gray-500">
            전문 분석으로 안전한 점포 거래를 도와드립니다
          </p>
        </div>

        <div className="mt-10 mx-auto max-w-lg">
          <div className="flex flex-col rounded-2xl border-2 border-purple-300 bg-white p-6 shadow-lg">
            {/* Plan header */}
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                {REPORT_PLAN.label}
              </span>
            </div>

            {/* Price */}
            <div className="mt-4">
              <span className="text-3xl font-bold text-purple-700">
                ₩{formatNumber(REPORT_PLAN.price)}
              </span>
              <span className="text-sm text-gray-500"> / 건</span>
              <p className="mt-1 text-xs text-gray-400">
                (부가세 별도 · VAT 포함 ₩{formatNumber(REPORT_PLAN.priceWithVat)})
              </p>
            </div>

            {/* Features */}
            <ul className="mt-6 flex-1 space-y-3">
              {REPORT_PLAN.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/reports/request"
              className="mt-6 block w-full rounded-lg bg-purple-600 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-purple-700 active:scale-[0.97]"
            >
              권리진단서 신청하기
            </Link>

            {/* Sample preview link */}
            <Link
              href="/reports/sample"
              className="mt-3 block text-center text-xs text-purple-500 underline underline-offset-2 hover:text-purple-700"
            >
              샘플 미리보기
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 2.5: 매도자 권리진단 배지 안내 ── */}
      <section className="mt-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 border border-emerald-300">
            <Shield className="h-4 w-4" />
            권리진단 완료 배지
          </div>
          <h2 className="mt-4 text-2xl font-bold text-[#1B3A5C]">
            내 매물에 권리진단 완료 배지를 달아보세요
          </h2>
          <p className="mt-2 text-gray-500">
            권리진단 완료 매물은 문의율이 평균 2배 높습니다
          </p>
        </div>

        <div className="mt-10 mx-auto max-w-2xl">
          {/* Badge Sample */}
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
              <Shield className="h-4 w-4" />
              권리진단 완료
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-gray-700">매물 목록에서 &lsquo;권리진단 완료&rsquo; 배지 표시</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-gray-700">상세 페이지에서 권리진단 인증 마크 노출</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-gray-700">매수자 신뢰도 및 문의율 상승</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span className="text-gray-700">검색 필터 &lsquo;권리진단 완료&rsquo;에 매물 노출</span>
              </li>
            </ul>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Link
                href="/listings"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-700 active:scale-[0.97]"
              >
                <Shield className="h-4 w-4" />
                내 매물 권리진단서 발급받기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: 매물 수익분석 열람 ── */}
      <section id="viewer" className="mt-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700 border border-teal-200">
            <BarChart3 className="h-4 w-4" />
            수익분석 열람
          </div>
          <h2 className="mt-4 text-2xl font-bold text-[#1B3A5C]">
            매물 수익 데이터를 확인하세요
          </h2>
          <p className="mt-2 text-gray-500">
            상세 비용 구조, 매출 차트, ROI 분석을 열람할 수 있습니다
          </p>
        </div>

        {/* Free vs Paid comparison */}
        <div className="mt-8 mx-auto max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-bold text-gray-700">무료 공개 항목</h3>
              <ul className="mt-3 space-y-2">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-teal-300 bg-teal-50/50 p-5">
              <h3 className="text-sm font-bold text-teal-700">유료 열람 항목</h3>
              <ul className="mt-3 space-y-2">
                {[...PAID_FEATURES, ...GRADE_A_FEATURES].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {/* Single */}
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <span className="w-fit rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
              {VIEWER_PLANS.SINGLE.name}
            </span>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-800">
                ₩{VIEWER_PLANS.SINGLE.price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500"> / 건</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">{VIEWER_PLANS.SINGLE.description}</p>
            <ul className="mt-6 flex-1 space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span className="text-gray-700">매물 1개 수익 데이터 열람</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <span className="text-gray-700">구매 후 7일간 무제한 열람</span>
              </li>
            </ul>
            <Link
              href="/listings"
              className="mt-6 block w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.97]"
            >
              매물에서 구매하기
            </Link>
          </div>

          {/* Monthly (recommended) */}
          <div className="relative flex flex-col rounded-2xl border-2 border-teal-400 bg-white p-6 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-4 py-1 text-xs font-bold text-white">
              {VIEWER_PLANS.MONTHLY.badge}
            </span>
            <span className="w-fit rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              {VIEWER_PLANS.MONTHLY.name}
            </span>
            <div className="mt-4">
              <span className="text-3xl font-bold text-teal-700">
                ₩{VIEWER_PLANS.MONTHLY.price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500"> / 월</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">{VIEWER_PLANS.MONTHLY.description}</p>
            <ul className="mt-6 flex-1 space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span className="text-gray-700">모든 매물 수익 데이터 열람</span>
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
            <Link
              href="/api/payments/subscribe?planId=MONTHLY"
              className="mt-6 block w-full rounded-lg bg-teal-600 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-teal-700 active:scale-[0.97]"
            >
              월 구독 시작하기
            </Link>
          </div>

          {/* Yearly */}
          <div className="flex flex-col rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
            <span className="w-fit rounded-md bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              {VIEWER_PLANS.YEARLY.name}
            </span>
            <div className="mt-4">
              <span className="text-3xl font-bold text-teal-700">
                ₩{VIEWER_PLANS.YEARLY.price.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500"> / 년</span>
            </div>
            <p className="mt-1 text-xs font-medium text-teal-600">
              월 {VIEWER_PLANS.YEARLY.monthlyEquivalent?.toLocaleString()}원 — {VIEWER_PLANS.YEARLY.discountPct}% 할인
            </p>
            <p className="mt-2 text-sm text-gray-500">{VIEWER_PLANS.YEARLY.description}</p>
            <ul className="mt-6 flex-1 space-y-3">
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span className="text-gray-700">월 구독의 모든 기능</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                <span className="text-gray-700">연 결제 시 33% 할인</span>
              </li>
            </ul>
            <Link
              href="/api/payments/subscribe?planId=YEARLY"
              className="mt-6 block w-full rounded-lg border border-teal-600 px-4 py-3 text-center text-sm font-medium text-teal-700 transition-all hover:bg-teal-50 active:scale-[0.97]"
            >
              연 구독 시작하기
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 mx-auto max-w-2xl">
          <h3 className="text-lg font-bold text-[#1B3A5C]">자주 묻는 질문</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm font-semibold text-gray-800">건별 열람과 월 구독의 차이점은?</p>
              <p className="mt-2 text-sm text-gray-600">
                건별 열람은 선택한 매물 1개의 수익 데이터를 7일간 볼 수 있습니다.
                월 구독은 모든 매물의 수익 데이터를 무제한으로 열람할 수 있어, 여러 매물을 비교하실 때 유리합니다.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm font-semibold text-gray-800">구독은 언제든 해지할 수 있나요?</p>
              <p className="mt-2 text-sm text-gray-600">
                네, 언제든 해지 가능하며 남은 기간까지는 정상 이용 가능합니다. 위약금은 없습니다.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm font-semibold text-gray-800">무료로 볼 수 있는 정보는?</p>
              <p className="mt-2 text-sm text-gray-600">
                매물 사진, 가격정보(보증금/월세/권리금), 기본 매물정보, 월매출/월수익 숫자, 투자회수 기간,
                주변시세 비교, 위치정보 등은 모두 무료입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: 매수자 무료 기능 ── */}
      <section className="mt-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1B3A5C]">
            매수자는 이 모든 기능이 무료!
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {BUYER_FREE_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B3A5C]/10">
                  <Icon className="h-6 w-6 text-[#1B3A5C]" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 4: 매도자 무료 등록 ── */}
      <section className="mt-16 mb-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <Megaphone className="h-5 w-5 text-[#F59E0B]" />
            <span className="text-base font-bold text-[#1B3A5C]">
              매도자 매물 등록은 월 2건까지 무료!
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            추가 등록이나 광고 노출이 필요하시면 위의 광고 플랜을 이용해주세요.
          </p>
        </div>
      </section>
    </div>
  );
}
