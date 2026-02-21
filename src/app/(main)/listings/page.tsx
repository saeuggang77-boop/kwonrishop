"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, MapPin, X, ChevronDown, Map as MapIcon, Store, Loader2, ShieldCheck, List,
} from "lucide-react";
import { ListingCard as ListingCardComponent } from "@/components/listings/listing-card";
import { useDebounce } from "@/hooks/use-debounce";
import dynamic from "next/dynamic";
const ListingsMap = dynamic(() => import("@/components/listings/listings-map").then(m => m.ListingsMap), { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1B3A5C]" /></div> });
import type { MapBounds } from "@/components/listings/listings-map";
import {
  BUSINESS_CATEGORY_LABELS,
  BUSINESS_CATEGORY_GROUPS,
  BUSINESS_SUBCATEGORIES,
  FLOOR_OPTIONS,
  AREA_OPTIONS,
  STORE_FEATURES,
  REGION_DATA,
  MONTHLY_PROFIT_OPTIONS,
} from "@/lib/utils/constants";

/* ================================================================
   Types
   ================================================================ */

interface ListingItem {
  id: string;
  title: string;
  businessCategory: string;
  businessSubtype: string | null;
  storeType: string;
  price: string;
  monthlyRent: string | null;
  premiumFee: string | null;
  managementFee: string | null;
  monthlyRevenue: string | null;
  monthlyProfit: string | null;
  city: string;
  district: string;
  neighborhood: string | null;
  areaM2: number | null;
  areaPyeong: number | null;
  floor: number | null;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  images: { url: string; thumbnailUrl: string | null }[];
  seller: { name: string | null; image: string | null; isTrustedSeller?: boolean };
  safetyGrade: string | null;
  isPremium: boolean;
  premiumRank: number;
  hasDiagnosisBadge: boolean;
  latitude?: number | null;
  longitude?: number | null;
  isJumpUp?: boolean;
  urgentTag?: { active: boolean; reason: string | null } | null;
}

type TabType = "direct" | "franchise";
type FilterKey = "region" | "category" | "revenue" | "theme" | "price" | "profit" | "floor" | "area";


const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "최신등록순" },
  { value: "safetyGrade-asc", label: "신뢰도높은순" },
  { value: "premiumFee-asc", label: "권리금낮은순" },
  { value: "premiumFee-desc", label: "권리금높은순" },
  { value: "monthlyProfit-desc", label: "월순익높은순" },
  { value: "monthlyRevenue-desc", label: "월매출높은순" },
  { value: "areaPyeong-desc", label: "면적순" },
] as const;

const TOTAL_COST_OPTIONS = [
  { label: "전체", min: "", max: "" },
  { label: "3천만 이하", min: "", max: "300000000" },
  { label: "3천~5천만", min: "300000000", max: "500000000" },
  { label: "5천~1억", min: "500000000", max: "1000000000" },
  { label: "1억~2억", min: "1000000000", max: "2000000000" },
  { label: "2억~3억", min: "2000000000", max: "3000000000" },
  { label: "3억 이상", min: "3000000000", max: "" },
];

const THEME_OPTIONS = [
  { label: "무권리", storeType: "" },
  { label: "프랜차이즈", storeType: "FRANCHISE" },
  { label: "사무실", storeType: "OFFICE" },
];

/* ================================================================
   Main Page
   ================================================================ */

export default function ListingsPage() {
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("direct");
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  const [diagnosisOnly, setDiagnosisOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);

  // Lock body scroll & hide footer for full-screen layout
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const footer = document.querySelector("footer");
    const main = document.querySelector("main");
    if (footer) (footer as HTMLElement).style.display = "none";
    if (main) (main as HTMLElement).style.paddingBottom = "0";

    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      if (footer) (footer as HTMLElement).style.display = "";
      if (main) (main as HTMLElement).style.paddingBottom = "";
    };
  }, []);

  const [filters, setFilters] = useState({
    query: searchParams.get("query") ?? "",
    businessCategory: searchParams.get("businessCategory") ?? "",
    businessSubtype: searchParams.get("businessSubtype") ?? "",
    storeType: searchParams.get("storeType") ?? "",
    city: "",
    district: "",
    totalCostMin: "",
    totalCostMax: "",
    monthlyProfitMin: "",
    monthlyProfitMax: "",
    floor: "",
    areaMin: "",
    areaMax: "",
    theme: "",
    revenueVerified: false,
    trustedOnly: false,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const debouncedBounds = useDebounce(mapBounds, 500);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);

  const mapFilters = useMemo(() => ({
    businessCategory: filters.businessCategory,
    businessSubtype: filters.businessSubtype,
    storeType: activeTab === "franchise" ? "FRANCHISE" : filters.storeType,
    city: filters.city,
    district: filters.district,
    trustedOnly: filters.trustedOnly,
    diagnosisOnly,
    premiumFeeMax: filters.theme === "무권리" ? "0" : undefined,
    monthlyProfitMin: filters.monthlyProfitMin || undefined,
    monthlyProfitMax: filters.monthlyProfitMax || undefined,
    totalCostMin: filters.totalCostMin || undefined,
    totalCostMax: filters.totalCostMax || undefined,
  }), [filters, activeTab, diagnosisOnly]);

  /* ---- Fetch ---- */
  const fetchListings = useCallback(
    async (reset = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.query) params.set("query", filters.query);
      if (filters.businessCategory) params.set("businessCategory", filters.businessCategory);
      if (filters.businessSubtype) params.set("businessSubtype", filters.businessSubtype);
      if (filters.storeType) params.set("storeType", filters.storeType);
      if (filters.city) params.set("city", filters.city);
      if (filters.district) params.set("district", filters.district);
      if (filters.totalCostMin) params.set("totalCostMin", filters.totalCostMin);
      if (filters.totalCostMax) params.set("totalCostMax", filters.totalCostMax);
      if (filters.monthlyProfitMin) params.set("monthlyProfitMin", filters.monthlyProfitMin);
      if (filters.monthlyProfitMax) params.set("monthlyProfitMax", filters.monthlyProfitMax);
      if (filters.theme === "무권리") params.set("premiumFeeMax", "0");
      if (filters.floor) params.set("floor", filters.floor);
      if (filters.areaMin) params.set("areaMin", filters.areaMin);
      if (filters.areaMax) params.set("areaMax", filters.areaMax);
      if (activeTab === "franchise") params.set("storeType", "FRANCHISE");
      if (filters.trustedOnly) params.set("trustedOnly", "true");
      if (diagnosisOnly) params.set("diagnosisOnly", "true");
      if (urgentOnly) params.set("urgentOnly", "true");
      params.set("sortBy", filters.sortBy);
      params.set("sortOrder", filters.sortOrder);
      params.set("limit", "12");
      if (debouncedBounds) {
        params.set("swLat", String(debouncedBounds.swLat));
        params.set("swLng", String(debouncedBounds.swLng));
        params.set("neLat", String(debouncedBounds.neLat));
        params.set("neLng", String(debouncedBounds.neLng));
      }
      if (!reset && cursor) params.set("cursor", cursor);

      try {
        const res = await fetch(`/api/listings?${params}`, { signal: controller.signal });
        const json = await res.json();
        if (reset) {
          setListings(json.data ?? []);
        } else {
          setListings((prev) => [...prev, ...(json.data ?? [])]);
        }
        setCursor(json.meta?.cursor);
        setHasMore(json.meta?.hasMore ?? false);
        setTotalCount(json.meta?.total ?? json.data?.length ?? 0);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (reset) setListings([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    },
    [filters, cursor, activeTab, diagnosisOnly, urgentOnly, debouncedBounds]
  );

  useEffect(() => {
    setCursor(undefined);
    fetchListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.businessCategory, filters.businessSubtype, filters.storeType, filters.city, filters.district,
    filters.totalCostMin, filters.totalCostMax, filters.monthlyProfitMin, filters.monthlyProfitMax, filters.floor,
    filters.areaMin, filters.areaMax, filters.sortBy, filters.sortOrder,
    filters.revenueVerified, filters.trustedOnly, activeTab, diagnosisOnly, urgentOnly,
    debouncedBounds,
  ]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchListings(false); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCursor(undefined);
    fetchListings(true);
  };

  const handleReset = () => {
    setFilters({
      query: "", businessCategory: "", businessSubtype: "", storeType: "",
      city: "", district: "", totalCostMin: "", totalCostMax: "",
      monthlyProfitMin: "", monthlyProfitMax: "",
      floor: "", areaMin: "", areaMax: "", theme: "",
      revenueVerified: false, trustedOnly: false, sortBy: "createdAt", sortOrder: "desc",
    });
    setDiagnosisOnly(false);
    setUrgentOnly(false);
    setOpenFilter(null);
  };

  const toggleFilter = (key: FilterKey) => {
    setOpenFilter((prev) => (prev === key ? null : key));
  };

  // Close dropdown when clicking outside (ref-based, mousedown for reliable timing)
  const filterAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openFilter) return;
    const handler = (e: MouseEvent) => {
      if (filterAreaRef.current && !filterAreaRef.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openFilter]);

  /* ---- Filter badge counts ---- */
  const categoryCount = (filters.businessCategory || filters.businessSubtype) ? 1 : 0;
  const revenueCount = filters.revenueVerified ? 1 : 0;
  const themeCount = filters.theme ? 1 : 0;
  const priceCount = filters.totalCostMin || filters.totalCostMax ? 1 : 0;
  const floorCount = filters.floor ? 1 : 0;
  const areaCount = filters.areaMin || filters.areaMax ? 1 : 0;
  const regionCount = filters.city ? 1 : 0;
  const profitCount = (filters.monthlyProfitMin || filters.monthlyProfitMax) ? 1 : 0;
  const hasActiveFilters = categoryCount + revenueCount + themeCount + priceCount + profitCount + floorCount + areaCount + regionCount > 0 || filters.trustedOnly || diagnosisOnly || urgentOnly;

  return (
    <div className="flex h-[calc(100dvh-57px)] flex-col overflow-hidden">
      {/* ======== Top Bar ======== */}
      <div className="shrink-0 border-b border-gray-200 bg-white">
        {/* Tabs */}
        <div className="mx-auto flex max-w-screen-2xl border-b border-gray-100 px-4">
          <button
            onClick={() => setActiveTab("direct")}
            className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "direct" ? "text-[#1B3A5C]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            직거래 매물 보기
            {activeTab === "direct" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3A5C]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("franchise")}
            className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
              activeTab === "franchise" ? "text-[#1B3A5C]" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            프랜차이즈 매물
            {activeTab === "franchise" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B3A5C]" />
            )}
          </button>
        </div>

        {/* Search + Filters */}
        <div className="mx-auto max-w-screen-2xl px-4 py-3">
          {/* Search row */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                aria-label="매물 검색"
                placeholder="지역, 상호명을 입력해 주세요"
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1B3A5C] focus:ring-1 focus:ring-[#1B3A5C]"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-[#1B3A5C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15304D]"
            >
              검색
            </button>
          </form>

          {/* Filter buttons row + dropdown */}
          <div ref={filterAreaRef}>
            <div className="mt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <FilterButton label={filters.city ? `지역: ${filters.city}${filters.district ? ` ${filters.district}` : ""}` : "지역"} count={regionCount} isOpen={openFilter === "region"} onClick={() => toggleFilter("region")} />
              <FilterButton label="업종" count={categoryCount} isOpen={openFilter === "category"} onClick={() => toggleFilter("category")} />
              <FilterButton label="매출증빙" count={revenueCount} isOpen={openFilter === "revenue"} onClick={() => toggleFilter("revenue")} />
              <FilterButton label="테마" count={themeCount} isOpen={openFilter === "theme"} onClick={() => toggleFilter("theme")} />
              <FilterButton label="금액" count={priceCount} isOpen={openFilter === "price"} onClick={() => toggleFilter("price")} />
              <FilterButton label={filters.monthlyProfitMin || filters.monthlyProfitMax ? `수익: ${MONTHLY_PROFIT_OPTIONS.find(o => o.min === filters.monthlyProfitMin && o.max === filters.monthlyProfitMax)?.label ?? "선택됨"}` : "수익"} count={profitCount} isOpen={openFilter === "profit"} onClick={() => toggleFilter("profit")} />
              <FilterButton label="층수" count={floorCount} isOpen={openFilter === "floor"} onClick={() => toggleFilter("floor")} />
              <FilterButton label="면적" count={areaCount} isOpen={openFilter === "area"} onClick={() => toggleFilter("area")} />

              <div className="mx-1 h-5 w-px bg-gray-200" />

              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  setFilters((f) => ({ ...f, sortBy, sortOrder }));
                }}
                aria-label="정렬 기준"
                className="shrink-0 appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-gray-600 outline-none focus:border-[#1B3A5C]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100">
                <input
                  type="checkbox"
                  checked={filters.trustedOnly}
                  onChange={(e) => setFilters((f) => ({ ...f, trustedOnly: e.target.checked }))}
                  className="h-3.5 w-3.5 rounded border-blue-300 accent-blue-600"
                />
                <ShieldCheck className="h-3.5 w-3.5" />
                안심거래 매물만
              </label>

              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100">
                <input
                  type="checkbox"
                  checked={diagnosisOnly}
                  onChange={(e) => setDiagnosisOnly(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-emerald-300 accent-emerald-600"
                />
                권리진단 완료 매물만
              </label>

              <button
                onClick={() => setUrgentOnly(!urgentOnly)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  urgentOnly
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-red-300"
                }`}
              >
                🔥 급매만
              </button>

              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                  초기화
                </button>
              )}
            </div>

            {/* Filter dropdowns */}
            {openFilter && (
              <div className="relative mt-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
                {openFilter === "region" && (
                  <RegionFilterDropdown
                    city={filters.city}
                    district={filters.district}
                    onChange={(city, district) => setFilters((f) => ({ ...f, city, district }))}
                  />
                )}
                {openFilter === "category" && (
                  <CategoryFilterDropdown
                    value={filters.businessCategory}
                    subtype={filters.businessSubtype}
                    onChange={(cat, sub) => setFilters((f) => ({ ...f, businessCategory: cat, businessSubtype: sub }))}
                  />
                )}
                {openFilter === "revenue" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">매출증빙 여부</p>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={filters.revenueVerified}
                        onChange={(e) => setFilters((f) => ({ ...f, revenueVerified: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 accent-[#1B3A5C]"
                      />
                      매출증빙 완료 매물만 보기 (안전등급 A)
                    </label>
                  </div>
                )}
                {openFilter === "theme" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">테마</p>
                    <div className="flex flex-wrap gap-2">
                      {THEME_OPTIONS.map((t) => (
                        <button
                          key={t.label}
                          onClick={() => {
                            const isActive = filters.theme === t.label;
                            setFilters((f) => ({
                              ...f,
                              theme: isActive ? "" : t.label,
                              storeType: isActive ? "" : t.storeType,
                            }));
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                            filters.theme === t.label
                              ? "border-[#1B3A5C] bg-[#1B3A5C]/10 text-[#1B3A5C]"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                      {STORE_FEATURES.map((feat) => (
                        <button
                          key={feat}
                          onClick={() => {
                            setFilters((f) => ({ ...f, theme: f.theme === feat ? "" : feat }));
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                            filters.theme === feat
                              ? "border-[#1B3A5C] bg-[#1B3A5C]/10 text-[#1B3A5C]"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {feat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {openFilter === "price" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">총 창업비용(보증금+권리금)</p>
                    <div className="flex flex-wrap gap-2">
                      {TOTAL_COST_OPTIONS.map((opt) => {
                        const isActive = filters.totalCostMin === opt.min && filters.totalCostMax === opt.max;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => setFilters((f) => ({
                              ...f,
                              totalCostMin: isActive ? "" : opt.min,
                              totalCostMax: isActive ? "" : opt.max,
                            }))}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                              isActive
                                ? "border-[#1B3A5C] bg-[#1B3A5C]/10 text-[#1B3A5C]"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {openFilter === "profit" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">월수익</p>
                    <div className="flex flex-wrap gap-2">
                      {MONTHLY_PROFIT_OPTIONS.map((opt) => {
                        const isActive = filters.monthlyProfitMin === opt.min && filters.monthlyProfitMax === opt.max;
                        return (
                          <button
                            key={opt.label}
                            onClick={() => setFilters((f) => ({
                              ...f,
                              monthlyProfitMin: isActive ? "" : opt.min,
                              monthlyProfitMax: isActive ? "" : opt.max,
                            }))}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                              isActive
                                ? "border-[#1B3A5C] bg-[#1B3A5C]/10 text-[#1B3A5C]"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {openFilter === "floor" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">층수</p>
                    <div className="flex flex-wrap gap-2">
                      {FLOOR_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFilters((f) => ({ ...f, floor: f.floor === opt.value ? "" : opt.value }))}
                          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                            filters.floor === opt.value
                              ? "border-[#1B3A5C] bg-[#1B3A5C]/10 text-[#1B3A5C]"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {openFilter === "area" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">면적</p>
                    <div className="flex flex-wrap gap-2">
                      {AREA_OPTIONS.map((opt) => {
                        const isActive = filters.areaMin === String(opt.min) && filters.areaMax === String(opt.max);
                        return (
                          <button
                            key={opt.label}
                            onClick={() => setFilters((f) => ({
                              ...f,
                              areaMin: isActive ? "" : String(opt.min),
                              areaMax: isActive ? "" : String(opt.max),
                            }))}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                              isActive
                                ? "border-[#1B3A5C] bg-[#1B3A5C]/10 text-[#1B3A5C]"
                                : "border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ======== Main content: List + Map ======== */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Listing list */}
        <div className={`${mobileView === "map" ? "hidden" : "flex-1"} overflow-y-auto md:block md:w-[60%] md:flex-none`}>
          <div className="px-4 py-3">
            {/* Count */}
            <p className="mb-3 text-sm text-gray-500">
              총 <span className="font-semibold text-[#1B3A5C]">{totalCount > 0 ? totalCount : listings.length}</span>건
            </p>

            {/* Loading skeleton */}
            {isLoading && listings.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4">
                    <div className="h-36 w-36 shrink-0 animate-pulse rounded-lg bg-gray-200 sm:h-44 sm:w-44" />
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                      <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="py-20 text-center">
                <Store className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-lg font-medium text-gray-500">매물이 없습니다</p>
                <p className="mt-1 text-sm text-gray-400">검색 조건을 변경해보세요.</p>
              </div>
            ) : (
              <>
                {/* Premium listings */}
                {(() => {
                  const premium = listings.filter((l) => l.isPremium && l.premiumRank > 0);
                  const normal = listings.filter((l) => !l.isPremium || l.premiumRank === 0);
                  return (
                    <>
                      {premium.length > 0 && (
                        <>
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-amber-500">&#9733;</span>
                            <span className="text-sm font-bold text-gray-800">프리미엄 매물</span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{premium.length}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {premium.map((listing) => (
                              <ListingCardComponent key={listing.id} listing={listing} variant="search" />
                            ))}
                          </div>
                        </>
                      )}
                      {premium.length > 0 && normal.length > 0 && (
                        <div className="my-5 flex items-center gap-3">
                          <div className="h-px flex-1 bg-gray-200" />
                          <span className="text-xs font-medium text-gray-400">일반 매물</span>
                          <div className="h-px flex-1 bg-gray-200" />
                        </div>
                      )}
                      {normal.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {normal.map((listing) => (
                            <ListingCardComponent key={listing.id} listing={listing} variant="search" />
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
                {hasMore && (
                  <div ref={sentinelRef} className="py-6 text-center">
                    {isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#1B3A5C]" />}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Map */}
        <div className={`${mobileView === "list" ? "hidden" : "flex-1"} border-l border-gray-200 bg-gray-50 md:block md:w-[40%] md:flex-none`}>
          <ListingsMap filters={mapFilters} onBoundsChange={handleBoundsChange} />
        </div>
      </div>

      {/* Mobile toggle button */}
      <div className="fixed bottom-6 left-1/2 z-20 -translate-x-1/2 md:hidden">
        <button
          onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
          className="flex items-center gap-2 rounded-full bg-[#1B3A5C] px-5 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
        >
          {mobileView === "list" ? (
            <>
              <MapIcon className="h-4 w-4" />
              지도 보기
            </>
          ) : (
            <>
              <List className="h-4 w-4" />
              목록 보기
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ================================================================
   Filter Button
   ================================================================ */

function FilterButton({
  label,
  count,
  isOpen,
  onClick,
}: {
  label: string;
  count: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
        isOpen || count > 0
          ? "border-[#1B3A5C] bg-[#1B3A5C]/5 text-[#1B3A5C]"
          : "border-gray-200 text-gray-600 hover:border-gray-300"
      }`}
    >
      {label}
      {count > 0 && (
        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#1B3A5C] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
      <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
    </button>
  );
}

/* ================================================================
   Category Filter Dropdown
   ================================================================ */

function CategoryFilterDropdown({
  value,
  subtype,
  onChange,
}: {
  value: string;
  subtype: string;
  onChange: (category: string, subtype: string) => void;
}) {
  const [activeGroup, setActiveGroup] = useState<string>("");

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">업종</p>
      {/* Group tabs */}
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(BUSINESS_SUBCATEGORIES).map((group) => (
          <button
            key={group}
            onClick={() => setActiveGroup(activeGroup === group ? "" : group)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              activeGroup === group
                ? "border-[#1B3A5C] bg-[#1B3A5C]/10 text-[#1B3A5C]"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {group}
          </button>
        ))}
      </div>
      {/* Sub-categories */}
      {activeGroup && BUSINESS_SUBCATEGORIES[activeGroup] && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChange("", "")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              !value
                ? "border-[#1B3A5C] bg-[#1B3A5C] text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            전체
          </button>
          {BUSINESS_SUBCATEGORIES[activeGroup].map((sub) => {
            const isActive = value === sub.key && (sub.subtype ? subtype === sub.subtype : !subtype);
            return (
              <button
                key={sub.subtype ?? sub.key}
                onClick={() => {
                  if (isActive) {
                    onChange("", "");
                  } else {
                    onChange(sub.key, sub.subtype ?? "");
                  }
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-[#1B3A5C] bg-[#1B3A5C] text-white"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {sub.emoji} {sub.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Region Filter Dropdown
   ================================================================ */

function RegionFilterDropdown({
  city,
  district,
  onChange,
}: {
  city: string;
  district: string;
  onChange: (city: string, district: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">지역</p>
      {/* City buttons */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onChange("", "")}
          className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
            !city
              ? "border-[#1B3A5C] bg-[#1B3A5C] text-white"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
        >
          전체
        </button>
        {Object.keys(REGION_DATA).map((c) => (
          <button
            key={c}
            onClick={() => onChange(city === c ? "" : c, "")}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              city === c
                ? "border-[#1B3A5C] bg-[#1B3A5C]/10 text-[#1B3A5C]"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {/* District buttons */}
      {city && REGION_DATA[city] && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onChange(city, "")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              !district
                ? "border-[#1B3A5C] bg-[#1B3A5C] text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            전체
          </button>
          {REGION_DATA[city].map((d) => (
            <button
              key={d}
              onClick={() => onChange(city, district === d ? "" : d)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                district === d
                  ? "border-[#1B3A5C] bg-[#1B3A5C] text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

