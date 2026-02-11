"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Crown, Star, Zap } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { PREMIUM_AD_PLANS } from "@/lib/utils/constants";
import { useToast } from "@/components/ui/toast";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

interface MyListing {
  id: string;
  title: string;
  businessCategory: string;
  isPremium: boolean;
}

const TIER_ICONS: Record<string, React.ElementType> = {
  BASIC: Zap,
  PREMIUM: Star,
  VIP: Crown,
};

const TIER_STYLES: Record<string, { border: string; bg: string; badge: string }> = {
  BASIC: { border: "border-amber-300", bg: "bg-gradient-to-b from-amber-50 to-white", badge: "bg-amber-100 text-amber-700" },
  PREMIUM: { border: "border-purple-300", bg: "bg-gradient-to-b from-purple-50 to-white", badge: "bg-purple-100 text-purple-700" },
  VIP: { border: "border-yellow-400", bg: "bg-gradient-to-b from-yellow-50 to-white", badge: "bg-yellow-100 text-yellow-800" },
};

export default function PremiumListingAdPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-500">로딩 중...</div>}>
      <PremiumListingAdContent />
    </Suspense>
  );
}

function PremiumListingAdContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const preselectedListingId = searchParams.get("listingId");
  const isExtend = searchParams.get("extend") === "true";

  const [selectedTier, setSelectedTier] = useState("PREMIUM");
  const [selectedListingId, setSelectedListingId] = useState(preselectedListingId ?? "");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/listings?limit=50")
      .then((r) => r.json())
      .then((j) => {
        setMyListings(
          (j.data ?? []).map((l: Record<string, unknown>) => ({
            id: l.id,
            title: l.title,
            businessCategory: l.businessCategory,
            isPremium: l.isPremium ?? false,
          }))
        );
      })
      .catch(() => {});
  }, []);

  const selectedPlan = PREMIUM_AD_PLANS.find((p) => p.tier === selectedTier);

  const handlePayment = async () => {
    if (!selectedListingId) {
      toast("info", "매물을 선택해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // 1) Create Payment record in DB
      const createRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType: "ADVERTISEMENT",
          tier: selectedTier,
          listingId: selectedListingId,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error?.message ?? "결제 생성에 실패했습니다.");
      }
      const { data } = await createRes.json();

      // 2) TossPayments SDK 호출
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const payment = tossPayments.payment({ customerKey: crypto.randomUUID() });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: data.amount },
        orderId: data.orderId,
        orderName: data.orderName,
        successUrl: `${window.location.origin}/premium/listing-ad/success?listingId=${selectedListingId}&tier=${selectedTier}`,
        failUrl: `${window.location.origin}/premium/listing-ad/fail`,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("USER_CANCEL")) {
        // User cancelled - do nothing
      } else {
        router.push("/premium/listing-ad/fail");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-navy">
          {isExtend ? "프리미엄 광고 연장" : "프리미엄 매물 광고"}
        </h1>
        <p className="mt-2 text-gray-500">매물을 상단에 노출하여 더 많은 관심을 받아보세요</p>
      </div>

      {/* Plan Cards */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {PREMIUM_AD_PLANS.map((plan) => {
          const Icon = TIER_ICONS[plan.tier];
          const style = TIER_STYLES[plan.tier];
          const isSelected = selectedTier === plan.tier;

          return (
            <div
              key={plan.tier}
              onClick={() => setSelectedTier(plan.tier)}
              className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${style.bg} ${
                isSelected
                  ? `${style.border} shadow-lg scale-[1.02]`
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {plan.tier === "VIP" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-3 py-0.5 text-xs font-bold text-yellow-900">
                  BEST
                </span>
              )}
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-2 ${style.badge}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-navy">{plan.tier}</h3>
              </div>
              <p className="mt-4 text-3xl font-bold text-navy">
                {formatKRW(plan.price)}
                <span className="text-sm font-normal text-gray-500"> /{plan.days}일</span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Listing Selection */}
      <div className="mt-10">
        <h2 className="text-lg font-bold text-navy">광고할 매물 선택</h2>
        <select
          value={selectedListingId}
          onChange={(e) => setSelectedListingId(e.target.value)}
          className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
        >
          <option value="">매물을 선택하세요</option>
          {myListings.map((listing) => (
            <option key={listing.id} value={listing.id}>
              {listing.title} {listing.isPremium ? "(이미 프리미엄)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Payment Method */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-navy">결제수단</h2>
        <div className="mt-3 flex gap-4">
          <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-6 py-3 transition-all ${
            paymentMethod === "card" ? "border-mint bg-mint/5" : "border-gray-200"
          }`}>
            <input
              type="radio"
              name="payment"
              value="card"
              checked={paymentMethod === "card"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="accent-mint"
            />
            <span className="text-sm font-medium text-gray-700">신용/체크카드</span>
          </label>
          <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-6 py-3 transition-all ${
            paymentMethod === "transfer" ? "border-mint bg-mint/5" : "border-gray-200"
          }`}>
            <input
              type="radio"
              name="payment"
              value="transfer"
              checked={paymentMethod === "transfer"}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="accent-mint"
            />
            <span className="text-sm font-medium text-gray-700">계좌이체</span>
          </label>
        </div>
      </div>

      {/* Summary & Pay */}
      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">선택 플랜</p>
            <p className="mt-1 text-lg font-bold text-navy">{selectedPlan?.tier} ({selectedPlan?.days}일)</p>
          </div>
          <p className="text-2xl font-bold text-navy">{formatKRW(selectedPlan?.price ?? 0)}</p>
        </div>
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="mt-6 w-full rounded-lg bg-mint py-3.5 text-lg font-medium text-white transition-colors hover:bg-mint-dark disabled:opacity-50"
        >
          {isLoading ? "결제 준비 중..." : isExtend ? "광고 연장하기" : "광고 결제하기"}
        </button>
        <p className="mt-3 text-center text-xs text-gray-500">
          토스페이먼츠 안전 결제로 진행됩니다. 광고 기간 만료 후 자동 갱신되지 않습니다.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/dashboard/premium" className="text-sm text-gray-500 hover:text-mint">
          광고 관리 대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}
