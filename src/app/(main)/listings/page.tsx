"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ListingCard from "@/components/listing/ListingCard";
import ListingMapView from "@/components/map/ListingMapView";
import PremiumCarousel from "@/components/shared/PremiumCarousel";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  subCategories: { id: string; name: string }[];
}

interface ListingItem {
  id: string;
  addressRoad: string | null;
  addressJibun: string | null;
  deposit: number;
  monthlyRent: number;
  premium: number;
  premiumNone: boolean;
  premiumNegotiable: boolean;
  brandType: string;
  storeName: string | null;
  areaPyeong: number | null;
  currentFloor: number | null;
  themes: string[];
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  bumpedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  category: { name: string; icon: string | null } | null;
  subCategory: { name: string } | null;
  images: { url: string }[];
  featuredTier?: string;
}

interface FeaturedListingItem extends ListingItem {
  featuredTier?: string;
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [featuredListings, setFeaturedListings] = useState<FeaturedListingItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1") || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [subCategoryId, setSubCategoryId] = useState(searchParams.get("subCategoryId") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Advanced filters (URL에서 복원)
  const [showFilters, setShowFilters] = useState(!!searchParams.get("region") || !!searchParams.get("premiumMin") || !!searchParams.get("depositMin") || !!searchParams.get("rentMin") || !!searchParams.get("areaMin") || !!searchParams.get("themes"));
  const [region, setRegion] = useState(searchParams.get("region") || "");
  const [premiumMin, setPremiumMin] = useState(searchParams.get("premiumMin") || "");
  const [premiumMax, setPremiumMax] = useState(searchParams.get("premiumMax") || "");
  const [depositMin, setDepositMin] = useState(searchParams.get("depositMin") || "");
  const [depositMax, setDepositMax] = useState(searchParams.get("depositMax") || "");
  const [rentMin, setRentMin] = useState(searchParams.get("rentMin") || "");
  const [rentMax, setRentMax] = useState(searchParams.get("rentMax") || "");
  const [areaMin, setAreaMin] = useState(searchParams.get("areaMin") || "");
  const [areaMax, setAreaMax] = useState(searchParams.get("areaMax") || "");
  const [selectedThemes, setSelectedThemes] = useState<string[]>(searchParams.get("themes")?.split(",").filter(Boolean) || []);

  const debouncedKeyword = useDebounce(keyword, 300);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (categoryId) params.set("categoryId", categoryId);
    if (subCategoryId) params.set("subCategoryId", subCategoryId);
    if (debouncedKeyword) params.set("keyword", debouncedKeyword);
    params.set("sort", sort);

    // Advanced filters
    if (region) params.set("region", region);
    if (premiumMin) params.set("premiumMin", premiumMin);
    if (premiumMax) params.set("premiumMax", premiumMax);
    if (depositMin) params.set("depositMin", depositMin);
    if (depositMax) params.set("depositMax", depositMax);
    if (rentMin) params.set("rentMin", rentMin);
    if (rentMax) params.set("rentMax", rentMax);
    if (areaMin) params.set("areaMin", areaMin);
    if (areaMax) params.set("areaMax", areaMax);
    if (selectedThemes.length > 0) params.set("themes", selectedThemes.join(","));

    // URL 동기화 (뒤로가기 시 필터 유지)
    router.replace(`/listings?${params.toString()}`, { scroll: false });

    const res = await fetch(`/api/listings?${params}`);
    const data = await res.json();
    setListings(data.listings || []);
    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, categoryId, subCategoryId, debouncedKeyword, sort, region, premiumMin, premiumMax, depositMin, depositMax, rentMin, rentMax, areaMin, areaMax, selectedThemes]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    fetch("/api/listings?featured=true")
      .then((r) => r.json())
      .then((data) => setFeaturedListings(data.listings || []));
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchListings();
  }

  function handleCategoryClick(id: string) {
    setCategoryId(categoryId === id ? "" : id);
    setSubCategoryId("");
    setPage(1);
  }

  function handleSubCategoryClick(id: string) {
    setSubCategoryId(subCategoryId === id ? "" : id);
    setPage(1);
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);

  function handleThemeToggle(theme: string) {
    setSelectedThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
    setPage(1);
  }

  function handleResetFilters() {
    setRegion("");
    setPremiumMin("");
    setPremiumMax("");
    setDepositMin("");
    setDepositMax("");
    setRentMin("");
    setRentMax("");
    setAreaMin("");
    setAreaMax("");
    setSelectedThemes([]);
    setSubCategoryId("");
    setPage(1);
  }

  const activeFilterCount =
    (region ? 1 : 0) +
    (premiumMin || premiumMax ? 1 : 0) +
    (depositMin || depositMax ? 1 : 0) +
    (rentMin || rentMax ? 1 : 0) +
    (areaMin || areaMax ? 1 : 0) +
    (selectedThemes.length > 0 ? 1 : 0);

  const commonThemes = ["무권리", "급매", "신규", "역세권", "코너", "1층"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 검색 */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="지역, 업종, 상호명 검색"
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

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        <button
          onClick={() => handleCategoryClick("")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !categoryId
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              categoryId === cat.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* 소분류 필터 */}
      {selectedCategory && selectedCategory.subCategories.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSubCategoryId("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !subCategoryId
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              전체
            </button>
            {selectedCategory.subCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => handleSubCategoryClick(sub.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  subCategoryId === sub.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 상세 필터 버튼 */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          상세필터
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* 지역 검색 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                지역 (시/구/동)
              </label>
              <input
                type="text"
                placeholder="예: 강남구, 역삼동"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* 권리금 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                권리금 (만원)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="최소"
                  value={premiumMin}
                  onChange={(e) => setPremiumMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="number"
                  placeholder="최대"
                  value={premiumMax}
                  onChange={(e) => setPremiumMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 보증금 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                보증금 (만원)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="최소"
                  value={depositMin}
                  onChange={(e) => setDepositMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="number"
                  placeholder="최대"
                  value={depositMax}
                  onChange={(e) => setDepositMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 월세 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                월세 (만원)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="최소"
                  value={rentMin}
                  onChange={(e) => setRentMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="number"
                  placeholder="최대"
                  value={rentMax}
                  onChange={(e) => setRentMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 면적 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                면적 (평)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="최소"
                  value={areaMin}
                  onChange={(e) => setAreaMin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="number"
                  placeholder="최대"
                  value={areaMax}
                  onChange={(e) => setAreaMax(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* 테마 필터 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">테마</label>
            <div className="flex flex-wrap gap-2">
              {commonThemes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleThemeToggle(theme)}
                  className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${
                    selectedThemes.includes(theme)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* 필터 액션 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              필터 초기화
            </button>
            <button
              onClick={() => { setPage(1); fetchListings(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              필터 적용
            </button>
          </div>
        </div>
      )}

      {/* 프리미엄 매물 캐러셀 */}
      <PremiumCarousel
        title="프리미엄 매물"
        subtitle="유료 광고 매물을 먼저 확인하세요"
        count={featuredListings.length}
      >
        {featuredListings.map((listing) => {
          const tierColors: Record<string, string> = {
            VIP: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
            PREMIUM: "border-gray-400 bg-gray-50 dark:bg-gray-700/30",
            BASIC: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
          };
          const tierBadgeColors: Record<string, string> = {
            VIP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            PREMIUM: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
            BASIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          };
          const tier = listing.featuredTier || "BASIC";
          const address = listing.addressRoad || listing.addressJibun || "주소 미입력";
          const shortAddress = address.split(" ").slice(0, 3).join(" ");
          const images = listing.images;

          return (
            <div
              key={listing.id}
              onClick={() => router.push(`/listings/${listing.id}`)}
              className={`min-w-[280px] max-w-[280px] snap-start rounded-xl border-2 ${tierColors[tier] || tierColors.BASIC} overflow-hidden cursor-pointer hover:shadow-lg transition-shadow shrink-0`}
            >
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
                {images?.[0] ? (
                  <Image src={images[0].url} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${tierBadgeColors[tier] || tierBadgeColors.BASIC}`}>
                  {tier}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">{shortAddress}</p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">보증금/월세 </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {listing.deposit.toLocaleString()} / {listing.monthlyRent.toLocaleString()}만
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">권리금 </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {listing.premiumNone
                      ? "무권리"
                      : `${listing.premium.toLocaleString()}만`}
                  </span>
                </p>
                <div className="flex gap-2 mt-1 text-xs text-gray-400">
                  {listing.areaPyeong ? <span>{listing.areaPyeong}평</span> : null}
                  {listing.currentFloor ? <span>{listing.currentFloor}층</span> : null}
                </div>
              </div>
            </div>
          );
        })}
      </PremiumCarousel>

      {/* 보기 모드 전환 + 정렬 + 결과수 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">
            총 <span className="font-medium text-gray-900">{total.toLocaleString()}</span>건
          </p>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              목록
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === "map"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              지도
            </button>
          </div>
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
          <option value="premium_asc">권리금 낮은순</option>
          <option value="premium_desc">권리금 높은순</option>
        </select>
      </div>

      {/* 목록 또는 지도 */}
      {viewMode === "map" ? (
        loading ? (
          <div className="w-full h-[500px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
            <p className="text-sm text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <ListingMapView listings={listings as Array<{
            id: string;
            latitude: number | null;
            longitude: number | null;
            storeName: string | null;
            addressRoad: string | null;
            premium: number;
            deposit: number;
            monthlyRent: number;
            category: { name: string; icon: string } | null;
          }>} />
        )
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">등록된 매물이 없습니다</p>
          <p className="text-sm">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
            />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (() => {
        const windowSize = 5;
        let start = Math.max(1, page - Math.floor(windowSize / 2));
        const end = Math.min(totalPages, start + windowSize - 1);
        if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
        const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

        return (
          <div className="flex justify-center items-center gap-1.5 mt-8">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &laquo;
            </button>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &lsaquo;
            </button>
            {pages.map((p) => (
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
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &raquo;
            </button>
          </div>
        );
      })()}
    </div>
  );
}

// ListingCard props type for casting
type ListingCardProps = Parameters<typeof ListingCard>[0];

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsContent />
    </Suspense>
  );
}
