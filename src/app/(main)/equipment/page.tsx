"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_CONDITION_LABELS } from "@/lib/constants";
import Image from "next/image";
import { RegisterPromoBanner } from "@/components/promotion/PromotionCTA";
import { SafeTradeBanner } from "@/components/equipment/SafeTradeGuide";

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

function EquipmentListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMine = searchParams.get("mine") === "true";

  // 내 집기 모드
  const [myEquipments, setMyEquipments] = useState<Equipment[]>([]);
  const [myLoading, setMyLoading] = useState(true);

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

  // 내 집기 모드 로드
  useEffect(() => {
    if (!isMine) return;
    setMyLoading(true);
    fetch("/api/equipment?mine=true&limit=100")
      .then((r) => r.json())
      .then((data) => {
        setMyEquipments(data.equipment || []);
        setMyLoading(false);
      })
      .catch(() => setMyLoading(false));
  }, [isMine]);

  // 초기 로드 (일반 모드)
  useEffect(() => {
    if (isMine) return;
    setLoading(true);
    Promise.all([fetchFeatured(), fetchFree()]).then(() => setLoading(false));
  }, [fetchFeatured, fetchFree, isMine]);

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
    // setTimeout 제거 - 변경된 값을 직접 사용하여 stale closure 방지
    if (value || keyword) {
      setIsSearchMode(true);
      setSearchPage(1);
    } else {
      setIsSearchMode(false);
    }
  }

  function clearSearch() {
    setKeyword("");
    setCategory("");
    setIsSearchMode(false);
  }

  // 내 집기 모드 렌더링
  if (isMine) {
    return (
      <div>
        {/* Navy 배너 */}
        <div className="bg-green-700 text-white pt-10 pb-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">내 집기</h1>
            <p className="text-green-200 text-sm md:text-base">내가 등록한 집기 목록</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => router.push("/equipment/register")}
            className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg font-medium hover:bg-green-600"
          >
            집기 등록
          </button>
        </div>
        {myLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : myEquipments.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>등록한 집기가 없습니다</p>
            <p className="text-sm mt-1">집기를 등록하고 판매해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {myEquipments.map((eq) => (
              <div
                key={eq.id}
                onClick={() => router.push(`/equipment/${eq.id}`)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100">
                  {eq.images[0] && (
                    <Image src={eq.images[0].url} alt={eq.title} width={300} height={300} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm text-gray-900 truncate">{eq.title}</p>
                  <p className="text-green-700 font-bold text-sm mt-1">
                    {eq.price.toLocaleString()}원
                  </p>
                  <div className="flex gap-2 mt-1 text-xs text-gray-400">
                    <span>조회 {eq.viewCount}</span>
                    <span>관심 {eq.favoriteCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* 히어로 */}
      <div className="bg-green-700 text-cream pt-14 pb-20 relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-terra-500/10 blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 text-center relative">
          <div className="text-xs font-semibold text-terra-300 tracking-[0.2em] uppercase mb-3">Equipment Market</div>
          <h1 className="font-extrabold text-cream text-3xl md:text-5xl tracking-tight mb-3 leading-tight">
            <span className="font-light text-terra-300">중고 집기</span>, 합리적으로
          </h1>
          <p className="text-cream/60 text-sm md:text-base">사장님이 직접 올린 중고 집기·인테리어</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

      {/* 안전거래 가이드 배너 */}
      <SafeTradeBanner />

      {/* 필터 바 */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-10 bg-cream-elev rounded-3xl p-3 border border-line">
        <input
          type="text"
          placeholder="집기명, 브랜드 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 min-w-[160px] px-4 py-2.5 border border-line bg-cream text-ink rounded-full text-sm focus:ring-2 focus:ring-green-700 focus:border-green-700 outline-none"
        />
        <select
          value={category}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2.5 border border-line bg-cream text-ink rounded-full text-sm focus:ring-2 focus:ring-green-700 outline-none font-medium"
        >
          <option value="">카테고리 전체</option>
          {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 bg-green-700 text-cream rounded-full text-sm font-semibold hover:bg-green-800 transition-colors"
        >
          검색
        </button>
        {isSearchMode && (
          <button
            type="button"
            onClick={clearSearch}
            className="px-3 py-2 text-muted text-sm hover:text-ink"
          >
            초기화
          </button>
        )}
      </form>

      {loading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />
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
      <div className="mb-14">
        <div className="flex items-end justify-between gap-3 mb-6 flex-wrap">
          <div>
            <div className="text-xs font-semibold text-terra-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-terra-500" />
              VIP Equipment
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight">
              프리미엄 <span className="font-light text-terra-500">집기</span>
            </h2>
          </div>
          {hasMore && (
            <button onClick={onShowAll} className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors whitespace-nowrap">더보기 →</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayed.map((eq) => (
            <div
              key={eq.id}
              className="bg-cream-elev rounded-3xl overflow-hidden cursor-pointer border-2 border-green-700 shadow-[0_8px_32px_rgba(31,63,46,0.10)] hover:shadow-[0_16px_40px_rgba(31,63,46,0.14)] hover:-translate-y-1 transition-all duration-300"
              onClick={() => onEquipmentClick(eq.id)}
            >
              <div className="flex">
                <div className="w-44 h-40 shrink-0 bg-green-800 relative">
                  {eq.images.length > 0 ? (
                    <Image src={eq.images[0].url} alt={eq.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif italic font-light text-5xl text-terra-300">{eq.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 inline-flex items-center px-3 py-1 bg-terra-500 text-cream text-[10px] font-bold rounded-full tracking-wider">
                    VIP
                  </div>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-extrabold text-ink text-lg leading-tight truncate tracking-tight">{eq.title}</h3>
                    <p className="font-serif italic font-medium text-xl text-green-700 mt-1 tracking-tight">
                      {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
                      {eq.negotiable && eq.price > 0 && <span className="text-xs font-sans not-italic text-muted font-normal"> · 협의</span>}
                    </p>
                    <p className="text-sm text-muted mt-2">
                      {EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category} · {EQUIPMENT_CONDITION_LABELS[eq.condition] || eq.condition}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted">
                    <span>조회 {eq.viewCount}</span>
                    <span className="text-line-deep">·</span>
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
      <div className="mb-14">
        <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-green-700 text-cream text-[10px] font-bold rounded-full tracking-wider">PREMIUM</span>
            <h3 className="text-lg font-bold text-ink tracking-tight">추천 집기</h3>
          </div>
          {hasMore && (
            <button onClick={onShowAll} className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors">더보기 →</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayed.map((eq) => (
            <div
              key={eq.id}
              className="bg-cream rounded-3xl overflow-hidden cursor-pointer border-[1.5px] border-line-deep shadow-[0_2px_12px_rgba(31,63,46,0.06)] hover:shadow-[0_8px_24px_rgba(31,63,46,0.10)] hover:-translate-y-1 transition-all duration-300"
              onClick={() => onEquipmentClick(eq.id)}
            >
              <div className="flex">
                <div className="w-28 h-28 shrink-0 bg-cream-elev relative">
                  {eq.images.length > 0 ? (
                    <Image src={eq.images[0].url} alt={eq.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif italic font-light text-3xl text-green-700">{eq.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-ink text-sm truncate tracking-tight">{eq.title}</h3>
                    <p className="font-serif italic font-medium text-base text-green-700 mt-1 tracking-tight">
                      {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
                      {eq.negotiable && eq.price > 0 && <span className="text-[10px] font-sans not-italic text-muted font-normal"> · 협의</span>}
                    </p>
                    <p className="text-[11px] text-muted mt-1.5">
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
    <div className="mb-14">
      <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full tracking-wider">BASIC</span>
          <h3 className="text-lg font-bold text-ink tracking-tight">등록 집기</h3>
        </div>
        {hasMore && (
          <button onClick={onShowAll} className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors">더보기 →</button>
        )}
      </div>
      <div className="bg-cream rounded-3xl border border-line overflow-hidden">
        {displayed.map((eq, i) => (
          <div
            key={eq.id}
            className={`flex items-center justify-between px-5 py-4 hover:bg-cream-elev cursor-pointer transition-colors group ${i !== 0 ? "border-t border-line" : ""}`}
            onClick={() => onEquipmentClick(eq.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-ink truncate">{eq.title}</p>
                <span className="text-[11px] text-line-deep">·</span>
                <span className="text-[11px] font-serif italic text-green-700 font-medium">
                  {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category} · {EQUIPMENT_CONDITION_LABELS[eq.condition] || eq.condition}
              </p>
            </div>
            <span className="text-xs text-green-700 font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">자세히 →</span>
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
    <div className="mb-10 border-t border-line pt-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wider">일반 집기</h2>
          <span className="text-sm text-line-deep">{total}개</span>
        </div>
        <a href="/pricing" className="text-xs text-muted hover:text-terra-500 transition-colors">
          광고 등록으로 상단 노출 →
        </a>
      </div>
      <div className="space-y-1">
        {equipments.map((eq) => (
          <div
            key={eq.id}
            className="flex items-center py-2.5 px-3 rounded-2xl hover:bg-cream-elev cursor-pointer transition-colors"
            onClick={() => onEquipmentClick(eq.id)}
          >
            <div className="w-7 h-7 rounded-full bg-cream-elev flex items-center justify-center shrink-0 mr-3">
              <span className="text-[10px] font-light text-green-700">{eq.title.charAt(0)}</span>
            </div>
            <span className="text-sm text-ink font-medium mr-2 shrink-0">{eq.title}</span>
            <span className="text-xs font-serif italic text-green-700 font-medium shrink-0">
              {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
            </span>
            <span className="text-xs text-muted ml-auto shrink-0">
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
    if (tier === "VIP") return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-700 text-white text-[9px] font-bold rounded"><svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>VIP</span>;
    if (tier === "PREMIUM") return <span className="px-1.5 py-0.5 bg-green-700/85 text-white text-[9px] font-bold rounded">PREMIUM</span>;
    if (tier === "BASIC") return <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[9px] font-bold rounded">BASIC</span>;
    return null;
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        검색 결과 <span className="font-medium text-gray-900">{total.toLocaleString()}</span>개
      </p>
      {results.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">검색 결과가 없습니다</p>
          <p className="text-sm">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {results.map((eq) => (
            <div
              key={eq.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onEquipmentClick(eq.id)}
            >
              {eq.tier !== "FREE" && (
                <div className="w-16 h-12 shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                  {eq.images.length > 0 ? (
                    <Image src={eq.images[0].url} alt={eq.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-400">{eq.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{eq.title}</p>
                  {tierBadge(eq.tier)}
                </div>
                <p className="text-xs text-gray-500">
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
        className="w-8 h-8 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &laquo;
      </button>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &lsaquo;
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
            page === p
              ? "bg-green-700 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &rsaquo;
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        &raquo;
      </button>
    </div>
  );
}

export default function EquipmentListPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <EquipmentListContent />
    </Suspense>
  );
}
