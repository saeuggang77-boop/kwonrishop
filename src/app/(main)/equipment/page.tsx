"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_CONDITION_LABELS } from "@/lib/constants";
import Image from "next/image";
import { RegisterPromoBanner } from "@/components/promotion/PromotionCTA";

interface Equipment {
  id: string;
  title: string;
  price: number;
  negotiable: boolean;
  condition: string;
  category: string;
  tier: "FREE" | "BASIC" | "PREMIUM" | "VIP";
  viewCount: number;
  favoriteCount: number;
  images: { url: string }[];
  user: {
    name: string | null;
    image: string | null;
  };
}

// 티어별 최대 표시 개수
const TIER_LIMITS = { VIP: 4, PREMIUM: 6, BASIC: 8 } as const;

export default function EquipmentListPage() {
  const router = useRouter();

  // 티어별 분리 (브라우즈 모드)
  const [vipEquipments, setVipEquipments] = useState<Equipment[]>([]);
  const [premiumEquipments, setPremiumEquipments] = useState<Equipment[]>([]);
  const [basicEquipments, setBasicEquipments] = useState<Equipment[]>([]);

  // 무료 장비 (페이지네이션)
  const [freeEquipments, setFreeEquipments] = useState<Equipment[]>([]);
  const [freeTotal, setFreeTotal] = useState(0);
  const [freePage, setFreePage] = useState(1);
  const [freeTotalPages, setFreeTotalPages] = useState(1);

  // 검색 결과 (필터 활성 시)
  const [searchResults, setSearchResults] = useState<Equipment[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");

  // 유료 장비 전체 가져와서 티어별 분리
  const fetchFeatured = useCallback(async () => {
    const res = await fetch("/api/equipment?featured=true");
    const data = await res.json();
    const all: Equipment[] = data.equipment || [];
    setVipEquipments(all.filter((e) => e.tier === "VIP"));
    setPremiumEquipments(all.filter((e) => e.tier === "PREMIUM"));
    setBasicEquipments(all.filter((e) => e.tier === "BASIC"));
  }, []);

  // 무료 장비 페이지네이션
  const fetchFree = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("tier", "FREE");
    params.set("page", String(freePage));
    params.set("limit", "10");
    const res = await fetch(`/api/equipment?${params}`);
    const data = await res.json();
    setFreeEquipments(data.equipment || []);
    setFreeTotal(data.pagination?.total || 0);
    setFreeTotalPages(data.pagination?.totalPages || 1);
  }, [freePage]);

  // 검색 결과
  const fetchSearch = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("page", String(searchPage));
    if (category) params.set("category", category);
    if (keyword) params.set("keyword", keyword);
    const res = await fetch(`/api/equipment?${params}`);
    const data = await res.json();
    setSearchResults(data.equipment || []);
    setSearchTotal(data.pagination?.total || 0);
    setSearchTotalPages(data.pagination?.totalPages || 1);
  }, [searchPage, category, keyword]);

  // 초기 로드
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFeatured(), fetchFree()]).then(() => setLoading(false));
  }, [fetchFeatured, fetchFree]);

  // 검색 모드 변경 시
  useEffect(() => {
    if (isSearchMode) fetchSearch();
  }, [isSearchMode, fetchSearch]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (keyword || category) {
      setIsSearchMode(true);
      setSearchPage(1);
    } else {
      setIsSearchMode(false);
    }
  }

  function handleFilterChange(value: string) {
    setCategory(value);
    // 필터 변경 시 자동 검색
    setTimeout(() => {
      if (value || keyword) {
        setIsSearchMode(true);
        setSearchPage(1);
      } else {
        setIsSearchMode(false);
      }
    }, 0);
  }

  function clearSearch() {
    setKeyword("");
    setCategory("");
    setIsSearchMode(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 페이지 타이틀 */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">집기장터</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">사업자 인증된 사장님들의 중고 집기 직거래</p>
      </div>

      {/* 필터 바 */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-10">
        <input
          type="text"
          placeholder="집기명, 브랜드 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={category}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">카테고리 전체</option>
          {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          검색
        </button>
        {isSearchMode && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200"
          >
            초기화
          </button>
        )}
      </form>

      {loading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-40 animate-pulse" />
          ))}
        </div>
      ) : isSearchMode ? (
        /* ===== 검색 결과 모드 ===== */
        <SearchResultsView
          results={searchResults}
          total={searchTotal}
          page={searchPage}
          totalPages={searchTotalPages}
          onPageChange={setSearchPage}
          onEquipmentClick={(id) => router.push(`/equipment/${id}`)}
        />
      ) : (
        /* ===== 브라우즈 모드 (티어별 섹션) ===== */
        <>
          {/* VIP - 2열 가로형 */}
          {vipEquipments.length > 0 && (
            <TierSection
              tier="VIP"
              equipments={vipEquipments}
              limit={TIER_LIMITS.VIP}
              onEquipmentClick={(id) => router.push(`/equipment/${id}`)}
              onShowAll={() => { setCategory(""); setKeyword(""); }}
            />
          )}

          {/* PREMIUM - 3열 가로형 */}
          {premiumEquipments.length > 0 && (
            <TierSection
              tier="PREMIUM"
              equipments={premiumEquipments}
              limit={TIER_LIMITS.PREMIUM}
              onEquipmentClick={(id) => router.push(`/equipment/${id}`)}
              onShowAll={() => { setCategory(""); setKeyword(""); }}
            />
          )}

          {/* BASIC - 2열 줄광고 */}
          {basicEquipments.length > 0 && (
            <TierSection
              tier="BASIC"
              equipments={basicEquipments}
              limit={TIER_LIMITS.BASIC}
              onEquipmentClick={(id) => router.push(`/equipment/${id}`)}
              onShowAll={() => { setCategory(""); setKeyword(""); }}
            />
          )}

          {/* 무료 - 텍스트 리스트 */}
          <FreeSection
            equipments={freeEquipments}
            total={freeTotal}
            page={freePage}
            totalPages={freeTotalPages}
            onPageChange={setFreePage}
            onEquipmentClick={(id) => router.push(`/equipment/${id}`)}
          />
        </>
      )}

      {/* 하단 등록 유도 배너 */}
      <div className="mt-10">
        <RegisterPromoBanner type="equipment" />
      </div>
    </div>
  );
}

/* ===== VIP / PREMIUM / BASIC 섹션 ===== */

function TierSection({
  tier,
  equipments,
  limit,
  onEquipmentClick,
  onShowAll,
}: {
  tier: "VIP" | "PREMIUM" | "BASIC";
  equipments: Equipment[];
  limit: number;
  onEquipmentClick: (id: string) => void;
  onShowAll: () => void;
}) {
  const displayed = equipments.slice(0, limit);
  const hasMore = equipments.length > limit;

  /* ── VIP 섹션 ── */
  if (tier === "VIP") {
    return (
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-lg">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-white text-sm font-extrabold tracking-wide">VIP</span>
          </div>
          <span className="text-sm text-amber-600/80 dark:text-amber-400/80 font-medium">프리미엄 집기</span>
          {hasMore && (
            <button onClick={onShowAll} className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">더보기 &rarr;</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((eq) => (
            <div
              key={eq.id}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_4px_24px_rgba(245,158,11,0.08)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => onEquipmentClick(eq.id)}
            >
              <div className="flex">
                <div className="w-44 h-40 shrink-0 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-950/30 dark:to-gray-800 relative">
                  {eq.images.length > 0 ? (
                    <Image src={eq.images[0].url} alt={eq.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-black text-5xl text-amber-300/60 dark:text-amber-600/40">{eq.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500/90 text-white text-[9px] font-bold rounded">AD</div>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-lg leading-tight truncate">{eq.title}</h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                      {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
                      {eq.negotiable && eq.price > 0 && " · 협의가능"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category} · {EQUIPMENT_CONDITION_LABELS[eq.condition] || eq.condition}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
                    <span>조회 {eq.viewCount}</span>
                    <span>·</span>
                    <span>찜 {eq.favoriteCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── PREMIUM 섹션 ── */
  if (tier === "PREMIUM") {
    return (
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <div className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-500 rounded-lg">
            <span className="text-white text-sm font-extrabold tracking-wide">PREMIUM</span>
          </div>
          <span className="text-sm text-indigo-500/80 dark:text-indigo-400/80 font-medium">추천 집기</span>
          {hasMore && (
            <button onClick={onShowAll} className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">더보기 &rarr;</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {displayed.map((eq) => (
            <div
              key={eq.id}
              className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden cursor-pointer shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_4px_20px_rgba(99,102,241,0.06)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => onEquipmentClick(eq.id)}
            >
              <div className="flex">
                <div className="w-28 h-28 shrink-0 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-gray-800 relative">
                  {eq.images.length > 0 ? (
                    <Image src={eq.images[0].url} alt={eq.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-bold text-3xl text-indigo-300/60 dark:text-indigo-600/40">{eq.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{eq.title}</h3>
                    <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">
                      {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
                      {eq.negotiable && eq.price > 0 && " · 협의가능"}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                      {EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category} · {EQUIPMENT_CONDITION_LABELS[eq.condition] || eq.condition}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── BASIC 섹션 ── */
  return (
    <div className="mb-12">
      <div className="flex items-center gap-2 mb-4">
        <div className="px-3 py-1.5 bg-blue-500 rounded-lg">
          <span className="text-white text-sm font-extrabold tracking-wide">BASIC</span>
        </div>
        <span className="text-sm text-blue-500/80 dark:text-blue-400/80 font-medium">등록 집기</span>
        {hasMore && (
          <button onClick={onShowAll} className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">더보기 &rarr;</button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {displayed.map((eq) => (
          <div
            key={eq.id}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
            onClick={() => onEquipmentClick(eq.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{eq.title}</p>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">·</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category} · {EQUIPMENT_CONDITION_LABELS[eq.condition] || eq.condition}
              </p>
            </div>
            <span className="text-xs text-blue-500 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">자세히 &rarr;</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== 무료 섹션 ===== */
function FreeSection({
  equipments,
  total,
  page,
  totalPages,
  onPageChange,
  onEquipmentClick,
}: {
  equipments: Equipment[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onEquipmentClick: (id: string) => void;
}) {
  if (total === 0 && equipments.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-500 dark:text-gray-400">일반 집기</h2>
          <span className="text-sm text-gray-300 dark:text-gray-600">{total}개</span>
        </div>
        <a href="/pricing" className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
          광고 등록으로 상단 노출 &rarr;
        </a>
      </div>
      <div className="space-y-0">
        {equipments.map((eq) => (
          <div
            key={eq.id}
            className="flex items-center py-2.5 px-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors"
            onClick={() => onEquipmentClick(eq.id)}
          >
            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mr-3">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{eq.title.charAt(0)}</span>
            </div>
            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium mr-2 shrink-0">{eq.title}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
              {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
            </span>
            <span className="text-xs text-gray-300 dark:text-gray-600 ml-auto shrink-0">
              {EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category}
            </span>
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}

/* ===== 검색 결과 모드 ===== */
function SearchResultsView({
  results,
  total,
  page,
  totalPages,
  onPageChange,
  onEquipmentClick,
}: {
  results: Equipment[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onEquipmentClick: (id: string) => void;
}) {
  const tierBadge = (tier: string) => {
    if (tier === "VIP") return <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-bold rounded">VIP</span>;
    if (tier === "PREMIUM") return <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-bold rounded">PREMIUM</span>;
    if (tier === "BASIC") return <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded">BASIC</span>;
    return null;
  };

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        검색 결과 <span className="font-medium text-gray-900 dark:text-white">{total.toLocaleString()}</span>개
      </p>
      {results.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">검색 결과가 없습니다</p>
          <p className="text-sm">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {results.map((eq) => (
            <div
              key={eq.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onEquipmentClick(eq.id)}
            >
              {eq.tier !== "FREE" && (
                <div className="w-16 h-12 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                  {eq.images.length > 0 ? (
                    <Image src={eq.images[0].url} alt={eq.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-400">{eq.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{eq.title}</p>
                  {tierBadge(eq.tier)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
                  {" · "}
                  {EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category}
                  {" · "}
                  {EQUIPMENT_CONDITION_LABELS[eq.condition] || eq.condition}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}

/* ===== 페이지네이션 ===== */
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex justify-center items-center gap-1.5 mt-6">
      <button
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &laquo;
      </button>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &lsaquo;
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
            page === p
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &rsaquo;
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &raquo;
      </button>
    </div>
  );
}
