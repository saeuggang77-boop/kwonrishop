"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import {
  BUSINESS_CATEGORY_LABELS,
  SORT_OPTIONS,
  REGIONS,
} from "@/lib/utils/constants";

interface ListingItem {
  id: string;
  title: string;
  businessCategory: string;
  storeType: string;
  price: string;
  monthlyRent: string | null;
  premiumFee: string | null;
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
  images: { url: string; thumbnailUrl: string | null }[];
  seller: { name: string | null; image: string | null };
}

interface ThemeChip {
  label: string;
  key: string;
}

const THEME_CHIPS: ThemeChip[] = [
  { label: "전체", key: "all" },
  { label: "무권리", key: "noPremium" },
  { label: "급매", key: "urgent" },
  { label: "프랜차이즈", key: "franchise" },
  { label: "사무실", key: "office" },
  { label: "공실", key: "vacant" },
];

export default function ListingsPage() {
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [activeTheme, setActiveTheme] = useState("all");

  const [filters, setFilters] = useState({
    query: searchParams.get("query") ?? "",
    businessCategory: searchParams.get("businessCategory") ?? "",
    storeType: searchParams.get("storeType") ?? "",
    city: "",
    district: "",
    premiumFeeMax: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const districts = filters.city ? REGIONS[filters.city] ?? [] : [];

  const fetchListings = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.query) params.set("query", filters.query);
      if (filters.businessCategory)
        params.set("businessCategory", filters.businessCategory);
      if (filters.storeType) params.set("storeType", filters.storeType);
      if (filters.city) params.set("city", filters.city);
      if (filters.district) params.set("district", filters.district);
      if (filters.premiumFeeMax)
        params.set("premiumFeeMax", filters.premiumFeeMax);
      params.set("sortBy", filters.sortBy);
      params.set("sortOrder", filters.sortOrder);
      if (!reset && cursor) params.set("cursor", cursor);

      try {
        const res = await fetch(`/api/listings?${params}`);
        const json = await res.json();

        if (reset) {
          setListings(json.data ?? []);
        } else {
          setListings((prev) => [...prev, ...(json.data ?? [])]);
        }
        setCursor(json.meta?.cursor);
        setHasMore(json.meta?.hasMore ?? false);
        setTotalCount(json.meta?.total ?? json.data?.length ?? 0);
      } catch {
        if (reset) setListings([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, cursor]
  );

  useEffect(() => {
    fetchListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.businessCategory,
    filters.storeType,
    filters.city,
    filters.district,
    filters.premiumFeeMax,
    filters.sortBy,
    filters.sortOrder,
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(true);
  };

  const handleCityChange = (city: string) => {
    setFilters((f) => ({ ...f, city, district: "" }));
  };

  const handleThemeClick = (chip: ThemeChip) => {
    setActiveTheme(chip.key);

    switch (chip.key) {
      case "all":
        setFilters((f) => ({
          ...f,
          businessCategory: "",
          storeType: "",
          premiumFeeMax: "",
        }));
        break;
      case "noPremium":
        setFilters((f) => ({
          ...f,
          businessCategory: "",
          storeType: "",
          premiumFeeMax: "0",
        }));
        break;
      case "urgent":
        setFilters((f) => ({
          ...f,
          businessCategory: "",
          storeType: "",
          premiumFeeMax: "",
        }));
        break;
      case "franchise":
        setFilters((f) => ({
          ...f,
          businessCategory: "",
          storeType: "FRANCHISE",
          premiumFeeMax: "",
        }));
        break;
      case "office":
        setFilters((f) => ({
          ...f,
          businessCategory: "",
          storeType: "OFFICE",
          premiumFeeMax: "",
        }));
        break;
      case "vacant":
        setFilters((f) => ({
          ...f,
          businessCategory: "",
          storeType: "",
          premiumFeeMax: "",
        }));
        break;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-4 md:pb-0 md:pt-8">
      {/* Filter Bar - always visible */}
      <div className="sticky top-14 z-30 -mx-4 bg-white px-4 pb-3 pt-3 shadow-sm md:static md:mx-0 md:px-0 md:shadow-none">
        {/* Search row */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="매물 검색 (지역, 업종, 키워드)"
              value={filters.query}
              onChange={(e) =>
                setFilters((f) => ({ ...f, query: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white hover:bg-mint-dark transition-colors"
          >
            검색
          </button>
        </form>

        {/* Filter dropdowns row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* 시/도 */}
          <select
            value={filters.city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-mint"
          >
            <option value="">시/도 전체</option>
            {Object.keys(REGIONS).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* 구/군 */}
          <select
            value={filters.district}
            onChange={(e) =>
              setFilters((f) => ({ ...f, district: e.target.value }))
            }
            disabled={!filters.city}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-mint disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">구/군 전체</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* 업종 */}
          <select
            value={filters.businessCategory}
            onChange={(e) => {
              setFilters((f) => ({
                ...f,
                businessCategory: e.target.value,
              }));
              setActiveTheme("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-mint"
          >
            <option value="">업종 전체</option>
            {Object.entries(BUSINESS_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-");
              setFilters((f) => ({ ...f, sortBy, sortOrder }));
            }}
            className="ml-auto rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-mint"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme chips row */}
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {THEME_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleThemeClick(chip)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTheme === chip.key
                  ? "border-mint bg-mint text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:border-mint hover:text-mint"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading && listings.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="aspect-[4/3] animate-pulse bg-gray-200" />
                <div className="space-y-2 p-4">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-500">
              매물이 없습니다
            </p>
            <p className="mt-1 text-sm text-gray-400">
              검색 조건을 변경해보세요.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-gray-600">
              총 <span className="text-mint">{totalCount > 0 ? totalCount : listings.length}</span>건
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchListings(false)}
                  disabled={isLoading}
                  className="rounded-lg border border-gray-300 px-10 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-mint hover:text-mint disabled:opacity-50"
                >
                  {isLoading ? "로딩 중..." : "더 보기"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: ListingItem }) {
  const thumbnail =
    listing.images[0]?.thumbnailUrl ?? listing.images[0]?.url;

  const categoryLabel =
    BUSINESS_CATEGORY_LABELS[listing.businessCategory] ??
    listing.businessCategory;

  const hasFloorOrArea = listing.floor != null || listing.areaPyeong != null;
  const floorAreaParts: string[] = [];
  if (listing.floor != null) floorAreaParts.push(`${listing.floor}층`);
  if (listing.areaPyeong != null) floorAreaParts.push(`${listing.areaPyeong}평`);

  const hasPremiumFee =
    listing.premiumFee != null && Number(listing.premiumFee) > 0;
  const hasRevenue =
    listing.monthlyRevenue != null && Number(listing.monthlyRevenue) > 0;
  const hasProfit =
    listing.monthlyProfit != null && Number(listing.monthlyProfit) > 0;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <MapPin className="h-10 w-10" />
          </div>
        )}
        {/* Category badge */}
        <span className="absolute left-3 top-3 rounded-md bg-navy/80 px-2 py-1 text-xs font-medium text-white">
          {categoryLabel}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="truncate font-medium text-navy group-hover:text-mint transition-colors">
          {listing.title}
        </h3>

        {/* Floor / area */}
        {hasFloorOrArea && (
          <p className="mt-0.5 text-sm text-gray-500">
            {floorAreaParts.join(" · ")}
          </p>
        )}

        {/* Price rows */}
        <div className="mt-2 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="shrink-0 text-xs text-gray-500">보증금/월세</span>
            <span className="font-bold text-navy">
              {formatKRW(Number(listing.price))}
              {" / "}
              {listing.monthlyRent && Number(listing.monthlyRent) > 0
                ? formatKRW(Number(listing.monthlyRent))
                : "0원"}
            </span>
          </div>

          {hasPremiumFee && (
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 text-xs text-gray-500">권리금</span>
              <span className="font-bold text-orange-600">
                {formatKRW(Number(listing.premiumFee))}
              </span>
            </div>
          )}

          {!hasPremiumFee && (
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 text-xs text-gray-500">권리금</span>
              <span className="font-bold text-mint">무권리</span>
            </div>
          )}
        </div>

        {/* Revenue / Profit row */}
        {(hasRevenue || hasProfit) && (
          <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
            {hasRevenue && (
              <span>월매출 {formatKRW(Number(listing.monthlyRevenue))}</span>
            )}
            {hasRevenue && hasProfit && (
              <span className="text-gray-300">|</span>
            )}
            {hasProfit && (
              <span>월수익 {formatKRW(Number(listing.monthlyProfit))}</span>
            )}
          </div>
        )}

        {/* Location */}
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {listing.district}
            {listing.neighborhood ? ` ${listing.neighborhood}` : ""}
          </span>
        </p>
      </div>
    </Link>
  );
}
