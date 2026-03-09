"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface FranchiseBrand {
  id: string;
  brandName: string;
  companyName: string;
  industry: string;
  franchiseFee: number | null;
  educationFee: number | null;
  depositFee: number | null;
  totalStores: number | null;
  avgRevenue: number | null;
  tier: "GOLD" | "SILVER" | "BRONZE" | null;
  ftcId: string | null;
  ftcRawData: any;
}

const INDUSTRIES = [
  { value: "", label: "전체" },
  { value: "FOOD", label: "음식점" },
  { value: "CAFE", label: "카페" },
  { value: "RETAIL", label: "소매점" },
  { value: "SERVICE", label: "서비스" },
  { value: "EDUCATION", label: "교육" },
  { value: "OTHER", label: "기타" },
];

export default function FranchisePage() {
  const router = useRouter();
  const [brands, setBrands] = useState<FranchiseBrand[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (industry) params.set("industry", industry);
    if (keyword) params.set("keyword", keyword);

    const res = await fetch(`/api/franchise?${params}`);
    const data = await res.json();
    setBrands(data.brands || []);
    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, industry, keyword]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchBrands();
  }

  function handleIndustryClick(value: string) {
    setIndustry(value);
    setPage(1);
  }

  const getTierBadge = (tier: FranchiseBrand["tier"]) => {
    if (!tier) return null;
    const colors = {
      GOLD: "bg-yellow-100 text-yellow-800",
      SILVER: "bg-gray-100 text-gray-800",
      BRONZE: "bg-orange-100 text-orange-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier]}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">프랜차이즈 브랜드</h1>
        <p className="text-gray-600">검증된 프랜차이즈 브랜드를 만나보세요</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="브랜드명, 업종 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            검색
          </button>
        </div>
      </form>

      {/* Industry Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {INDUSTRIES.map((ind) => (
          <button
            key={ind.value}
            onClick={() => handleIndustryClick(ind.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              industry === ind.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {ind.label}
          </button>
        ))}
      </div>

      {/* Result Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{total.toLocaleString()}</span>개 브랜드
        </p>
      </div>

      {/* Brand Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">등록된 브랜드가 없습니다</p>
          <p className="text-sm">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              onClick={() => router.push(`/franchise/${brand.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {brand.brandName.charAt(0)}
                </div>
                <div className="flex gap-2">
                  {brand.ftcId && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      공정위 등록
                    </span>
                  )}
                  {getTierBadge(brand.tier)}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{brand.brandName}</h3>
              <p className="text-sm text-gray-600 mb-4">{brand.companyName}</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">업종</span>
                  <span className="font-medium text-gray-900">{brand.industry}</span>
                </div>
                {brand.franchiseFee !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">가맹비</span>
                    <span className="font-medium text-gray-900">
                      {brand.franchiseFee.toLocaleString()}만원
                    </span>
                  </div>
                )}
                {brand.totalStores !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">매장수</span>
                    <span className="font-medium text-gray-900">
                      {brand.totalStores.toLocaleString()}개
                    </span>
                  </div>
                )}
                {brand.avgRevenue !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">평균 매출</span>
                    <span className="font-medium text-gray-900">
                      {brand.avgRevenue.toLocaleString()}만원
                    </span>
                  </div>
                )}
              </div>

              {brand.ftcRawData && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert("공정위 정보공개서 보기 기능은 상세페이지에서 확인할 수 있습니다");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    📋 공정위 정보 보기
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
