"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { SUBSCRIPTION_TIER_LABELS, SUBSCRIPTION_PRICES } from "@/lib/utils/constants";
import { formatKRW } from "@/lib/utils/format";
import { v4 as uuidv4 } from "uuid";

const tiers = [
  { key: "FREE", features: ["매물 검색", "기본 시세 정보", "일일 5건 조회"] },
  { key: "BASIC", features: ["무제한 매물 검색", "시세 분석 리포트", "비교 매물 데이터", "이메일 알림"] },
  { key: "PREMIUM", features: ["BASIC 기능 전체", "심층 리포트 할인", "우선 고객 지원", "API 접근", "광고 제거"] },
];

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

export default function PremiumCheckoutPage() {
  const router = useRouter();
  const [selected, setSelected] = useState("BASIC");
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (selected === "FREE") {
      router.push("/");
      return;
    }

    const amount = SUBSCRIPTION_PRICES[selected];
    if (!amount) return;

    setIsLoading(true);

    try {
      // Dynamic import of TossPayments SDK
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: uuidv4() });

      const orderId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName: `${SUBSCRIPTION_TIER_LABELS[selected]} 구독`,
        successUrl: `${window.location.origin}/premium/success?tier=${selected}`,
        failUrl: `${window.location.origin}/premium/fail`,
      });
    } catch (error) {
      // User closed payment or error occurred
      if (error instanceof Error && error.message.includes("USER_CANCEL")) {
        // User cancelled - do nothing
      } else {
        router.push("/premium/fail");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy">프리미엄 플랜</h1>
        <p className="mt-2 text-gray-500">더 강력한 분석 도구로 안전한 거래를 시작하세요</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            onClick={() => setSelected(tier.key)}
            className={`cursor-pointer rounded-xl border-2 p-6 transition ${
              selected === tier.key
                ? "border-mint bg-mint/5 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <h3 className="text-lg font-bold text-navy">
              {SUBSCRIPTION_TIER_LABELS[tier.key]}
            </h3>
            <p className="mt-2 text-3xl font-bold text-navy">
              {SUBSCRIPTION_PRICES[tier.key] === 0
                ? "무료"
                : `${formatKRW(SUBSCRIPTION_PRICES[tier.key])}`}
              {SUBSCRIPTION_PRICES[tier.key] > 0 && (
                <span className="text-sm font-normal text-gray-500"> /월</span>
              )}
            </p>
            <ul className="mt-6 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-mint" /> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="rounded-lg bg-mint px-10 py-3 text-lg font-medium text-white hover:bg-mint-dark disabled:opacity-50"
        >
          {isLoading ? "결제 준비 중..." : selected === "FREE" ? "무료로 시작" : `${SUBSCRIPTION_TIER_LABELS[selected]} 구독하기`}
        </button>
        {selected !== "FREE" && (
          <p className="mt-3 text-xs text-gray-500">
            토스페이먼츠 안전 결제로 진행됩니다. 언제든 해지 가능합니다.
          </p>
        )}
      </div>
    </div>
  );
}
