"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, TrendingUp, DollarSign, Store, ChevronDown, ArrowRight } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";

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

// 업종별 아바타 컬러
const AVATAR_COLORS: Record<string, string> = {
  커피: "bg-amber-800 text-amber-100",
  치킨: "bg-orange-600 text-orange-100",
  한식: "bg-red-700 text-red-100",
  양식: "bg-rose-700 text-rose-100",
  피자: "bg-yellow-600 text-yellow-100",
  분식: "bg-pink-600 text-pink-100",
  패스트푸드: "bg-orange-500 text-orange-100",
  도시락: "bg-red-600 text-red-100",
  편의점: "bg-blue-700 text-blue-100",
  화장품: "bg-pink-500 text-pink-100",
  세탁: "bg-purple-600 text-purple-100",
  기타: "bg-gray-600 text-gray-100",
};

function getAvatarColor(subcategory: string) {
  return AVATAR_COLORS[subcategory] ?? "bg-navy text-white";
}

// 카테고리 탭
const CATEGORY_TABS = [
  { value: "", label: "전체" },
  { value: "외식", label: "외식" },
  { value: "도소매", label: "도소매" },
  { value: "서비스", label: "서비스" },
];

// 정렬 옵션
const SORT_OPTIONS = [
  { value: "createdAt", label: "최신순" },
  { value: "monthlyAvgSales", label: "매출높은순" },
  { value: "startupCost", label: "창업비용낮은순" },
  { value: "storeCount", label: "가맹점많은순" },
];

// 필터 설정
const SUBCATEGORY_OPTIONS = ["전체", "커피", "치킨", "한식", "양식", "피자", "분식", "패스트푸드", "편의점", "세탁", "기타"];
const SALES_RANGES = [
  { label: "전체", min: "", max: "" },
  { label: "1000만원 이하", min: "", max: "10000000" },
  { label: "1000~3000만원", min: "10000000", max: "30000000" },
  { label: "3000~5000만원", min: "30000000", max: "50000000" },
  { label: "5000만원~1억", min: "50000000", max: "100000000" },
  { label: "1억 이상", min: "100000000", max: "" },
];
const COST_RANGES = [
  { label: "전체", min: "", max: "" },
  { label: "3000만원 이하", min: "", max: "30000000" },
  { label: "3000~5000만원", min: "30000000", max: "50000000" },
  { label: "5000만원~1억", min: "50000000", max: "100000000" },
  { label: "1억~2억", min: "100000000", max: "200000000" },
  { label: "2억 이상", min: "200000000", max: "" },
];
const STORE_COUNT_RANGES = [
  { label: "전체", min: "", max: "" },
  { label: "10개 이하", min: "", max: "10" },
  { label: "10~100개", min: "10", max: "100" },
  { label: "100~500개", min: "100", max: "500" },
  { label: "500~1000개", min: "500", max: "1000" },
  { label: "1000개 이상", min: "1000", max: "" },
];

function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { label: string; value?: string; min?: string; max?: string }[];
  selected: number;
  onSelect: (idx: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition ${
          selected > 0
            ? "border-navy bg-navy/5 text-navy"
            : "border-gray-300 text-gray-600 hover:bg-gray-50"
        }`}
      >
        {label}
        {selected > 0 && <span className="text-xs">({options[selected].label})</span>}
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { onSelect(i); setOpen(false); }}
              className={`w-full px-4 py-2 text-left text-sm transition ${
                selected === i ? "bg-navy/5 font-semibold text-navy" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FranchisePage() {
  const [brands, setBrands] = useState<FranchiseBrand[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 12, totalPages: 0 });
  const [activeTab, setActiveTab] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [isLoading, setIsLoading] = useState(true);

  // Filter indices
  const [subcatIdx, setSubcatIdx] = useState(0);
  const [salesIdx, setSalesIdx] = useState(0);
  const [costIdx, setCostIdx] = useState(0);
  const [storeIdx, setStoreIdx] = useState(0);

  const fetchBrands = (page: number) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (activeTab) params.set("category", activeTab);
    if (keyword) params.set("keyword", keyword);
    if (subcatIdx > 0) params.set("keyword", SUBCATEGORY_OPTIONS[subcatIdx]);
    params.set("page", page.toString());
    params.set("limit", "12");
    params.set("sortBy", sortBy);

    const sales = SALES_RANGES[salesIdx];
    if (sales.min) params.set("salesMin", sales.min);
    if (sales.max) params.set("salesMax", sales.max);
    const cost = COST_RANGES[costIdx];
    if (cost.min) params.set("costMin", cost.min);
    if (cost.max) params.set("costMax", cost.max);
    const store = STORE_COUNT_RANGES[storeIdx];
    if (store.min) params.set("storeCountMin", store.min);
    if (store.max) params.set("storeCountMax", store.max);

    fetch(`/api/franchise?${params}`)
      .then((res) => res.json())
      .then((json) => {
        setBrands(json.data || []);
        setMeta(json.meta || { total: 0, page: 1, limit: 12, totalPages: 0 });
      })
      .catch(() => {
        setBrands([]);
        setMeta({ total: 0, page: 1, limit: 12, totalPages: 0 });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchBrands(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sortBy, subcatIdx, salesIdx, costIdx, storeIdx]);

  const handleSearch = () => fetchBrands(1);
  const handlePageChange = (page: number) => fetchBrands(page);

  const resetFilters = () => {
    setSubcatIdx(0);
    setSalesIdx(0);
    setCostIdx(0);
    setStoreIdx(0);
    setKeyword("");
    setActiveTab("");
    setSortBy("createdAt");
  };

  const hasFilters = subcatIdx > 0 || salesIdx > 0 || costIdx > 0 || storeIdx > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">프랜차이즈 정보</h1>
      <p className="mt-1 text-sm text-gray-500">
        브랜드별 매출, 창업비용, 가맹점 현황을 비교하세요
      </p>

      {/* Category Tabs */}
      <div className="mt-6 flex gap-2">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveTab(cat.value)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition ${
              activeTab === cat.value
                ? "bg-navy text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="브랜드명 검색"
            aria-label="브랜드명 검색"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white transition hover:bg-navy/90"
        >
          검색
        </button>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="업종"
          options={SUBCATEGORY_OPTIONS.map((s) => ({ label: s }))}
          selected={subcatIdx}
          onSelect={setSubcatIdx}
        />
        <FilterDropdown
          label="월 평균 매출액"
          options={SALES_RANGES}
          selected={salesIdx}
          onSelect={setSalesIdx}
        />
        <FilterDropdown
          label="창업비용"
          options={COST_RANGES}
          selected={costIdx}
          onSelect={setCostIdx}
        />
        <FilterDropdown
          label="가맹점 수"
          options={STORE_COUNT_RANGES}
          selected={storeIdx}
          onSelect={setStoreIdx}
        />

        <div className="ml-auto flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-gray-500 hover:text-navy"
            >
              필터 초기화
            </button>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="정렬 기준"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Count */}
      <p className="mt-4 text-sm text-gray-500">
        총 <span className="font-bold text-navy">{meta.total}</span>개 브랜드
      </p>

      {/* Brand Grid */}
      <div className="mt-4">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="py-20 text-center">
            <Store className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">조건에 맞는 프랜차이즈 브랜드가 없습니다</p>
            {hasFilters && (
              <button onClick={resetFilters} className="mt-2 text-sm font-medium text-navy hover:underline">
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/franchise/${brand.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${getAvatarColor(brand.subcategory)}`}
                  >
                    {brand.brandName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${getSubcategoryBadge(brand.subcategory)}`}>
                        {brand.subcategory}
                      </span>
                      {brand.isPromoting && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-600">
                          프로모션
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 truncate text-lg font-bold text-navy group-hover:text-navy/80">
                      {brand.brandName}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {brand.monthlyAvgSales && (
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="text-gray-500">월 평균매출</span>
                      <span className="ml-auto font-bold text-navy">
                        {formatKRW(Number(brand.monthlyAvgSales))}
                      </span>
                      {brand.dataYear && (
                        <span className="text-[11px] text-gray-400">({brand.dataYear})</span>
                      )}
                    </div>
                  )}
                  {brand.startupCost && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="text-gray-500">창업비용</span>
                      <span className="ml-auto font-bold text-navy">
                        {formatKRW(Number(brand.startupCost))}
                      </span>
                    </div>
                  )}
                  {brand.storeCount != null && (
                    <div className="flex items-center gap-2 text-sm">
                      <Store className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="text-gray-500">가맹+직영점</span>
                      <span className="ml-auto font-bold text-navy">
                        {brand.storeCount.toLocaleString()}개
                      </span>
                    </div>
                  )}
                </div>

                <p className="mt-3 border-t border-gray-100 pt-2 text-[11px] text-gray-400">
                  정보공개서 기준 데이터입니다
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                    ? "bg-navy text-white"
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
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}

      {/* Bottom CTA Banner */}
      <div className="mt-16 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-navy/5 via-white to-navy/5">
        <div className="px-8 py-10 text-center">
          <p className="text-sm font-medium text-navy/60">FOR FRANCHISE HQ</p>
          <h2 className="mt-2 text-2xl font-bold text-navy">
            프랜차이즈 본사 관계자이신가요?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-gray-600">
            지금 가입하시면 브랜드 로고, 상세 소개, 창업 프로모션을 직접 등록할 수 있습니다.
            <br />
            예비 창업자에게 브랜드를 효과적으로 알려보세요.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy px-8 py-3 text-sm font-bold text-white transition hover:bg-navy/90"
          >
            본사 가입하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function getSubcategoryBadge(subcategory: string): string {
  const map: Record<string, string> = {
    커피: "bg-amber-100 text-amber-800",
    치킨: "bg-orange-100 text-orange-800",
    한식: "bg-red-100 text-red-800",
    양식: "bg-rose-100 text-rose-800",
    피자: "bg-yellow-100 text-yellow-800",
    분식: "bg-pink-100 text-pink-800",
    패스트푸드: "bg-orange-50 text-orange-700",
    도시락: "bg-red-50 text-red-700",
    편의점: "bg-blue-100 text-blue-800",
    화장품: "bg-pink-50 text-pink-700",
    세탁: "bg-purple-100 text-purple-800",
  };
  return map[subcategory] ?? "bg-gray-100 text-gray-700";
}
