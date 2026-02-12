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
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import { SELLER_AD_PLANS, REPORT_PLANS } from "@/lib/utils/constants";

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
            프리미엄 광고로 매물 노출을 극대화하세요
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
                  {isVip ? "VIP 광고 신청하기" : "광고 신청하기"}
                </Link>
              </div>
            );
          })}
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

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {REPORT_PLANS.map((plan) => {
            const isPremium = plan.tier === "PREMIUM";

            return (
              <div
                key={plan.tier}
                className={
                  isPremium
                    ? "relative flex flex-col rounded-2xl border-2 border-blue-400 bg-white p-6 shadow-lg"
                    : "relative flex flex-col rounded-2xl border border-blue-200 bg-white p-6 shadow-sm"
                }
              >
                {/* Plan header */}
                <div className="flex items-center gap-2">
                  {isPremium ? (
                    <Shield className="h-5 w-5 text-blue-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-500" />
                  )}
                  <span
                    className={
                      isPremium
                        ? "rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700"
                        : "rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600"
                    }
                  >
                    {plan.label}
                  </span>
                </div>

                {/* Price */}
                <div className="mt-4">
                  <span
                    className={
                      isPremium
                        ? "text-3xl font-bold text-blue-700"
                        : "text-3xl font-bold text-blue-600"
                    }
                  >
                    ₩{formatNumber(plan.price)}
                  </span>
                  <span className="text-sm text-gray-500"> / 건</span>
                  <p className="mt-1 text-xs text-gray-400">
                    (부가세 별도 · VAT 포함 ₩{formatNumber(plan.priceWithVat)})
                  </p>
                </div>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/reports/request"
                  className={
                    isPremium
                      ? "mt-6 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.97]"
                      : "mt-6 block w-full rounded-lg border border-blue-500 px-4 py-3 text-center text-sm font-medium text-blue-600 transition-all hover:bg-blue-50 active:scale-[0.97]"
                  }
                >
                  {isPremium
                    ? "PREMIUM 권리진단서 신청하기"
                    : "권리진단서 신청하기"}
                </Link>

                {/* Sample preview link (BASIC only) */}
                {!isPremium && (
                  <Link
                    href="/reports/sample"
                    className="mt-3 block text-center text-xs text-blue-500 underline underline-offset-2 hover:text-blue-700"
                  >
                    샘플 미리보기
                  </Link>
                )}
              </div>
            );
          })}
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

      {/* ── Section 3: 매수자 무료 기능 ── */}
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
