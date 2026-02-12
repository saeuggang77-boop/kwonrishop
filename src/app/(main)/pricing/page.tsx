"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, X, Crown, Star, Sparkles, ChevronDown, CreditCard, Building } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  SUBSCRIPTION_TIER_LABELS,
  SUBSCRIPTION_PRICES,
  SUBSCRIPTION_YEARLY_PRICES,
  SUBSCRIPTION_PLAN_FEATURES,
} from "@/lib/utils/constants";

type Tier = "FREE" | "PRO" | "EXPERT";

interface SessionUser {
  id: string;
  name?: string | null;
  subscriptionTier: string;
}

const TIER_ORDER: Tier[] = ["FREE", "PRO", "EXPERT"];

const FAQ_ITEMS = [
  {
    question: "구독을 언제든 취소할 수 있나요?",
    answer: "네, 언제든 취소 가능합니다. 이미 결제된 기간은 끝까지 이용 가능합니다.",
  },
  {
    question: "연간 결제로 변경하면 어떻게 되나요?",
    answer: "남은 월간 결제 기간이 끝난 후 연간 플랜이 시작됩니다.",
  },
  {
    question: "플랜 변경은 즉시 적용되나요?",
    answer: "업그레이드는 즉시, 다운그레이드는 현 결제 기간 종료 후 적용됩니다.",
  },
  {
    question: "결제 수단은 어떤 것을 지원하나요?",
    answer: "신용/체크카드 및 계좌이체를 지원합니다. 추후 더 많은 결제 수단이 추가될 예정입니다.",
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Tier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const user = session?.user as SessionUser | undefined;
  const currentTier = (user?.subscriptionTier ?? "FREE") as Tier;

  const isYearly = billingPeriod === "yearly";

  function getMonthlyPrice(tier: Tier): number {
    if (isYearly) {
      return Math.round(SUBSCRIPTION_YEARLY_PRICES[tier] / 12);
    }
    return SUBSCRIPTION_PRICES[tier];
  }

  function getButtonLabel(tier: Tier): string {
    if (!user) {
      if (tier === "FREE") return "무료로 시작";
      return `${SUBSCRIPTION_TIER_LABELS[tier]} 시작하기`;
    }

    const currentIndex = TIER_ORDER.indexOf(currentTier);
    const targetIndex = TIER_ORDER.indexOf(tier);

    if (currentIndex === targetIndex) return "현재 이용중";
    if (targetIndex < currentIndex) return "다운그레이드";
    if (tier === "FREE") return "무료로 시작";
    return `${tier} 시작하기`;
  }

  function isCurrentPlan(tier: Tier): boolean {
    return user !== undefined && currentTier === tier;
  }

  function handlePlanSelect(tier: Tier) {
    if (isCurrentPlan(tier)) return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (tier === "FREE") {
      router.push("/my/subscription");
      return;
    }

    setSelectedPlan(tier);
    setAgreedToTerms(false);

    // Scroll to checkout section
    setTimeout(() => {
      document.getElementById("checkout-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleCheckout() {
    if (!agreedToTerms) {
      toast("error", "이용약관 및 자동 결제 동의가 필요합니다.");
      return;
    }
    toast("info", "결제 시스템 준비중입니다. 곧 서비스될 예정입니다.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy md:text-4xl">요금제 안내</h1>
        <p className="mt-3 text-gray-500">필요에 맞는 플랜을 선택하세요</p>
      </div>

      {/* Billing Toggle */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            !isYearly ? "text-navy" : "text-gray-400"
          )}
        >
          월간
        </span>
        <button
          onClick={() => setBillingPeriod(isYearly ? "monthly" : "yearly")}
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
            isYearly ? "bg-mint" : "bg-gray-300"
          )}
          aria-label={isYearly ? "월간 결제로 변경" : "연간 결제로 변경"}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
              isYearly ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            isYearly ? "text-navy" : "text-gray-400"
          )}
        >
          연간
        </span>
        {isYearly && (
          <span className="rounded-full bg-mint/10 px-2.5 py-0.5 text-xs font-bold text-mint">
            20% 할인
          </span>
        )}
      </div>

      {/* Plan Cards */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {/* FREE Card */}
        <div
          className={cn(
            "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
            isCurrentPlan("FREE") ? "border-gray-300 ring-2 ring-gray-300" : "border-gray-200"
          )}
        >
          {isCurrentPlan("FREE") && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-600 px-3 py-1 text-xs font-bold text-white">
              현재 이용중
            </span>
          )}
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-gray-400" />
            <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">
              FREE
            </span>
          </div>

          <div className="mt-4">
            <span className="text-3xl font-bold text-navy">무료</span>
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {SUBSCRIPTION_PLAN_FEATURES.FREE.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2 text-sm">
                {feature.included ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                )}
                <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handlePlanSelect("FREE")}
            disabled={isCurrentPlan("FREE")}
            className={cn(
              "mt-6 w-full rounded-lg border px-4 py-3 text-sm font-medium transition-all",
              isCurrentPlan("FREE")
                ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                : "border-mint text-mint hover:bg-mint/5 active:scale-[0.97]"
            )}
          >
            {getButtonLabel("FREE")}
          </button>
        </div>

        {/* PRO Card (Popular) */}
        <div
          className={cn(
            "relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl md:-mt-2 md:mb-[-8px]",
            isCurrentPlan("PRO") ? "border-mint ring-2 ring-mint" : "border-mint"
          )}
        >
          <span className="absolute -top-3 right-4 rounded-full bg-mint px-3 py-1 text-xs font-bold text-white">
            인기
          </span>
          {isCurrentPlan("PRO") && (
            <span className="absolute -top-3 left-4 rounded-full bg-mint px-3 py-1 text-xs font-bold text-white">
              현재 이용중
            </span>
          )}

          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-mint" />
            <span className="rounded-md bg-mint/10 px-2.5 py-0.5 text-xs font-bold text-mint">
              PRO
            </span>
          </div>

          <div className="mt-4">
            {isYearly ? (
              <div>
                <span className="text-3xl font-bold text-navy">
                  {formatNumber(getMonthlyPrice("PRO"))}원
                </span>
                <span className="text-sm text-gray-500">/월</span>
                <div className="mt-1">
                  <span className="text-sm text-gray-400 line-through">
                    {formatNumber(SUBSCRIPTION_PRICES.PRO)}원/월
                  </span>
                  <span className="ml-2 text-xs font-bold text-mint">20% 할인</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-bold text-navy">
                  {formatNumber(SUBSCRIPTION_PRICES.PRO)}원
                </span>
                <span className="text-sm text-gray-500">/월</span>
              </div>
            )}
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {SUBSCRIPTION_PLAN_FEATURES.PRO.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2 text-sm">
                {feature.included ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                )}
                <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handlePlanSelect("PRO")}
            disabled={isCurrentPlan("PRO")}
            className={cn(
              "mt-6 w-full rounded-lg px-4 py-3 text-sm font-medium transition-all",
              isCurrentPlan("PRO")
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-mint text-white hover:bg-mint-dark active:scale-[0.97]"
            )}
          >
            {getButtonLabel("PRO")}
          </button>
        </div>

        {/* EXPERT Card */}
        <div
          className={cn(
            "relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
            isCurrentPlan("EXPERT") ? "border-navy ring-2 ring-navy" : "border-navy/30"
          )}
        >
          {/* Navy gradient top accent */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-navy-light to-navy" />

          {isCurrentPlan("EXPERT") && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-navy px-3 py-1 text-xs font-bold text-white">
              현재 이용중
            </span>
          )}

          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-navy" />
            <span className="rounded-md bg-navy/10 px-2.5 py-0.5 text-xs font-bold text-navy">
              EXPERT
            </span>
          </div>

          <div className="mt-4">
            {isYearly ? (
              <div>
                <span className="text-3xl font-bold text-navy">
                  {formatNumber(getMonthlyPrice("EXPERT"))}원
                </span>
                <span className="text-sm text-gray-500">/월</span>
                <div className="mt-1">
                  <span className="text-sm text-gray-400 line-through">
                    {formatNumber(SUBSCRIPTION_PRICES.EXPERT)}원/월
                  </span>
                  <span className="ml-2 text-xs font-bold text-mint">20% 할인</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-3xl font-bold text-navy">
                  {formatNumber(SUBSCRIPTION_PRICES.EXPERT)}원
                </span>
                <span className="text-sm text-gray-500">/월</span>
              </div>
            )}
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {SUBSCRIPTION_PLAN_FEATURES.EXPERT.map((feature) => (
              <li key={feature.text} className="flex items-start gap-2 text-sm">
                {feature.included ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                )}
                <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => handlePlanSelect("EXPERT")}
            disabled={isCurrentPlan("EXPERT")}
            className={cn(
              "mt-6 w-full rounded-lg px-4 py-3 text-sm font-medium transition-all",
              isCurrentPlan("EXPERT")
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-navy text-white hover:bg-navy-dark active:scale-[0.97]"
            )}
          >
            {getButtonLabel("EXPERT")}
          </button>
        </div>
      </div>

      {/* Checkout Section */}
      {selectedPlan && (
        <div
          id="checkout-section"
          className="mx-auto mt-12 max-w-lg animate-fade-in rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
        >
          <h3 className="text-lg font-bold text-navy">결제 정보</h3>

          {/* Selected Plan Summary */}
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedPlan === "PRO" ? (
                  <Crown className="h-5 w-5 text-mint" />
                ) : (
                  <Sparkles className="h-5 w-5 text-navy" />
                )}
                <span className="font-bold text-navy">
                  {SUBSCRIPTION_TIER_LABELS[selectedPlan]} 플랜
                </span>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                  {isYearly ? "연간" : "월간"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-navy">
                  {formatNumber(
                    isYearly
                      ? SUBSCRIPTION_YEARLY_PRICES[selectedPlan]
                      : SUBSCRIPTION_PRICES[selectedPlan]
                  )}
                  원
                </p>
                <p className="text-xs text-gray-500">
                  {isYearly ? "/년" : "/월"}
                </p>
              </div>
            </div>
            {isYearly && (
              <p className="mt-2 text-xs text-mint">
                월 {formatNumber(getMonthlyPrice(selectedPlan))}원 (정가 대비 20% 할인)
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700">결제 수단</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
                  paymentMethod === "card"
                    ? "border-mint bg-mint/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  className="sr-only"
                />
                <CreditCard
                  className={cn(
                    "h-4 w-4",
                    paymentMethod === "card" ? "text-mint" : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    paymentMethod === "card" ? "text-mint" : "text-gray-600"
                  )}
                >
                  카드
                </span>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
                  paymentMethod === "transfer"
                    ? "border-mint bg-mint/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="transfer"
                  checked={paymentMethod === "transfer"}
                  onChange={() => setPaymentMethod("transfer")}
                  className="sr-only"
                />
                <Building
                  className={cn(
                    "h-4 w-4",
                    paymentMethod === "transfer" ? "text-mint" : "text-gray-400"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    paymentMethod === "transfer" ? "text-mint" : "text-gray-600"
                  )}
                >
                  계좌이체
                </span>
              </label>
            </div>
          </div>

          {/* Terms Agreement */}
          <label className="mt-6 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-mint accent-mint"
            />
            <span className="text-sm text-gray-600">
              이용약관 및 자동 결제에 동의합니다
            </span>
          </label>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={!agreedToTerms}
            className={cn(
              "mt-6 w-full rounded-lg py-3 text-sm font-medium transition-all",
              agreedToTerms
                ? selectedPlan === "PRO"
                  ? "bg-mint text-white hover:bg-mint-dark active:scale-[0.97]"
                  : "bg-navy text-white hover:bg-navy-dark active:scale-[0.97]"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            )}
          >
            결제하기
          </button>

          <button
            onClick={() => setSelectedPlan(null)}
            className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            취소
          </button>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center text-xl font-bold text-navy">자주 묻는 질문</h2>
        <div className="mt-8 space-y-3">
          {FAQ_ITEMS.map((faq, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <span className="text-sm font-medium text-navy">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
                    openFaqIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200",
                  openFaqIndex === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
