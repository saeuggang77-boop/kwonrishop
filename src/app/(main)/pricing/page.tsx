"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AdProduct {
  id: string;
  name: string;
  type: "PACKAGE" | "SINGLE";
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

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<AdProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("LISTING");

  // 사용자 역할에 따라 기본 탭 선택
  useEffect(() => {
    if (session?.user?.role) {
      const matchedTab = TABS.find((t) => t.role === session.user.role);
      if (matchedTab) {
        setActiveTab(matchedTab.key);
      }
    }
  }, [session?.user?.role]);

  useEffect(() => {
    fetch("/api/ad-products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const packageProducts = useMemo(
    () => products.filter((p) => p.type === "PACKAGE" && p.categoryScope === activeTab),
    [products, activeTab]
  );

  const singleProducts = useMemo(
    () => products.filter((p) => p.categoryScope === "COMMON"),
    [products]
  );

  async function handlePurchase(productId: string) {
    if (!session) {
      router.push("/login");
      return;
    }

    setPurchasing(productId);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();

      if (res.ok) {
        const params = new URLSearchParams({
          orderId: data.orderId,
          amount: data.amount.toString(),
          orderName: data.orderName,
          customerName: session.user.name || "고객",
        });
        router.push(`/payments/checkout?${params.toString()}`);
      } else {
        alert(data.error || "구매 중 오류가 발생했습니다.");
        setPurchasing(null);
      }
    } catch {
      alert("구매 요청 중 오류가 발생했습니다.");
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
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          비즈니스를 성장시키는 프리미엄 서비스
        </h1>
        <p className="text-gray-600 text-lg">
          목적에 맞는 요금제를 선택하고 더 많은 고객에게 다가가세요
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-gray-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
        border: "border-blue-400",
        bg: "bg-gradient-to-br from-blue-50 to-white",
        badge: "추천",
        badgeBg: "bg-blue-500 text-white",
        btn: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
        ring: "ring-2 ring-blue-400 shadow-md",
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
  const featureList = buildFeatureList(features, product.categoryScope);

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
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-gray-900">
            {(product.price / 10000).toLocaleString()}
          </span>
          <span className="text-xl text-gray-600">만원</span>
        </div>
        {product.duration && (
          <p className="text-sm text-gray-500 mt-1">{product.duration}일 동안</p>
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
  scope: string
): { icon: string; text: string }[] {
  const list: { icon: string; text: string }[] = [];

  if (scope === "LISTING") {
    if (features.photos)
      list.push({ icon: "📸", text: features.photos >= 999 ? "사진 무제한" : `사진 ${features.photos}장` });
    if (features.video)
      list.push({ icon: "🎬", text: `동영상 ${features.video}개` });
    if (features.topExposure)
      list.push({ icon: "⭐", text: "상위 노출" });
    if (features.highlight)
      list.push({ icon: "✨", text: "하이라이트 강조" });
    if (features.mainRecommend)
      list.push({ icon: "🏠", text: "메인 추천매물 노출" });
    if (features.bumpCount)
      list.push({ icon: "🔥", text: `끌어올리기 ${features.bumpCount}회` });
    if (features.analytics)
      list.push({ icon: "📊", text: "조회수/관심수 통계" });
    if (features.matching)
      list.push({ icon: "🤝", text: "매수자 매칭 알림" });
    if (features.verified)
      list.push({ icon: "✅", text: "인증 배지" });
  } else if (scope === "FRANCHISE") {
    if (features.logoEdit)
      list.push({ icon: "🎨", text: "로고 편집" });
    if (features.introEdit)
      list.push({ icon: "📝", text: "본사 소개 편집" });
    if (features.topExposure)
      list.push({ icon: "⭐", text: "프랜차이즈 목록 상위노출" });
    if (features.recommend)
      list.push({ icon: "💡", text: "추천 프랜차이즈 연동" });
    if (features.inquirySystem)
      list.push({ icon: "📩", text: "문의접수 시스템" });
    if (features.mainBanner)
      list.push({ icon: "🖼️", text: "메인 배너 노출" });
    if (features.autoMatching)
      list.push({ icon: "🤝", text: "매물 자동매칭" });
    if (features.monthlyReport)
      list.push({ icon: "📊", text: "월간 리포트 (노출/문의/클릭)" });
  } else if (scope === "PARTNER") {
    if (features.photos)
      list.push({ icon: "📸", text: features.photos >= 999 ? "사진 무제한" : `사진 ${features.photos}장` });
    if (features.verified)
      list.push({ icon: "✅", text: "인증 배지" });
    if (features.topExposure)
      list.push({ icon: "⭐", text: "상위 노출" });
    if (features.portfolio)
      list.push({ icon: "📂", text: features.portfolio >= 999 ? "포트폴리오 무제한" : `포트폴리오 ${features.portfolio}건` });
    if (features.mainRecommend)
      list.push({ icon: "🏠", text: "추천업체 연동" });
  } else if (scope === "EQUIPMENT") {
    if (features.photos)
      list.push({ icon: "📸", text: features.photos >= 999 ? "사진 무제한" : `사진 ${features.photos}장` });
    if (features.topExposure)
      list.push({ icon: "⭐", text: "상위 노출" });
    if (features.highlight)
      list.push({ icon: "✨", text: "하이라이트 강조" });
    if (features.bumpCount)
      list.push({ icon: "🔥", text: `끌어올리기 ${features.bumpCount}회` });
    if (features.verified)
      list.push({ icon: "✅", text: "인증 배지" });
    if (features.analytics)
      list.push({ icon: "📊", text: "조회수/관심수 통계" });
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
    <div className="rounded-xl p-5 border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all">
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
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {purchasing ? "처리 중..." : "구매하기"}
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
