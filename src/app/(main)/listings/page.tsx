"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import {
  RIGHTS_CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/utils/constants";

interface ListingItem {
  id: string;
  title: string;
  rightsCategory: string;
  propertyType: string;
  price: string;
  monthlyRent: string | null;
  city: string;
  district: string;
  neighborhood: string | null;
  areaM2: number | null;
  floor: number | null;
  createdAt: string;
  viewCount: number;
  images: { url: string; thumbnailUrl: string | null }[];
  seller: { name: string | null; image: string | null };
}

export default function ListingsPage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    query: "",
    rightsCategory: "",
    propertyType: "",
    city: "",
    priceMin: "",
    priceMax: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const fetchListings = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.query) params.set("query", filters.query);
      if (filters.rightsCategory) params.set("rightsCategory", filters.rightsCategory);
      if (filters.propertyType) params.set("propertyType", filters.propertyType);
      if (filters.city) params.set("city", filters.city);
      if (filters.priceMin) params.set("priceMin", filters.priceMin);
      if (filters.priceMax) params.set("priceMax", filters.priceMax);
      params.set("sortBy", filters.sortBy);
      params.set("sortOrder", filters.sortOrder);
      if (!reset && cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/listings?${params}`);
      const json = await res.json();

      if (reset) {
        setListings(json.data);
      } else {
        setListings((prev) => [...prev, ...json.data]);
      }
      setCursor(json.meta?.cursor);
      setHasMore(json.meta?.hasMore ?? false);
      setIsLoading(false);
    },
    [filters, cursor]
  );

  useEffect(() => {
    fetchListings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.rightsCategory, filters.propertyType, filters.city, filters.sortBy, filters.sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings(true);
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      rightsCategory: "",
      propertyType: "",
      city: "",
      priceMin: "",
      priceMax: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  const activeFilterCount = [
    filters.rightsCategory,
    filters.propertyType,
    filters.city,
    filters.priceMin,
    filters.priceMax,
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="매물 검색 (지역, 제목, 주소)"
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark"
        >
          검색
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`relative rounded-lg border px-4 py-3 text-sm ${
            showFilters ? "border-mint bg-mint/5 text-mint" : "border-gray-300 text-gray-600"
          }`}
        >
          <SlidersHorizontal className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-mint text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-navy">필터</h3>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
                <X className="h-4 w-4" /> 초기화
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">권리유형</label>
              <select
                value={filters.rightsCategory}
                onChange={(e) => setFilters((f) => ({ ...f, rightsCategory: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                {Object.entries(RIGHTS_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">매물유형</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters((f) => ({ ...f, propertyType: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">가격 (최소)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.priceMin}
                onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">가격 (최대)</label>
              <input
                type="number"
                placeholder="제한없음"
                value={filters.priceMax}
                onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">정렬</label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  setFilters((f) => ({ ...f, sortBy, sortOrder }));
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="createdAt-desc">최신순</option>
                <option value="createdAt-asc">오래된순</option>
                <option value="price-asc">가격 낮은순</option>
                <option value="price-desc">가격 높은순</option>
                <option value="viewCount-desc">조회순</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {isLoading && listings.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="py-20 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-500">매물이 없습니다</p>
            <p className="mt-1 text-sm text-gray-400">검색 조건을 변경해보세요.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {listings.length}건{hasMore ? "+" : ""}
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
                  className="rounded-lg border border-gray-300 px-8 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
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
  const thumbnail = listing.images[0]?.thumbnailUrl ?? listing.images[0]?.url;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {thumbnail ? (
          <Image src={thumbnail} alt={listing.title} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <MapPin className="h-10 w-10" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-navy/80 px-2 py-1 text-xs font-medium text-white">
          {RIGHTS_CATEGORY_LABELS[listing.rightsCategory] ?? listing.rightsCategory}
        </span>
      </div>
      <div className="p-4">
        <h3 className="truncate font-medium text-navy group-hover:text-mint">
          {listing.title}
        </h3>
        <p className="mt-1 text-lg font-bold text-navy">
          {formatKRW(Number(listing.price))}
          {listing.monthlyRent && Number(listing.monthlyRent) > 0 && (
            <span className="text-sm font-normal text-gray-500">
              {" "}/ 월 {formatKRW(Number(listing.monthlyRent))}
            </span>
          )}
        </p>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5" />
          {listing.city} {listing.district}
          {listing.neighborhood ? ` ${listing.neighborhood}` : ""}
        </p>
        <div className="mt-2 flex gap-2 text-xs text-gray-400">
          <span>{PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}</span>
          {listing.areaM2 && <span>&middot; {listing.areaM2}m²</span>}
          {listing.floor && <span>&middot; {listing.floor}층</span>}
        </div>
      </div>
    </Link>
  );
}
