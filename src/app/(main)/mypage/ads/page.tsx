"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdPurchase {
  id: string;
  status: string;
  amount: number;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    type: string;
    price: number;
    duration: number | null;
    categoryScope: string;
  };
  listing: { id: string; storeName: string | null; addressRoad: string | null } | null;
  equipment: { id: string; title: string } | null;
  partnerService: { id: string; companyName: string } | null;
}

const SCOPE_LABELS: Record<string, string> = {
  LISTING: "매물",
  FRANCHISE: "프랜차이즈",
  PARTNER: "협력업체",
  EQUIPMENT: "집기장터",
  COMMON: "공통",
};

export default function MyAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [active, setActive] = useState<AdPurchase[]>([]);
  const [expired, setExpired] = useState<AdPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mypage/ads");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/mypage/ads")
        .then((r) => r.json())
        .then((data) => {
          setActive(data.active || []);
          setExpired(data.expired || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/mypage" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">광고 관리</h1>
      </div>

      {/* 새 광고 구매 */}
      <div className="bg-green-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-700 mb-2">
          광고 상품으로 매물의 노출을 높이고 빠른 거래를 경험하세요
        </p>
        <Link
          href="/pricing"
          className="inline-block px-4 py-2 bg-green-700 text-white text-sm rounded-lg font-medium hover:bg-green-600"
        >
          광고 상품 보기
        </Link>
      </div>

      {/* 활성 광고 */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          활성 광고 <span className="text-green-700">{active.length}</span>
        </h2>
        {active.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-400">활성 광고가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((ad) => (
              <AdCard key={ad.id} ad={ad} isActive />
            ))}
          </div>
        )}
      </section>

      {/* 만료된 광고 */}
      {expired.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            만료된 광고 <span className="text-gray-400">{expired.length}</span>
          </h2>
          <div className="space-y-3">
            {expired.map((ad) => (
              <AdCard key={ad.id} ad={ad} isActive={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AdCard({ ad, isActive }: { ad: AdPurchase; isActive: boolean }) {
  const targetName = ad.listing?.storeName || ad.listing?.addressRoad || ad.equipment?.title || ad.partnerService?.companyName || "-";
  const scopeLabel = SCOPE_LABELS[ad.product.categoryScope] || ad.product.categoryScope;

  // 남은 일수 계산
  const daysLeft = ad.expiresAt
    ? Math.max(0, Math.ceil((new Date(ad.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // 갱신용 pricing 링크
  const renewParams = new URLSearchParams();
  if (ad.listing) renewParams.set("listingId", ad.listing.id);
  if (ad.equipment) renewParams.set("equipmentId", ad.equipment.id);
  if (ad.partnerService) renewParams.set("partnerServiceId", ad.partnerService.id);

  return (
    <div className={`bg-white rounded-xl border p-4 ${isActive ? "border-green-200" : "border-gray-200 opacity-70"}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
              isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {isActive ? "활성" : "만료"}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
              {scopeLabel}
            </span>
          </div>
          <h3 className="font-bold text-gray-900">{ad.product.name}</h3>
          <p className="text-sm text-gray-500">{targetName}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold text-gray-900">{ad.amount.toLocaleString()}원</p>
          <p className="text-xs text-gray-400">(VAT 별도)</p>
          {isActive && daysLeft !== null && (
            <p className={`text-xs ${daysLeft <= 3 ? "text-red-500 font-medium" : "text-gray-400"}`}>
              {daysLeft === 0 ? "오늘 만료" : `${daysLeft}일 남음`}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
        <span>
          {ad.activatedAt
            ? `${new Date(ad.activatedAt).toLocaleDateString("ko-KR")} ~ ${ad.expiresAt ? new Date(ad.expiresAt).toLocaleDateString("ko-KR") : ""}`
            : new Date(ad.createdAt).toLocaleDateString("ko-KR")}
        </span>
        {!isActive && (
          <Link
            href={`/pricing?${renewParams.toString()}`}
            className="px-3 py-1 bg-green-700 text-white rounded text-xs font-medium hover:bg-green-600"
          >
            재구매
          </Link>
        )}
        {isActive && daysLeft !== null && daysLeft <= 7 && (
          <Link
            href={`/pricing?${renewParams.toString()}`}
            className="px-3 py-1 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600"
          >
            연장하기
          </Link>
        )}
      </div>
    </div>
  );
}
