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
    <div>
      {/* Navy 배너 */}
      <div className="bg-navy-700 text-white pt-10 pb-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">협력업체</h1>
          <p className="text-navy-200 text-sm md:text-base">창업부터 운영까지 믿을 수 있는 전문 파트너</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

      {/* 필터 바 */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-10">
        <input
          type="text"
          placeholder="업체명, 서비스 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 min-w-[160px] px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500 outline-none"
        />
        <select
          value={serviceType}
          onChange={(e) => handleFilterChange("serviceType", e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
        >
          <option value="">서비스 전체</option>
          {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => handleFilterChange("region", e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
        >
          <option value="">지역 전체</option>
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-600 transition-colors"
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-700 rounded-lg">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-white text-sm font-bold tracking-wide">VIP</span>
          </div>
          <span className="text-sm text-navy-600 dark:text-navy-400 font-medium">프리미엄 파트너</span>
          {hasMore && (
            <button onClick={onShowAll} className="ml-auto text-sm text-navy-700 dark:text-navy-400 hover:text-navy-700">더보기 &rarr;</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden cursor-pointer border-2 border-navy-600 shadow-[0_4px_16px_rgba(27,73,101,0.15)] hover:shadow-[0_8px_28px_rgba(27,73,101,0.25)] hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => onPartnerClick(p.id)}
            >
              <div className="flex">
                <div className="w-44 h-40 shrink-0 bg-gray-100 dark:bg-gray-800 relative">
                  {p.images.length > 0 ? (
                    <Image src={p.images[0].url} alt={p.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-black text-5xl text-gray-300/60 dark:text-gray-600/40">{p.companyName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-navy-700/90 text-white text-[9px] font-bold rounded">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    VIP
                  </div>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-lg leading-tight truncate">{p.companyName}</h3>
                    <p className="text-xs text-navy-600 dark:text-navy-400 font-medium mt-1">
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
                        <span key={area} className="px-2 py-0.5 bg-navy-50 dark:bg-navy-950/30 text-navy-700 dark:text-navy-400 text-[10px] font-semibold rounded-full border border-navy-200 dark:border-navy-800">{area}</span>
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
          <div className="px-3 py-1.5 bg-navy-500 rounded-lg">
            <span className="text-white text-sm font-bold tracking-wide">PREMIUM</span>
          </div>
          <span className="text-sm text-navy-500/80 dark:text-navy-400/80 font-medium">추천 파트너</span>
          {hasMore && (
            <button onClick={onShowAll} className="ml-auto text-sm text-navy-700 dark:text-navy-400 hover:text-navy-700">더보기 &rarr;</button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {displayed.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden cursor-pointer border-[1.5px] border-navy-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => onPartnerClick(p.id)}
            >
              <div className="flex">
                <div className="w-28 h-28 shrink-0 bg-gray-100 dark:bg-gray-800 relative">
                  {p.images.length > 0 ? (
                    <Image src={p.images[0].url} alt={p.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-bold text-3xl text-gray-300/60 dark:text-gray-600/40">{p.companyName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{p.companyName}</h3>
                    <p className="text-[11px] text-navy-500 dark:text-navy-400 font-medium mt-0.5">
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
        <div className="px-3 py-1.5 bg-navy-500 rounded-lg">
          <span className="text-white text-sm font-extrabold tracking-wide">BASIC</span>
        </div>
        <span className="text-sm text-navy-500/80 dark:text-navy-400/80 font-medium">등록 업체</span>
        {hasMore && (
          <button onClick={onShowAll} className="ml-auto text-sm text-navy-700 dark:text-navy-400 hover:text-navy-700">더보기 &rarr;</button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {displayed.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-navy-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
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
            <span className="text-xs text-navy-500 dark:text-navy-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3">자세히 &rarr;</span>
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
        <a href="/pricing" className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-navy-500 dark:hover:text-navy-400 transition-colors">
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
    if (tier === "VIP") return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-navy-700 text-white text-[9px] font-bold rounded"><svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>VIP</span>;
    if (tier === "PREMIUM") return <span className="px-1.5 py-0.5 bg-navy-700/85 text-white text-[9px] font-bold rounded">PREMIUM</span>;
    if (tier === "BASIC") return <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-[9px] font-bold rounded">BASIC</span>;
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
                      <span className="text-sm font-bold text-navy-400">{p.companyName.charAt(0)}</span>
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
              ? "bg-navy-700 text-white"
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
