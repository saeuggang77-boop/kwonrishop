"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { RegisterPromoBanner } from "@/components/promotion/PromotionCTA";

interface FranchiseBrand {
  id: string;
  brandName: string;
  companyName: string;
  industry: string;
  franchiseFee: number | null;
  educationFee: number | null;
  depositFee: number | null;
  totalStores: number | null;
  avgRevenue: number | null;
  tier: "GOLD" | "SILVER" | "BRONZE" | null;
  ftcId: string | null;
  ftcRawData: any;
  managerId: string | null;
  logo: string | null;
  bannerImage: string | null;
}

// 업종 필터는 DB에서 동적으로 로드 (공정위 API 원본 데이터 기반)
const DEFAULT_INDUSTRIES = [{ value: "", label: "전체" }];

export default function FranchisePage() {
  const router = useRouter();
  const [brands, setBrands] = useState<FranchiseBrand[]>([]);
  const [featuredBrands, setFeaturedBrands] = useState<FranchiseBrand[]>([]);
  const [industries, setIndustries] = useState(DEFAULT_INDUSTRIES);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");
  const [sort, setSort] = useState("stores");

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (industry) params.set("industry", industry);
    if (keyword) params.set("search", keyword);
    params.set("sort", sort);

    const res = await fetch(`/api/franchise?${params}`);
    const data = await res.json();
    setBrands(data.brands || []);
    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, industry, keyword, sort]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    // 프리미엄 브랜드 + 업종 필터 동적 로드
    Promise.all([
      fetch("/api/franchise?featured=true").then((r) => r.json()),
      fetch("/api/franchise?limit=1000").then((r) => r.json()),
    ]).then(([featuredData, allData]) => {
      setFeaturedBrands(featuredData.brands || []);
      // DB에 존재하는 실제 업종값으로 필터 생성
      const allBrands = allData.brands || [];
      const uniqueIndustries = [...new Set(allBrands.map((b: FranchiseBrand) => b.industry).filter(Boolean))] as string[];
      if (uniqueIndustries.length > 0) {
        setIndustries([
          { value: "", label: "전체" },
          ...uniqueIndustries.sort().map((ind) => ({ value: ind, label: ind })),
        ]);
      }
    });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    // fetchBrands() 직접 호출 제거 - setPage(1)이 useCallback dep 변경 → useEffect 자동 트리거
    // keyword 변경만 있고 page가 이미 1이면 fetchBrands의 keyword dep가 이미 트리거함
  }

  function handleIndustryClick(value: string) {
    setIndustry(value);
    setPage(1);
  }

  const getTierBadge = (tier: FranchiseBrand["tier"]) => {
    if (!tier) return null;
    const colors = {
      GOLD: "bg-terra-500 text-cream",
      SILVER: "bg-green-700 text-cream",
      BRONZE: "bg-green-100 text-green-700",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier]}`}>
        {tier}
      </span>
    );
  };

  return (
    <div>
      {/* 히어로 */}
      <div className="bg-green-700 px-6 pb-20 pt-14 text-center relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-terra-500/10 blur-3xl" />
        <div className="relative">
          <div className="text-xs font-semibold text-terra-300 tracking-[0.2em] uppercase mb-3">Franchise Directory</div>
          <h1 className="font-extrabold text-cream text-3xl md:text-5xl tracking-tight mb-3 leading-tight">
            검증된 <span className="font-serif italic font-light text-terra-300">프랜차이즈</span>
          </h1>
          <p className="text-sm text-cream/60">공정위 등록 {total.toLocaleString()}개 브랜드 · 숫자로 확인하세요</p>
        </div>
      </div>

      {/* 플로팅 검색바 */}
      <div className="mx-auto max-w-2xl px-4 -mt-6 relative z-10">
        <form onSubmit={handleSearch} className="flex gap-2 bg-white rounded-xl shadow-lg p-1.5">
          <input
            type="text"
            placeholder="브랜드명, 업종 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 transition-colors shrink-0"
          >
            검색
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Industry Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', maskImage: 'linear-gradient(to right, black 92%, transparent 100%)' }}>
        {industries.map((ind) => (
          <button
            key={ind.value}
            onClick={() => handleIndustryClick(ind.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              industry === ind.value
                ? "bg-green-700 text-cream shadow-[0_4px_12px_rgba(31,63,46,0.2)]"
                : "bg-cream border border-line text-ink hover:border-green-700"
            }`}
          >
            {ind.label}
          </button>
        ))}
      </div>

      {/* 프리미엄 프랜차이즈 - 2열 그리드 */}
      {featuredBrands.length > 0 && (
        <div className="mb-10">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <div className="text-xs font-semibold text-terra-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                <span className="w-6 h-px bg-terra-500" />
                Premium
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight">
                프리미엄 <span className="font-serif italic font-light text-terra-500">프랜차이즈</span>
              </h2>
              <p className="text-sm text-muted mt-1.5">검증된 유료 브랜드를 먼저 확인하세요</p>
            </div>
            <span className="text-sm font-medium text-green-700">{featuredBrands.length}개</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredBrands.map((brand) => {
              const tier = brand.tier || "BRONZE";

              const brandInitial = brand.brandName.charAt(0);

              if (tier === "GOLD") {
                return (
                  <div
                    key={brand.id}
                    onClick={() => router.push(`/franchise/${brand.id}`)}
                    className="border-2 border-green-700 bg-cream-elev rounded-3xl p-4 cursor-pointer hover:shadow-[0_16px_40px_rgba(31,63,46,0.14)] hover:-translate-y-1 transition-all"
                  >
                    {brand.bannerImage ? (
                      <img src={brand.bannerImage} alt={brand.brandName} className="w-full h-24 rounded-2xl object-cover mb-3" />
                    ) : (
                      <div className="w-full h-24 rounded-2xl bg-green-700 flex items-center justify-center mb-3">
                        <span className="text-3xl font-serif italic font-light text-terra-300">{brandInitial}</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-ink truncate">{brand.brandName}</h3>
                        <p className="text-xs text-muted truncate">{brand.companyName}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-terra-500 text-cream ml-2 shrink-0 tracking-wider">GOLD</span>
                    </div>
                    {brand.totalStores !== null && (
                      <p className="text-xs text-green-700 font-semibold mb-2">매장 {brand.totalStores.toLocaleString()}개</p>
                    )}
                    <div className="flex gap-2 text-[10px] text-muted">
                      <span>가맹점 지도</span>
                      <span className="text-line-deep">·</span>
                      <span>비용 계산기</span>
                      <span className="text-line-deep">·</span>
                      <span>상담</span>
                    </div>
                  </div>
                );
              }

              if (tier === "SILVER") {
                return (
                  <div
                    key={brand.id}
                    onClick={() => router.push(`/franchise/${brand.id}`)}
                    className="border-[1.5px] border-line-deep bg-cream rounded-3xl p-4 cursor-pointer hover:shadow-[0_8px_24px_rgba(31,63,46,0.10)] hover:-translate-y-1 transition-all"
                  >
                    <div className="w-full h-20 rounded-2xl bg-cream-elev flex items-center justify-center mb-3">
                      <span className="text-2xl font-serif italic font-light text-green-700">{brandInitial}</span>
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-ink truncate">{brand.brandName}</h3>
                        <p className="text-xs text-muted truncate">{brand.companyName}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-700 text-cream ml-2 shrink-0 tracking-wider">SILVER</span>
                    </div>
                    {brand.totalStores !== null && (
                      <p className="text-xs text-green-700 font-semibold mb-2">매장 {brand.totalStores.toLocaleString()}개</p>
                    )}
                    <div className="flex gap-2 text-[10px] text-muted">
                      <span>비용 계산기</span>
                      <span className="text-line-deep">·</span>
                      <span>상담</span>
                    </div>
                  </div>
                );
              }

              // BRONZE
              return (
                <div
                  key={brand.id}
                  onClick={() => router.push(`/franchise/${brand.id}`)}
                  className="border border-line bg-cream rounded-3xl p-4 cursor-pointer hover:shadow-[0_4px_16px_rgba(31,63,46,0.08)] hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-cream-elev flex items-center justify-center shrink-0">
                      <span className="text-lg font-serif italic font-light text-green-700">{brandInitial}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-ink truncate">{brand.brandName}</h3>
                      <p className="text-xs text-muted truncate">{brand.companyName}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 ml-1 shrink-0 tracking-wider">BRONZE</span>
                  </div>
                  {brand.totalStores !== null && (
                    <p className="text-xs text-muted mb-1">매장 {brand.totalStores.toLocaleString()}개 · 상담 가능</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result Count + Sort */}
      <div className="mb-5 flex items-center justify-between border-t border-line pt-6">
        <p className="text-sm text-muted">
          전체 <span className="font-serif italic font-medium text-green-700 text-lg">{total.toLocaleString()}</span>개 브랜드
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 text-sm border border-line bg-cream rounded-full focus:ring-2 focus:ring-green-700 focus:border-green-700 outline-none font-medium"
        >
          <option value="stores">매장수 많은순</option>
          <option value="revenue">평균매출 높은순</option>
          <option value="fee_asc">가맹비 낮은순</option>
          <option value="recent">최근등록순</option>
        </select>
      </div>

      {/* Brand List - 밀집형 테이블 */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 animate-pulse border-b border-gray-50" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">등록된 브랜드가 없습니다</p>
          <p className="text-sm">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* 테이블 헤더 */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">
            <div className="col-span-4">브랜드</div>
            <div className="col-span-3">업종</div>
            <div className="col-span-2 text-right">매장수</div>
            <div className="col-span-3 text-right">평균매출</div>
          </div>
          {/* 행 */}
          {brands.map((brand, idx) => (
            <div
              key={brand.id}
              onClick={() => router.push(`/franchise/${brand.id}`)}
              className={`grid grid-cols-12 gap-2 px-4 py-3 cursor-pointer hover:bg-green-50/50 transition-colors items-center ${idx < brands.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="col-span-12 sm:col-span-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                    {brand.brandName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{brand.brandName}</p>
                    <p className="text-[11px] text-gray-400 truncate">{brand.companyName}</p>
                  </div>
                </div>
              </div>
              <div className="col-span-4 sm:col-span-3 flex items-center">
                <span className="text-xs text-gray-500 truncate">{brand.industry}</span>
              </div>
              <div className="col-span-4 sm:col-span-2 text-right">
                <span className="text-sm font-medium text-gray-900">
                  {brand.totalStores !== null ? `${brand.totalStores.toLocaleString()}개` : '-'}
                </span>
              </div>
              <div className="col-span-4 sm:col-span-3 text-right">
                <span className="text-sm font-medium text-gray-900">
                  {brand.avgRevenue !== null && brand.avgRevenue > 0 ? <>{brand.avgRevenue.toLocaleString()}<span className="text-xs text-gray-400">만원</span></> : '-'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-8">
          {(() => {
            const windowSize = 5;
            let start = Math.max(1, page - Math.floor(windowSize / 2));
            const end = Math.min(totalPages, start + windowSize - 1);
            if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
            const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            return (
              <>
                <button onClick={() => setPage(1)} disabled={page === 1} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="첫 페이지">&laquo;</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="이전 페이지">&lsaquo;</button>
                {pages.map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} aria-label={`${p}페이지`} aria-current={page === p ? "page" : undefined}>{p}</button>
                ))}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="다음 페이지">&rsaquo;</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="마지막 페이지">&raquo;</button>
              </>
            );
          })()}
        </div>
      )}

      {/* 하단 등록 유도 배너 */}
      <div className="mt-10">
        <RegisterPromoBanner type="franchise" />
      </div>
      </div>
    </div>
  );
}
