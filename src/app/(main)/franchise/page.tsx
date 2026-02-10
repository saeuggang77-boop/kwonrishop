"use client";

import { useState, useEffect } from "react";
import { Store, TrendingUp, DollarSign } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { FRANCHISE_CATEGORIES } from "@/lib/utils/constants";

interface FranchiseBrand {
  id: string;
  brandName: string;
  category: string;
  subcategory: string;
  monthlyAvgSales: string | null;
  startupCost: string | null;
  storeCount: number | null;
  dataYear: number | null;
  isPromoting: boolean;
}

export default function FranchisePage() {
  const [brands, setBrands] = useState<FranchiseBrand[]>([]);
  const [activeTab, setActiveTab] = useState<string>("외식");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/franchise?category=${activeTab}`)
      .then((res) => res.json())
      .then((json) => setBrands(json.data))
      .finally(() => setIsLoading(false));
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">프랜차이즈 정보</h1>
      <p className="mt-1 text-sm text-gray-500">브랜드별 매출, 창업비용, 가맹점 현황을 확인하세요</p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {FRANCHISE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
              activeTab === cat
                ? "bg-mint text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Brand Grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="py-20 text-center">
            <Store className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">등록된 프랜차이즈 브랜드가 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <div key={brand.id} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-mint">{brand.subcategory}</span>
                    <h3 className="mt-1 text-lg font-bold text-navy">{brand.brandName}</h3>
                  </div>
                  {brand.isPromoting && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">프로모션</span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {brand.monthlyAvgSales && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">월 평균매출</span>
                      <span className="ml-auto font-bold text-navy">
                        {formatKRW(Number(brand.monthlyAvgSales))}
                        {brand.dataYear && <span className="ml-1 text-xs font-normal text-gray-400">({brand.dataYear}년)</span>}
                      </span>
                    </div>
                  )}
                  {brand.startupCost && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">창업비용</span>
                      <span className="ml-auto font-bold text-navy">{formatKRW(Number(brand.startupCost))}</span>
                    </div>
                  )}
                  {brand.storeCount && (
                    <div className="flex items-center gap-2 text-sm">
                      <Store className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">가맹+직영점</span>
                      <span className="ml-auto font-bold text-navy">{brand.storeCount.toLocaleString()}개</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
