"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AdProduct {
  id: string;
  name: string;
  type: "PACKAGE" | "SINGLE";
  price: number;
  duration: number | null;
  features: Record<string, any>;
}

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<AdProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ad-products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
        // Redirect to payment page with order info
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
    } catch (error) {
      alert("구매 요청 중 오류가 발생했습니다.");
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const packageProducts = products.filter((p) => p.type === "PACKAGE");
  const singleProducts = products.filter((p) => p.type === "SINGLE");

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          내 매물을 더 많은 사람에게
        </h1>
        <p className="text-gray-600 text-lg">
          광고 상품으로 매물의 노출을 높이고 빠른 거래를 경험하세요
        </p>
      </div>

      {/* 패키지 상품 */}
      {packageProducts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">패키지 상품</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {packageProducts.map((product) => (
              <PackageCard
                key={product.id}
                product={product}
                onPurchase={handlePurchase}
                purchasing={purchasing === product.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* 단품 상품 */}
      {singleProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">단품 상품</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
}: {
  product: AdProduct;
  onPurchase: (id: string) => void;
  purchasing: boolean;
}) {
  const features = product.features as Record<string, any>;
  const isVip = product.name.includes("VIP");

  return (
    <div
      className={`relative rounded-2xl p-6 border-2 ${
        isVip
          ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-white shadow-lg"
          : "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
      }`}
    >
      {isVip && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
          BEST
        </div>
      )}

      <div className="text-center mb-6">
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

      <ul className="space-y-3 mb-6">
        {features.photos && (
          <Feature icon="📸" text={`사진 ${features.photos}장`} />
        )}
        {features.topExposure && <Feature icon="⭐" text="상단 고정 노출" />}
        {features.badge && <Feature icon="🏆" text={`${features.badge} 배지`} />}
        {features.bumps && (
          <Feature icon="🔥" text={`끌어올리기 ${features.bumps}회`} />
        )}
        {features.urgentTag && <Feature icon="⚡" text="급매 태그" />}
        {features.analytics && <Feature icon="📊" text="통계 분석" />}
        {features.support && <Feature icon="💬" text="우선 고객지원" />}
      </ul>

      <button
        onClick={() => onPurchase(product.id)}
        disabled={purchasing}
        className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
          isVip
            ? "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {purchasing ? "처리 중..." : "구매하기"}
      </button>
    </div>
  );
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
        <div className="text-3xl mb-2">{features.icon || "🎯"}</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {(product.price / 10000).toLocaleString()}
          </span>
          <span className="text-sm text-gray-600">만원</span>
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
