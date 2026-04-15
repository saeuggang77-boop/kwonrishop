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
    // setTimeout 제거 - 변경된 값을 직접 사용하여 stale closure 방지
    const newServiceType = type === "serviceType" ? value : serviceType;
    const newRegion = type === "region" ? value : region;
    if (newServiceType || newRegion || keyword) {
      setIsSearchMode(true);
      setSearchPage(1);
    } else {
      setIsSearchMode(false);
    }
  }

  function clearSearch() {
    setKeyword("");
    setServiceType("");
    setRegion("");
    setIsSearchMode(false);
  }

  return (
    <div>
      {/* 히어로 */}
      <div className="bg-green-700 text-cream pt-14 pb-20 relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-terra-500/10 blur-3xl" />
        <div className="max-w-6xl mx-auto px-4 text-center relative">
          <div className="text-xs font-semibold text-terra-300 tracking-[0.2em] uppercase mb-3">Partners</div>
          <h1 className="font-extrabold text-cream text-3xl md:text-5xl tracking-tight mb-3 leading-tight">
            창업을 함께할 <span className="font-light text-terra-300">전문가</span>
          </h1>
          <p className="text-cream/60 text-sm md:text-base">인테리어·세무·마케팅 등 검증된 협력업체</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

      {/* 필터 바 */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-10 bg-cream-elev rounded-3xl p-3 border border-line">
        <input
          type="text"
          placeholder="업체명, 서비스 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 min-w-[160px] px-4 py-2.5 border border-line bg-cream text-ink rounded-full text-sm focus:ring-2 focus:ring-green-700 focus:border-green-700 outline-none"
        />
        <select
          value={serviceType}
          onChange={(e) => handleFilterChange("serviceType", e.target.value)}
          className="px-4 py-2.5 border border-line bg-cream text-ink rounded-full text-sm focus:ring-2 focus:ring-green-700 outline-none font-medium"
        >
          <option value="">서비스 전체</option>
          {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => handleFilterChange("region", e.target.value)}
          className="px-4 py-2.5 border border-line bg-cream text-ink rounded-full text-sm focus:ring-2 focus:ring-green-700 outline-none font-medium"
        >
          <option value="">지역 전체</option>
          {REGION_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
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
          onPartnerClick={(id) => router.push(`/partners/${id}`)}
        />
      ) : (
        /* ===== 브라우즈 모드 (2계층: 추천 + 전체) ===== */
        <>
          {/* 추천 업체 (VIP + PREMIUM 통합) */}
          {(vipPartners.length > 0 || premiumPartners.length > 0) && (
            <section className="mb-16">
              <div className="mb-8">
                <div className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                  <span className="w-6 h-px bg-terra-500" />
                  Featured Partners
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight">
                  추천 <span className="font-light text-terra-500">협력업체</span>
                </h2>
              </div>
              {vipPartners.length > 0 && (
                <TierSection
                  tier="VIP"
                  partners={vipPartners}
                  limit={TIER_LIMITS.VIP}
                  onPartnerClick={(id) => router.push(`/partners/${id}`)}
                  onShowAll={() => { setServiceType(""); setRegion(""); setKeyword(""); }}
                  hideHeader
                />
              )}
              {premiumPartners.length > 0 && (
                <TierSection
                  tier="PREMIUM"
                  partners={premiumPartners}
                  limit={TIER_LIMITS.PREMIUM}
                  onPartnerClick={(id) => router.push(`/partners/${id}`)}
                  onShowAll={() => { setServiceType(""); setRegion(""); setKeyword(""); }}
                  hideHeader
                />
              )}
            </section>
          )}

          {/* 전체 업체 (BASIC + FREE 통합) */}
          {(basicPartners.length > 0 || freePartners.length > 0) && (
            <section>
              <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
                <div>
                  <div className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                    <span className="w-6 h-px bg-terra-500" />
                    All Partners
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight">
                    전체 <span className="font-light text-terra-500">업체</span>
                  </h2>
                </div>
                <a href="/pricing?tab=PARTNER" className="text-xs text-muted hover:text-terra-500 transition-colors">광고 등록으로 상단 노출 →</a>
              </div>
              {basicPartners.length > 0 && (
                <TierSection
                  tier="BASIC"
                  partners={basicPartners}
                  limit={TIER_LIMITS.BASIC}
                  onPartnerClick={(id) => router.push(`/partners/${id}`)}
                  onShowAll={() => { setServiceType(""); setRegion(""); setKeyword(""); }}
                  hideHeader
                />
              )}
              <FreeSection
                partners={freePartners}
                total={freeTotal}
                page={freePage}
                totalPages={freeTotalPages}
                onPageChange={setFreePage}
                onPartnerClick={(id) => router.push(`/partners/${id}`)}
                hideHeader
              />
            </section>
          )}
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
  hideHeader = false,
}: {
  tier: "VIP" | "PREMIUM" | "BASIC";
  partners: Partner[];
  limit: number;
  onPartnerClick: (id: string) => void;
  onShowAll: () => void;
  hideHeader?: boolean;
}) {
  const displayed = partners.slice(0, limit);
  const hasMore = partners.length > limit;

  /* ── VIP 섹션 ── */
  if (tier === "VIP") {
    return (
      <div className="mb-10">
        {!hideHeader && (
          <div className="flex items-end justify-between gap-3 mb-6 flex-wrap">
            <div>
              <div className="text-xs font-semibold text-terra-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                <span className="w-6 h-px bg-terra-500" />
                VIP Partners
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight">
                프리미엄 <span className="font-light text-terra-500">파트너</span>
              </h2>
            </div>
            {hasMore && (
              <button onClick={onShowAll} className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors whitespace-nowrap">더보기 →</button>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayed.map((p) => (
            <div
              key={p.id}
              className="bg-cream-elev rounded-3xl overflow-hidden cursor-pointer border-2 border-green-700 shadow-[0_8px_32px_rgba(31,63,46,0.10)] hover:shadow-[0_16px_40px_rgba(31,63,46,0.14)] hover:-translate-y-1 transition-all duration-300"
              onClick={() => onPartnerClick(p.id)}
            >
              <div className="flex">
                <div className="w-44 h-40 shrink-0 bg-green-800 relative">
                  {p.images.length > 0 ? (
                    <Image src={p.images[0].url} alt={p.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-extrabold text-5xl text-terra-300">{p.companyName.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 inline-flex items-center px-3 py-1 bg-terra-500 text-cream text-[10px] font-bold rounded-full tracking-wider">
                    VIP
                  </div>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-extrabold text-ink text-lg leading-tight truncate tracking-tight">{p.companyName}</h3>
                    <p className="text-xs text-terra-500 font-semibold mt-1">
                      {SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}
                      {p.serviceArea.length > 0 && ` · ${p.serviceArea.slice(0, 2).join(", ")}`}
                    </p>
                    {p.description && (
                      <p className="text-sm text-muted mt-2 line-clamp-2 leading-relaxed">{p.description}</p>
                    )}
                  </div>
                  {p.serviceArea.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {p.serviceArea.slice(0, 3).map((area) => (
                        <span key={area} className="px-2.5 py-0.5 bg-cream text-green-700 text-[10px] font-semibold rounded-full border border-line">{area}</span>
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
      <div className="mb-10">
        {!hideHeader && (
          <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-green-700 text-cream text-[10px] font-bold rounded-full tracking-wider">PREMIUM</span>
              <h3 className="text-lg font-bold text-ink tracking-tight">추천 파트너</h3>
            </div>
            {hasMore && (
              <button onClick={onShowAll} className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors">더보기 →</button>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayed.map((p) => (
            <div
              key={p.id}
              className="bg-cream rounded-3xl overflow-hidden cursor-pointer border-[1.5px] border-line-deep shadow-[0_2px_12px_rgba(31,63,46,0.06)] hover:shadow-[0_8px_24px_rgba(31,63,46,0.10)] hover:-translate-y-1 transition-all duration-300"
              onClick={() => onPartnerClick(p.id)}
            >
              <div className="flex">
                <div className="w-28 h-28 shrink-0 bg-cream-elev relative">
                  {p.images.length > 0 ? (
                    <Image src={p.images[0].url} alt={p.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-extrabold text-3xl text-green-700">{p.companyName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-ink text-sm truncate tracking-tight">{p.companyName}</h3>
                    <p className="text-[11px] text-terra-500 font-semibold mt-0.5">
                      {SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}
                      {p.serviceArea.length > 0 && ` · ${p.serviceArea.slice(0, 2).join(", ")}`}
                    </p>
                    {p.description && (
                      <p className="text-[11px] text-muted mt-1.5 line-clamp-2 leading-relaxed">{p.description}</p>
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
    <div className="mb-6">
      {!hideHeader && (
        <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full tracking-wider">BASIC</span>
            <h3 className="text-lg font-bold text-ink tracking-tight">등록 업체</h3>
          </div>
          {hasMore && (
            <button onClick={onShowAll} className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors">더보기 →</button>
          )}
        </div>
      )}
      <div className="bg-cream rounded-3xl border border-line overflow-hidden">
        {displayed.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-5 py-4 hover:bg-cream-elev cursor-pointer transition-colors group ${i !== 0 ? "border-t border-line" : ""}`}
            onClick={() => onPartnerClick(p.id)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-ink truncate">{p.companyName}</p>
                <span className="text-[11px] text-line-deep">·</span>
                <span className="text-[11px] text-terra-500 font-medium">{SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}</span>
              </div>
              {p.serviceArea.length > 0 && (
                <p className="text-xs text-muted mt-0.5">{p.serviceArea.slice(0, 2).join(", ")}</p>
              )}
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
  partners,
  total,
  page,
  totalPages,
  onPageChange,
  onPartnerClick,
  hideHeader = false,
}: {
  partners: Partner[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPartnerClick: (id: string) => void;
  hideHeader?: boolean;
}) {
  if (total === 0 && partners.length === 0) return null;

  return (
    <div className={hideHeader ? "" : "mb-10 border-t border-line pt-10"}>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider">일반 업체</h2>
            <span className="text-sm text-line-deep">{total}개</span>
          </div>
          <a href="/pricing?tab=PARTNER" className="text-xs text-muted hover:text-terra-500 transition-colors">
            광고 등록으로 상단 노출 →
          </a>
        </div>
      )}
      <div className="space-y-1">
        {partners.map((p) => (
          <div
            key={p.id}
            className="flex items-center py-2.5 px-3 rounded-2xl hover:bg-cream-elev cursor-pointer transition-colors"
            onClick={() => onPartnerClick(p.id)}
          >
            <div className="w-7 h-7 rounded-full bg-cream-elev flex items-center justify-center shrink-0 mr-3">
              <span className="text-[10px] font-light text-green-700">{p.companyName.charAt(0)}</span>
            </div>
            <span className="text-sm text-ink font-medium mr-2 shrink-0">{p.companyName}</span>
            <span className="text-xs text-muted shrink-0">{SERVICE_TYPE_LABELS[p.serviceType] || p.serviceType}</span>
            {p.serviceArea.length > 0 && (
              <span className="text-xs text-muted ml-auto shrink-0">{p.serviceArea.slice(0, 2).join(", ")}</span>
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
          {results.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onPartnerClick(p.id)}
            >
              {p.tier !== "FREE" && (
                <div className="w-16 h-12 shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                  {p.images.length > 0 ? (
                    <Image src={p.images[0].url} alt={p.companyName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-bold text-green-400">{p.companyName.charAt(0)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.companyName}</p>
                  {tierBadge(p.tier)}
                </div>
                <p className="text-xs text-gray-500">
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
