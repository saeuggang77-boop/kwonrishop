"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type TabKey = "LISTING" | "FRANCHISE" | "PARTNER" | "EQUIPMENT";

const TABS: { key: TabKey; label: string; role: string }[] = [
  { key: "LISTING", label: "사장님 매물", role: "SELLER" },
  { key: "FRANCHISE", label: "프랜차이즈", role: "FRANCHISE" },
  { key: "PARTNER", label: "협력업체", role: "PARTNER" },
  { key: "EQUIPMENT", label: "집기장터", role: "SELLER" },
];

type PeriodKey = "1m" | "3m" | "6m" | "12m";

const PERIODS: { key: PeriodKey; label: string; discount: string | null }[] = [
  { key: "1m", label: "1개월", discount: null },
  { key: "3m", label: "3개월", discount: "10% 할인" },
  { key: "6m", label: "6개월", discount: "15% 할인" },
  { key: "12m", label: "12개월", discount: "20% 할인" },
];

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [products, setProducts] = useState<AdProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("LISTING");
  const [franchisePeriod, setFranchisePeriod] = useState<PeriodKey>("1m");
  const [existingAd, setExistingAd] = useState<{ name: string; expiresAt: string | null } | null>(null);

  // URL 파라미터 또는 사용자 역할에 따라 기본 탭 선택
  useEffect(() => {
    const tabParam = searchParams.get("tab")?.toUpperCase() as TabKey | undefined;
    if (tabParam && TABS.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    } else if (session?.user?.role) {
      const matchedTab = TABS.find((t) => t.role === session.user.role);
      if (matchedTab) {
        setActiveTab(matchedTab.key);
      }
    }
  }, [session?.user?.role, searchParams]);

  useEffect(() => {
    fetch("/api/ad-products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 기존 활성 광고 확인 (업그레이드 안내용)
  useEffect(() => {
    const listingId = searchParams.get("listingId");
    const equipmentId = searchParams.get("equipmentId");
    if (!session?.user || (!listingId && !equipmentId)) return;

    fetch("/api/payments?limit=100")
      .then((r) => r.json())
      .then((data) => {
        const targetId = listingId || equipmentId;
        const targetKey = listingId ? "listing" : "equipment";
        const active = data.payments?.find(
          (p: any) =>
            p.status === "PAID" &&
            p[targetKey]?.id === targetId &&
            p.product?.type === "PACKAGE" &&
            (!p.expiresAt || new Date(p.expiresAt) > new Date())
        );
        if (active) {
          setExistingAd({
            name: active.product.name,
            expiresAt: active.expiresAt,
          });
        }
      })
      .catch(() => {});
  }, [session, searchParams]);

  const packageProducts = useMemo(
    () => products.filter((p) => {
      if (p.type !== "PACKAGE" || p.categoryScope !== activeTab) return false;
      // For FRANCHISE/PARTNER tab, filter by selected period
      if (activeTab === "FRANCHISE" || activeTab === "PARTNER") {
        const period = (p.features as Record<string, any>)?.period;
        // Products without period field are legacy 1m products
        return (period || "1m") === franchisePeriod;
      }
      return true;
    }),
    [products, activeTab, franchisePeriod]
  );

  const singleProducts = useMemo(
    () => products.filter((p) => p.categoryScope === "COMMON" && p.type === "SINGLE"),
    [products]
  );

  const subscriptionProducts = useMemo(
    () => products.filter((p) => p.type === "SUBSCRIPTION").sort((a, b) => a.price - b.price),
    [products]
  );

  async function handlePurchase(productId: string) {
    if (!session) {
      router.push("/login");
      return;
    }

    setPurchasing(productId);

    try {
      // Build request body with target entity IDs from URL params
      const requestBody: Record<string, string> = { productId };
      const listingId = searchParams.get("listingId");
      const equipmentId = searchParams.get("equipmentId");
      const partnerServiceId = searchParams.get("partnerServiceId");
      if (listingId) requestBody.listingId = listingId;
      if (equipmentId) requestBody.equipmentId = equipmentId;
      if (partnerServiceId) requestBody.partnerServiceId = partnerServiceId;

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (res.ok) {
        const params = new URLSearchParams({
          orderId: data.orderId,
          amount: data.amount.toString(),
          orderName: data.orderName,
          customerName: session.user.name || "고객",
        });
        if (data.supplyPrice) params.set("supplyPrice", data.supplyPrice.toString());
        if (data.vatAmount) params.set("vatAmount", data.vatAmount.toString());
        router.push(`/payments/checkout?${params.toString()}`);
      } else {
        toast.error(data.error || "구매 중 오류가 발생했습니다.");
        setPurchasing(null);
      }
    } catch {
      toast.error("구매 요청 중 오류가 발생했습니다.");
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto" />
          <div className="h-10 bg-gray-200 rounded w-2/3 mx-auto" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 네이비 헤더 */}
      <div className="bg-gradient-to-br from-green-800 to-green-700 px-6 pb-16 pt-12 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
          비즈니스를 성장시키는 프리미엄 서비스
        </h1>
        <p className="text-white/60 text-lg">
          목적에 맞는 요금제를 선택하고 더 많은 고객에게 다가가세요
        </p>
        <p className="text-sm text-white/40 mt-2">
          ※ 모든 가격은 부가세(VAT 10%) 별도입니다
        </p>
      </div>

      {/* 플로팅 탭 */}
      <div className="flex justify-center -mt-5 relative z-10 mb-8">
        <div className="inline-flex bg-white rounded-xl p-1 shadow-lg">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-green-700 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* 환불 정책 안내 (결제 전 필수 고지) */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm">
              <p className="font-semibold text-amber-800 mb-1">결제 전 환불 정책을 꼭 확인해 주세요</p>
              <ul className="text-amber-700 space-y-0.5 list-disc list-inside">
                <li>광고 노출이 시작된 이후에는 <strong>환불이 불가능</strong>합니다.</li>
                <li>매장 판매·매물 삭제 등 회원 사정으로 광고를 중단해도 환불되지 않습니다.</li>
                <li>끌어올리기 등 즉시 소모되는 서비스는 사용 후 환불 불가합니다.</li>
                <li>자세한 내용은 <Link href="/terms" target="_blank" className="underline font-medium">이용약관 제10조</Link>를 참고해주세요.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 기존 활성 광고 안내 */}
        {existingAd && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-amber-800 font-medium">
              현재 &quot;{existingAd.name}&quot; 광고가 활성 중입니다
              {existingAd.expiresAt && ` (${new Date(existingAd.expiresAt).toLocaleDateString("ko-KR")} 만료)`}
            </p>
            <p className="text-amber-700 text-sm mt-1">
              다른 상품 구매 시 기존 광고는 즉시 종료되며 환불되지 않습니다. 자세한 내용은 <Link href="/terms" target="_blank" className="text-amber-900 underline">이용약관</Link>을 확인해주세요.
            </p>
          </div>
        )}

        {/* 프랜차이즈 기간 선택 */}
      {(activeTab === "FRANCHISE" || activeTab === "PARTNER") && (
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
              {PERIODS.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setFranchisePeriod(period.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    franchisePeriod === period.key
                      ? "bg-green-700 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {period.label}
                  {period.discount && (
                    <span className={`block text-xs mt-0.5 ${
                      franchisePeriod === period.key ? "text-green-100" : "text-red-500 font-semibold"
                    }`}>
                      {period.discount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {franchisePeriod !== "1m" && (
            <p className="text-center text-sm text-green-600 font-medium mt-3">
              장기 구독 할인이 적용된 가격입니다
            </p>
          )}
        </div>
      )}

      {/* 패키지 상품 3열 그리드 */}
      {packageProducts.length > 0 && (
        <div className="mb-14">
          <div className="grid md:grid-cols-3 gap-6">
            {packageProducts.map((product, idx) => (
              <PackageCard
                key={product.id}
                product={product}
                onPurchase={handlePurchase}
                purchasing={purchasing === product.id}
                tierIndex={idx}
                totalTiers={packageProducts.length}
              />
            ))}
          </div>
        </div>
      )}

      {/* 정기 끌어올리기 구독 (LISTING 탭에만 표시) */}
      {activeTab === "LISTING" && subscriptionProducts.length > 0 && (
        <div className="mb-14">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              🔄 정기 끌어올리기 구독
            </h2>
            <p className="text-gray-600">
              패키지 없이도 매물 노출을 높이고 싶다면, 자동 끌어올리기를 이용해보세요
            </p>
            <p className="text-sm text-gray-400 mt-1">
              매번 수동 끌올 대신 설정한 주기에 맞춰 자동으로 상단에 노출됩니다
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subscriptionProducts.map((product) => (
              <SubscriptionCard
                key={product.id}
                product={product}
                onPurchase={handlePurchase}
                purchasing={purchasing === product.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* 단건 공통 상품 */}
      {singleProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">단건 부가 상품</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {singleProducts.map((product) => (
              <SingleCard
                key={product.id}
                product={product}
                onPurchase={handlePurchase}
                purchasing={purchasing === product.id}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function PackageCard({
  product,
  onPurchase,
  purchasing,
  tierIndex,
  totalTiers,
}: {
  product: AdProduct;
  onPurchase: (id: string) => void;
  purchasing: boolean;
  tierIndex: number;
  totalTiers: number;
}) {
  const features = product.features as Record<string, any>;
  const isTop = tierIndex === totalTiers - 1;
  const isMid = tierIndex === Math.floor(totalTiers / 2) && totalTiers === 3;

  // 색상 테마 결정
  const theme = isTop
    ? {
        border: "border-yellow-400",
        bg: "bg-gradient-to-br from-yellow-50 to-white",
        badge: "BEST",
        badgeBg: "bg-yellow-400 text-yellow-900",
        btn: "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700",
        ring: "ring-2 ring-yellow-400 shadow-lg",
      }
    : isMid
    ? {
        border: "border-green-400",
        bg: "bg-gradient-to-br from-green-50 to-white",
        badge: "추천",
        badgeBg: "bg-green-500 text-white",
        btn: "bg-green-700 hover:bg-green-600 active:bg-green-800",
        ring: "ring-2 ring-green-400 shadow-md",
      }
    : {
        border: "border-gray-200",
        bg: "bg-white",
        badge: null,
        badgeBg: "",
        btn: "bg-gray-800 hover:bg-gray-900 active:bg-black",
        ring: "",
      };

  // features에서 표시할 항목 생성
  const featureList = buildFeatureList(features, product.categoryScope, product.duration);

  return (
    <div
      className={`relative rounded-2xl p-6 border-2 ${theme.border} ${theme.bg} ${theme.ring}`}
    >
      {theme.badge && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 ${theme.badgeBg} px-4 py-1 rounded-full text-sm font-bold`}
        >
          {theme.badge}
        </div>
      )}

      <div className="text-center mb-6 pt-2">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {/* Show tier name without period suffix */}
          {features.badge || product.name}
        </h3>
        {features.discount && (
          <div className="inline-block bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full mb-2">
            {features.discount} 할인
          </div>
        )}
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900">
            {(product.price / 10000).toLocaleString()}
          </span>
          <span className="text-xl text-gray-600">만원</span>
        </div>
        {product.duration && (
          <p className="text-sm text-gray-500 mt-1">
            {product.duration >= 365 ? "12개월" : product.duration >= 180 ? "6개월" : product.duration >= 90 ? "3개월" : `${product.duration}일`} 동안
          </p>
        )}
        {features.period && features.period !== "1m" && (
          <p className="text-xs text-gray-400 mt-0.5">
            월 {Math.round(product.price / (product.duration! / 30) / 10000).toLocaleString()}만원
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6 min-h-[180px]">
        {featureList.map((f, i) => (
          <Feature key={i} icon={f.icon} text={f.text} />
        ))}
      </ul>

      <button
        onClick={() => onPurchase(product.id)}
        disabled={purchasing}
        className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${theme.btn} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {purchasing ? "처리 중..." : "구매하기"}
      </button>
    </div>
  );
}

function buildFeatureList(
  features: Record<string, any>,
  scope: string,
  duration?: number | null
): { icon: string; text: string }[] {
  const list: { icon: string; text: string }[] = [];

  // 통일된 순서: 카드형 → 디렉토리등재 → 전용페이지 → 상위노출 → 끌어올리기 → 메인노출 → 인증마크 → 노출보장 → 등급배지 → 크로스셀

  // 1. 카드 표시형
  if (features.layoutType) {
    if (features.layoutType === "row") {
      list.push({ icon: "📋", text: "텍스트 목록 등록" });
    } else if (features.layoutType === "horizontal-3col") {
      list.push({ icon: "🎴", text: "프리미엄 가로형 카드 (3열 레이아웃)" });
    } else if (features.layoutType === "large-2col") {
      list.push({ icon: "🏆", text: "VIP 전용 대형 카드 (2열 레이아웃)" });
    }
  } else if (scope === "LISTING") {
    if (features.mainVip) {
      list.push({ icon: "🏆", text: "VIP 전용 대형 카드 (2열 레이아웃)" });
    } else if (features.mainPremium) {
      list.push({ icon: "🎴", text: "프리미엄 가로형 카드 (3열 레이아웃)" });
    } else {
      list.push({ icon: "📋", text: "텍스트 줄광고형 등록" });
    }
  }

  // 2. 디렉토리 등재 (franchise)
  if (features.listingRegister)
    list.push({ icon: "📝", text: "프랜차이즈 디렉토리 정식 등재" });

  // 3. 전용 상세 페이지 (실제 제공되는 혜택)
  if (scope === "FRANCHISE") {
    list.push({ icon: "🏪", text: "전용 브랜드 상세 페이지 제공" });
  } else if (scope === "PARTNER") {
    list.push({ icon: "🏢", text: "전용 서비스 프로필 페이지 제공" });
  } else if (scope === "EQUIPMENT") {
    list.push({ icon: "📦", text: "전용 상품 상세 페이지 제공" });
  }

  // 4. 검색 상위 노출
  if (features.topExposure)
    list.push({ icon: "⬆️", text: "검색 결과 상단 우선 배치" });

  // 5. 끌어올리기
  if (features.bumpCount)
    list.push({ icon: "🔥", text: `끌어올리기 ${features.bumpCount}회 (목록 최상단 재노출)` });

  // 6. 메인 페이지 노출 (scope별 분기)
  if (scope === "LISTING") {
    if (features.mainVip)
      list.push({ icon: "👑", text: "권리샵 메인 화면 VIP 전용 대형 배너 노출" });
    if (features.mainPremium)
      list.push({ icon: "💎", text: "권리샵 메인 화면 프리미엄 매물 섹션 노출" });
    if (features.mainBasic)
      list.push({ icon: "🏠", text: "권리샵 메인 화면 매물 섹션 노출" });
  } else if (scope === "FRANCHISE") {
    if (features.mainFeatured)
      list.push({ icon: "⭐", text: "권리샵 메인 화면 대형 카드 노출" });
  } else if (scope === "PARTNER") {
    if (features.mainRecommend)
      list.push({ icon: "⭐", text: "권리샵 메인 화면 VIP 전용 대형 노출" });
    if (features.mainExposure)
      list.push({ icon: "🏠", text: "권리샵 메인 화면 노출" });
  } else if (scope === "EQUIPMENT") {
    // BUG FIX: seed uses mainRecommend/mainExposure (not mainVip/mainPremium)
    if (features.mainRecommend)
      list.push({ icon: "👑", text: "권리샵 메인 화면 VIP 전용 대형 노출" });
    if (features.mainExposure)
      list.push({ icon: "🏠", text: "권리샵 메인 화면 노출" });
  }

  // 7. 인증 마크 (listing basic verified)
  if (features.verified)
    list.push({ icon: "✅", text: "인증 매물 마크 표시" });

  // 8. 노출 기간 보장
  if (duration) {
    const days = duration >= 365 ? "12개월" : duration >= 180 ? "6개월" : duration >= 90 ? "3개월" : `${duration}일`;
    list.push({ icon: "📅", text: `${days} 노출 보장` });
  }

  // 9. 등급 배지
  if (features.badge)
    list.push({ icon: "🎖️", text: `${features.badge} 인증 마크` });

  // 10. 크로스셀 (scope별 구체적 문구)
  if (scope === "LISTING") {
    if (features.mainVip) {
      list.push({ icon: "🔗", text: "프랜차이즈·협력업체 상세 페이지에 추천 매물 노출 (VIP 전용)" });
    }
  } else {
    const isTopTier =
      (scope === "FRANCHISE" && (features.mainFeatured || features.mainRecommend)) ||
      (scope === "PARTNER" && features.mainRecommend) ||
      (scope === "EQUIPMENT" && features.mainRecommend);

    const crossSellText = scope === "FRANCHISE"
      ? "협력업체·집기 상세 페이지에 브랜드 추천 노출"
      : scope === "PARTNER"
      ? "프랜차이즈·집기 상세 페이지에 업체 추천 노출"
      : "프랜차이즈·협력업체 상세 페이지에 추천 노출";

    const topCrossSellText = scope === "FRANCHISE"
      ? "매물 상세 '추천 프랜차이즈' 노출 (골드 전용)"
      : scope === "PARTNER"
      ? "매물 상세 '추천 협력업체' 노출 (VIP 전용)"
      : "매물 상세 '추천 집기' 노출 (VIP 전용)";

    if (isTopTier) {
      list.push({ icon: "🔗", text: crossSellText });
      list.push({ icon: "🏅", text: topCrossSellText });
    } else if (features.topExposure) {
      list.push({ icon: "🔗", text: crossSellText });
    }
  }

  return list;
}

function SingleCard({
  product,
  onPurchase,
  purchasing,
}: {
  product: AdProduct;
  onPurchase: (id: string) => void;
  purchasing: boolean;
}) {
  const features = product.features as Record<string, any>;

  return (
    <div className="rounded-xl p-5 border border-gray-200 bg-white hover:border-green-300 hover:shadow-md transition-all">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {product.price.toLocaleString()}
          </span>
          <span className="text-sm text-gray-600">원</span>
        </div>
        {product.duration && (
          <p className="text-xs text-gray-500 mt-1">{product.duration}일 유효</p>
        )}
      </div>

      {features.description && (
        <p className="text-sm text-gray-600 text-center mb-4">
          {features.description}
        </p>
      )}

      <button
        onClick={() => onPurchase(product.id)}
        disabled={purchasing}
        className="w-full py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {purchasing ? "처리 중..." : "구매하기"}
      </button>
    </div>
  );
}

function SubscriptionCard({
  product,
  onPurchase,
  purchasing,
}: {
  product: AdProduct;
  onPurchase: (id: string) => void;
  purchasing: boolean;
}) {
  const features = product.features as Record<string, any>;
  const isPopular = features.popular === true;

  // 빈도별 설명
  const frequencyMap: Record<string, string> = {
    TWICE_WEEKLY: "주 2회 (월·목)",
    WEEKDAY_DAILY: "평일 매일",
    DAILY: "매일 1회",
    TWICE_DAILY: "매일 2회",
  };

  const timeDisplay = features.bumpTimes
    ? features.bumpTimes.length === 1
      ? `오전 ${features.bumpTimes[0].replace(":00", "시")}`
      : `오전 ${features.bumpTimes[0].replace(":00", "시")} + 오후 ${features.bumpTimes[1].replace(":00", "시")}`
    : "자동 끌올";

  return (
    <div
      className={`relative rounded-xl p-5 border-2 bg-white hover:shadow-lg transition-all ${
        isPopular
          ? "border-green-400 ring-2 ring-green-400 shadow-md"
          : "border-gray-200 hover:border-green-300"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
          인기
        </div>
      )}

      <div className="text-center mb-4 pt-1">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {product.name.replace("끌어올리기 ", "")}
        </h3>
        <div className="flex items-baseline justify-center gap-1 mb-1">
          <span className="text-2xl font-bold text-gray-900">
            월 {(product.price / 10000).toLocaleString()}
          </span>
          <span className="text-sm text-gray-600">만원</span>
        </div>
        <p className="text-xs text-gray-500">30일 자동 갱신</p>
      </div>

      <div className="space-y-2 mb-4 min-h-[100px]">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-green-700">📅</span>
          <span className="font-medium">{frequencyMap[features.frequency] || "자동 끌올"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-orange-500">⏰</span>
          <span>{timeDisplay} 자동 끌올</span>
        </div>
        {features.savingsPercent && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600">💰</span>
            <span className="text-green-600 font-medium">
              단건 대비 {features.savingsPercent}% 절약
            </span>
          </div>
        )}
        {!features.savingsPercent && features.frequency === "TWICE_DAILY" && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>🚀</span>
            <span className="font-medium">최대 노출 효과</span>
          </div>
        )}
        {features.frequency === "DAILY" && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>📈</span>
            <span>가장 꾸준한 노출</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onPurchase(product.id)}
        disabled={purchasing}
        className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isPopular
            ? "bg-green-700 hover:bg-green-600 active:bg-green-800"
            : "bg-gray-800 hover:bg-gray-900 active:bg-black"
        }`}
      >
        {purchasing ? "처리 중..." : "구독하기"}
      </button>
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-center gap-2 text-gray-700">
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{text}</span>
    </li>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto" />
          <div className="h-10 bg-gray-200 rounded w-2/3 mx-auto" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
