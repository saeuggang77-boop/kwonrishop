"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_TYPE_LABELS, REGION_OPTIONS } from "@/lib/constants";
import Image from "next/image";
import { RegisterPromoBanner } from "@/components/promotion/PromotionCTA";

interface Partner {
  id: string;
  companyName: string;
  serviceType: string;
  description: string | null;
  serviceArea: string[];
  tier: "FREE" | "BASIC" | "PREMIUM" | "VIP";
  viewCount: number;
  images: { url: string }[];
  user: {
    name: string | null;
    image: string | null;
  };
}

// 티어별 최대 표시 개수
const TIER_LIMITS = { VIP: 4, PREMIUM: 6, BASIC: 8 } as const;

export default function PartnersPage() {
  const router = useRouter();

  // 티어별 분리 (브라우즈 모드)
  const [vipPartners, setVipPartners] = useState<Partner[]>([]);
  const [premiumPartners, setPremiumPartners] = useState<Partner[]>([]);
  const [basicPartners, setBasicPartners] = useState<Partner[]>([]);

  // 무료 업체 (페이지네이션)
  const [freePartners, setFreePartners] = useState<Partner[]>([]);
  const [freeTotal, setFreeTotal] = useState(0);
  const [freePage, setFreePage] = useState(1);
  const [freeTotalPages, setFreeTotalPages] = useState(1);

  // 검색 결과 (필터 활성 시)
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [region, setRegion] = useState("");

  // 유료 업체 전체 가져와서 티어별 분리
  const fetchFeatured = useCallback(async () => {
    const res = await fetch("/api/partners?featured=true");
    const data = await res.json();
    const all: Partner[] = data.partners || [];
    setVipPartners(all.filter((p) => p.tier === "VIP"));
    setPremiumPartners(all.filter((p) => p.tier === "PREMIUM"));
    setBasicPartners(all.filter((p) => p.tier === "BASIC"));
  }, []);

  // 무료 업체 페이지네이션
  const fetchFree = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("tier", "FREE");
    params.set("page", String(freePage));
    params.set("limit", "10");
    const res = await fetch(`/api/partners?${params}`);
    const data = await res.json();
    setFreePartners(data.partners || []);
    setFreeTotal(data.pagination?.total || 0);
    setFreeTotalPages(data.pagination?.totalPages || 1);
  }, [freePage]);

  // 검색 결과
  const fetchSearch = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("page", String(searchPage));
    if (serviceType) params.set("serviceType", serviceType);
    if (region) params.set("region", region);
    if (keyword) params.set("keyword", keyword);
    const res = await fetch(`/api/partners?${params}`);
    const data = await res.json();
    setSearchResults(data.partners || []);
    setSearchTotal(data.pagination?.total || 0);
    setSearchTotalPages(data.pagination?.totalPages || 1);
  }, [searchPage, serviceType, region, keyword]);

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
    if (keyword || serviceType || region) {
      setIsSearchMode(true);
      setSearchPage(1);
    } else {
      setIsSearchMode(false);
    }
  }

  function handleFilterChange(type: "serviceType" | "region", value: string) {
    if (type === "serviceType") setServiceType(value);
    else setRegion(value);
    // 필터 변경 시 자동 검색
    setTimeout(() => {
      if (value || keyword || (type === "serviceType" ? region : serviceType)) {
        setIsSearchMode(true);
        setSearchPage(1);
      } else {
        setIsSearchMode(false);
      }
    }, 0);
  }

  function clearSearch() {
    setKeyword("");
    setServiceType("");
    setRegion("");
    setIsSearchMode(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* 페이지 타이틀 */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">협력업체</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">점포 창업 및 운영에 필요한 검증된 업체를 만나보세요</p>
      </div>

      {/* 필터 바 */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-10">
        <input
          type="text"
          placeholder="업체명, 서비스 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={serviceType}
          onChange={(e) => handleFilterChange("serviceType", e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">서비스 전체</option>
          {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => handleFilterChange("region", e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">지역 전체</option>
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
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
          onPartnerClick={(id) => router.push(`/partners/${id}`)}
        />
      ) : (
        /* ===== 브라우즈 모드 (티어별 섹션) ===== */
        <>
          {/* VIP - 2열 가로형 */}
          {vipPartners.length > 0 && (
            <TierSection
              tier="VIP"
              partners={vipPartners}
              limit={TIER_LIMITS.VIP}
              onPartnerClick={(id) => router.push(`/partners/${id}`)}
              onShowAll={() => { setServiceType(""); setRegion(""); setKeyword(""); }}
            />
          )}

          {/* PREMIUM - 3열 가로형 */}
          {premiumPartners.length > 0 && (
            <TierSection
              tier="PREMIUM"
              partners={premiumPartners}
              limit={TIER_LIMITS.PREMIUM}
              onPartnerClick={(id) => router.push(`/partners/${id}`)}
              onShowAll={() => { setServiceType(""); setRegion(""); setKeyword(""); }}
            />
          )}

          {/* BASIC - 2열 줄광고 */}
          {basicPartners.length > 0 && (
            <TierSection
              tier="BASIC"
              partners={basicPartners}
              limit={TIER_LIMITS.BASIC}
              onPartnerClick={(id) => router.push(`/partners/${id}`)}
              onShowAll={() => { setServiceType(""); setRegion(""); setKeyword(""); }}
            />
          )}

          {/* 무료 - 텍스트 리스트 */}
          <FreeSection
            partners={freePartners}
            total={freeTotal}
            page={freePage}
            totalPages={freeTotalPages}
            onPageChange={setFreePage}
            onPartnerClick={(id) => router.push(`/partners/${id}`)}
          />
        </>
      )}

      {/* 하단 등록 유도 배너 */}
      <div className="mt-10">
        <RegisterPromoBanner type="partner" />
      </div>
    </div>
  );
}

/* ===== VIP / PREMIUM / BASIC 섹션 ===== */

function TierSection({
  tier,
  partners,
  limit,
  onPartnerClick,
  onShowAll,
}: {
  tier: "VIP" | "PREMIUM" | "BASIC";
  partners: Partner[];
  limit: number;
  onPartnerClick: (id: string) => void;
  onShowAll: () => void;
}) {
  const displayed = partners.slice(0, limit);
  const hasMore = partners.length > limit;

  /* ── VIP 섹션 ── */
  if (tier === "VIP") {
    return (
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-lg">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-white text-sm font-extrabold tracking-wide">VIP</span>
          </div>
          <span className="text-sm text-amber-600/80 dark:text-amber-400/80 font-medium">프리미엄 파트너</span>
          {hasMore && (
            <button onClick={onShowAll} className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">더보기 &rarr;</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_4px_24px_rgba(245,158,11,0.08)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => onPartnerClick(p.id)}
            >
              <div className="flex">
                <div className="w-44 h-40 shrink-0 bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-950/30 dark:to-gray-800 relative">
                  {p.images.length > 0 ? (
                    <Image src={p.images[0].url} alt={p.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-black text-5xl text-amber-300/60 dark:text-amber-600/40">{p.companyName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-amber-500/90 text-white text-[9px] font-bold rounded">AD</div>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-lg leading-tight truncate">{p.companyName}</h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                      {SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}
                      {p.serviceArea.length > 0 && ` · ${p.serviceArea.slice(0, 2).join(", ")}`}
                    </p>
                    {p.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">{p.description}</p>
                    )}
                  </div>
                  {p.serviceArea.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {p.serviceArea.slice(0, 3).map((area) => (
                        <span key={area} className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold rounded-full border border-amber-200 dark:border-amber-800">{area}</span>
                      ))}
                    </div>
                  )}
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
          <span className="text-sm text-indigo-500/80 dark:text-indigo-400/80 font-medium">추천 파트너</span>
          {hasMore && (
            <button onClick={onShowAll} className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">더보기 &rarr;</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {displayed.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden cursor-pointer shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_4px_20px_rgba(99,102,241,0.06)] hover:shadow-[0_8px_25px_rgba(99,102,241,0.12)] hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => onPartnerClick(p.id)}
            >
              <div className="flex">
                <div className="w-28 h-28 shrink-0 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-gray-800 relative">
                  {p.images.length > 0 ? (
                    <Image src={p.images[0].url} alt={p.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-bold text-3xl text-indigo-300/60 dark:text-indigo-600/40">{p.companyName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{p.companyName}</h3>
                    <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">
                      {SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}
                      {p.serviceArea.length > 0 && ` · ${p.serviceArea.slice(0, 2).join(", ")}`}
                    </p>
                    {p.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>
                    )}
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
        <span className="text-sm text-blue-500/80 dark:text-blue-400/80 font-medium">등록 업체</span>
        {hasMore && (
          <button onClick={onShowAll} className="ml-auto text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">더보기 &rarr;</button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {displayed.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
            onClick={() => onPartnerClick(p.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{p.companyName}</p>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">·</span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}</span>
              </div>
              {p.serviceArea.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{p.serviceArea.slice(0, 2).join(", ")}</p>
              )}
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
  partners,
  total,
  page,
  totalPages,
  onPageChange,
  onPartnerClick,
}: {
  partners: Partner[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPartnerClick: (id: string) => void;
}) {
  if (total === 0 && partners.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-gray-500 dark:text-gray-400">일반 업체</h2>
          <span className="text-sm text-gray-300 dark:text-gray-600">{total}개</span>
        </div>
        <a href="/pricing" className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
          광고 등록으로 상단 노출 &rarr;
        </a>
      </div>
      <div className="space-y-0">
        {partners.map((p) => (
          <div
            key={p.id}
            className="flex items-center py-2.5 px-3 rounded-lg hover:bg-white dark:hover:bg-gray-800 cursor-pointer transition-colors"
            onClick={() => onPartnerClick(p.id)}
          >
            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mr-3">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{p.companyName.charAt(0)}</span>
            </div>
            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium mr-2 shrink-0">{p.companyName}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}</span>
            {p.serviceArea.length > 0 && (
              <span className="text-xs text-gray-300 dark:text-gray-600 ml-auto shrink-0">{p.serviceArea.slice(0, 2).join(", ")}</span>
            )}
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
  onPartnerClick,
}: {
  results: Partner[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPartnerClick: (id: string) => void;
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
          {results.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
              onClick={() => onPartnerClick(p.id)}
            >
              {p.tier !== "FREE" && (
                <div className="w-16 h-12 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                  {p.images.length > 0 ? (
                    <Image src={p.images[0].url} alt={p.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-400">{p.companyName.charAt(0)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.companyName}</p>
                  {tierBadge(p.tier)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}
                  {p.serviceArea.length > 0 && ` · ${p.serviceArea.slice(0, 2).join(", ")}`}
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
