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

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { value: "createdAt", label: "최신순" },
  { value: "storeCount", label: "좋아요순" },
  { value: "startupCost", label: "창업비용낮은순" },
  { value: "monthlyAvgSales", label: "월매출높은순" },
];

export default function FranchisePage() {
  const [brands, setBrands] = useState<FranchiseBrand[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 12, totalPages: 0 });
  const [activeTab, setActiveTab] = useState<string>("외식");
  const [keyword, setKeyword] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBrands = (category: string, searchKeyword: string, sort: string, page: number) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("category", category);
    if (searchKeyword) params.set("keyword", searchKeyword);
    params.set("page", page.toString());
    params.set("limit", "12");
    params.set("sortBy", sort);

    fetch(`/api/franchise?${params}`)
      .then((res) => res.json())
      .then((json) => {
        setBrands(json.data || []);
        setMeta(json.meta || { total: 0, page: 1, limit: 12, totalPages: 0 });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBrands(activeTab, keyword, sortBy, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sortBy]);

  const handleSearch = () => {
    fetchBrands(activeTab, keyword, sortBy, 1);
  };

  const handlePageChange = (page: number) => {
    fetchBrands(activeTab, keyword, sortBy, page);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[#0B3B57]">프랜차이즈 정보</h1>
      <p className="mt-1 text-sm text-gray-500">브랜드별 매출, 창업비용, 가맹점 현황을 확인하세요</p>

      {/* Category Tabs */}
      <div className="mt-6 flex gap-2">
        {FRANCHISE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
              activeTab === cat
                ? "bg-[#2EC4B6] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search and Sort */}
      <div className="mt-6 flex gap-3">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="브랜드명 검색"
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-[#2EC4B6] px-6 py-2 text-sm font-medium text-white hover:bg-[#26aea2] transition"
          >
            검색
          </button>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
              <div
                key={brand.id}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-[#2EC4B6]">{brand.subcategory}</span>
                    <h3 className="mt-1 text-lg font-bold text-[#0B3B57]">{brand.brandName}</h3>
                  </div>
                  {brand.isPromoting && (
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                      프로모션
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {brand.monthlyAvgSales && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">월 평균매출</span>
                      <span className="ml-auto font-bold text-[#0B3B57]">
                        {formatKRW(Number(brand.monthlyAvgSales))}
                        {brand.dataYear && (
                          <span className="ml-1 text-xs font-normal text-gray-500">
                            ({brand.dataYear}년)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {brand.startupCost && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">창업비용</span>
                      <span className="ml-auto font-bold text-[#0B3B57]">
                        {formatKRW(Number(brand.startupCost))}
                      </span>
                    </div>
                  )}
                  {brand.storeCount && (
                    <div className="flex items-center gap-2 text-sm">
                      <Store className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-500">가맹+직영점</span>
                      <span className="ml-auto font-bold text-[#0B3B57]">
                        {brand.storeCount.toLocaleString()}개
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 0 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          {[...Array(meta.totalPages)].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  meta.page === pageNum
                    ? "bg-[#2EC4B6] text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page === meta.totalPages}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
