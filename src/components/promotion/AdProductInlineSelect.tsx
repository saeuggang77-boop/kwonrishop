"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "@/lib/toast";

interface AdProduct {
  id: string;
  name: string;
  type: "PACKAGE" | "SINGLE" | "SUBSCRIPTION";
  categoryScope: "LISTING" | "FRANCHISE" | "PARTNER" | "EQUIPMENT" | "COMMON";
  price: number;
  duration: number | null;
  features: Record<string, any>;
}

type Scope = "LISTING" | "FRANCHISE" | "PARTNER" | "EQUIPMENT";
type PeriodKey = "1m" | "3m" | "6m" | "12m";

const PERIODS: { key: PeriodKey; label: string; discount: string | null }[] = [
  { key: "1m", label: "1개월", discount: null },
  { key: "3m", label: "3개월", discount: "-10%" },
  { key: "6m", label: "6개월", discount: "-15%" },
  { key: "12m", label: "12개월", discount: "-20%" },
];

interface Props {
  scope: Scope;
  listingId?: string;
  partnerServiceId?: string;
  equipmentId?: string;
  onSkip: () => void;
  skipLabel?: string;
}

export default function AdProductInlineSelect({
  scope,
  listingId,
  partnerServiceId,
  equipmentId,
  onSkip,
  skipLabel = "나중에 하기",
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<AdProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("1m");

  useEffect(() => {
    fetch("/api/ad-products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const needsPeriod = scope === "FRANCHISE" || scope === "PARTNER";

  const cards = useMemo(() => {
    return products.filter((p) => {
      if (p.type !== "PACKAGE" || p.categoryScope !== scope) return false;
      if (needsPeriod) {
        const pPeriod = (p.features as Record<string, any>)?.period || "1m";
        return pPeriod === period;
      }
      return true;
    });
  }, [products, scope, period, needsPeriod]);

  async function handlePurchase(productId: string) {
    if (!session) {
      router.push("/login");
      return;
    }

    setPurchasing(productId);

    try {
      const body: Record<string, string> = { productId };
      if (listingId) body.listingId = listingId;
      if (partnerServiceId) body.partnerServiceId = partnerServiceId;
      if (equipmentId) body.equipmentId = equipmentId;

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        const params = new URLSearchParams({
          orderId: data.orderId,
          amount: data.amount.toString(),
          orderName: data.orderName,
          customerName: session.user?.name || "고객",
        });
        if (data.supplyPrice) params.set("supplyPrice", data.supplyPrice.toString());
        if (data.vatAmount) params.set("vatAmount", data.vatAmount.toString());
        router.push(`/payments/checkout?${params.toString()}`);
      } else {
        toast.error(data.error || "구매 요청 중 오류가 발생했습니다.");
        setPurchasing(null);
      }
    } catch {
      toast.error("구매 요청 중 오류가 발생했습니다.");
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="text-center mb-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          💎 더 많은 고객에게 노출하세요
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          광고 상품 선택 시 결제 페이지로 이동합니다 · VAT 10% 별도
        </p>
      </div>

      {/* 기간 탭 (FRANCHISE/PARTNER) */}
      {needsPeriod && (
        <div className="flex justify-center mb-4">
          <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  period === p.key
                    ? "bg-navy-700 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {p.label}
                {p.discount && (
                  <span className={`ml-1 text-[10px] font-semibold ${
                    period === p.key ? "text-navy-100" : "text-red-500 dark:text-red-400"
                  }`}>
                    {p.discount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        {cards.map((product, idx) => (
          <CompactCard
            key={product.id}
            product={product}
            onPurchase={handlePurchase}
            purchasing={purchasing === product.id}
            disabled={purchasing !== null && purchasing !== product.id}
            isTop={idx === cards.length - 1}
            isMid={idx === Math.floor(cards.length / 2) && cards.length === 3}
          />
        ))}
      </div>

      {/* 건너뛰기 + 상세 페이지 링크 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-4"
        >
          {skipLabel}
        </button>
        <Link
          href={`/pricing?tab=${scope}${listingId ? `&listingId=${listingId}` : ""}${partnerServiceId ? `&partnerServiceId=${partnerServiceId}` : ""}${equipmentId ? `&equipmentId=${equipmentId}` : ""}`}
          className="text-sm text-navy-700 dark:text-navy-400 hover:text-navy-800 font-medium"
        >
          더 많은 옵션 보기 →
        </Link>
      </div>
    </div>
  );
}

function CompactCard({
  product,
  onPurchase,
  purchasing,
  disabled,
  isTop,
  isMid,
}: {
  product: AdProduct;
  onPurchase: (id: string) => void;
  purchasing: boolean;
  disabled: boolean;
  isTop: boolean;
  isMid: boolean;
}) {
  const features = product.features as Record<string, any>;

  const theme = isTop
    ? {
        border: "border-yellow-400 dark:border-yellow-500",
        bg: "bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/50 dark:to-gray-800",
        badge: "BEST",
        badgeBg: "bg-yellow-400 text-yellow-900",
        btn: "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700",
        ring: "ring-1 ring-yellow-400",
      }
    : isMid
    ? {
        border: "border-navy-400",
        bg: "bg-gradient-to-br from-navy-50 to-white dark:from-navy-950/50 dark:to-gray-800",
        badge: "추천",
        badgeBg: "bg-navy-500 text-white",
        btn: "bg-navy-700 hover:bg-navy-600 active:bg-navy-800",
        ring: "ring-1 ring-navy-400",
      }
    : {
        border: "border-gray-200 dark:border-gray-700",
        bg: "bg-white dark:bg-gray-800",
        badge: null,
        badgeBg: "",
        btn: "bg-gray-800 hover:bg-gray-900 active:bg-black dark:bg-gray-700 dark:hover:bg-gray-600",
        ring: "",
      };

  const tierName = features.badge || product.name;
  const priceWon = (product.price / 10000).toLocaleString();
  const durationLabel = product.duration
    ? product.duration >= 365
      ? "12개월"
      : product.duration >= 180
      ? "6개월"
      : product.duration >= 90
      ? "3개월"
      : `${product.duration}일`
    : null;

  // 핵심 혜택 2개만 요약
  const highlights: string[] = [];
  if (features.mainVip || features.mainRecommend || features.mainFeatured) {
    highlights.push("메인 대형 노출");
  } else if (features.mainPremium) {
    highlights.push("메인 프리미엄 섹션");
  } else if (features.mainBasic || features.mainExposure) {
    highlights.push("메인 섹션 노출");
  }
  if (features.topExposure) highlights.push("검색 상위");
  if (features.bumpCount) highlights.push(`끌올 ${features.bumpCount}회`);
  if (features.verified) highlights.push("인증 마크");
  const topTwo = highlights.slice(0, 2);

  return (
    <div
      className={`relative rounded-xl p-3 border-2 ${theme.border} ${theme.bg} ${theme.ring}`}
    >
      {theme.badge && (
        <div
          className={`absolute -top-2 left-1/2 -translate-x-1/2 ${theme.badgeBg} px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap`}
        >
          {theme.badge}
        </div>
      )}

      <div className="text-center mb-2 pt-1">
        <div className="text-sm font-bold text-gray-900 dark:text-white mb-1 truncate">
          {tierName}
        </div>
        <div className="flex items-baseline justify-center gap-0.5">
          <span className="text-xl font-bold text-gray-900 dark:text-white">{priceWon}</span>
          <span className="text-xs text-gray-600 dark:text-gray-300">만원</span>
        </div>
        {durationLabel && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400">{durationLabel}</p>
        )}
      </div>

      <ul className="space-y-1 mb-3 min-h-[44px]">
        {topTwo.map((h, i) => (
          <li key={i} className="flex items-center gap-1 text-[11px] text-gray-700 dark:text-gray-300">
            <span className="text-navy-600 dark:text-navy-400">✓</span>
            <span className="truncate">{h}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onPurchase(product.id)}
        disabled={purchasing || disabled}
        className={`w-full py-2 rounded-lg text-white text-xs font-bold transition-colors ${theme.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {purchasing ? "처리 중..." : "결제하기"}
      </button>
    </div>
  );
}
