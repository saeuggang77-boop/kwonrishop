"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { RegisterPromoBanner } from "@/components/promotion/PromotionCTA";

function PlanFeature({ enabled, text, highlight, bold }: { enabled?: boolean; text: string; highlight?: "orange" | "gray" | "yellow"; bold?: boolean }) {
  const highlightColor = highlight === "orange" ? "text-orange-600 dark:text-orange-400" : highlight === "gray" ? "text-gray-600 dark:text-gray-300" : highlight === "yellow" ? "text-yellow-600 dark:text-yellow-400" : "";
  return (
    <div className="flex items-center gap-2">
      {enabled ? (
        <svg className="w-4.5 h-4.5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
      ) : (
        <svg className="w-4.5 h-4.5 text-gray-300 dark:text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6"/></svg>
      )}
      <span className={`text-sm ${enabled ? (highlightColor || "text-gray-700 dark:text-gray-300") : "text-gray-400 dark:text-gray-500"} ${bold ? "font-semibold" : ""}`}>{text}</span>
    </div>
  );
}

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
    fetchBrands();
  }

  function handleIndustryClick(value: string) {
    setIndustry(value);
    setPage(1);
  }

  const getTierBadge = (tier: FranchiseBrand["tier"]) => {
    if (!tier) return null;
    const colors = {
      GOLD: "bg-yellow-100 text-yellow-800",
      SILVER: "bg-gray-100 text-gray-800",
      BRONZE: "bg-orange-100 text-orange-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier]}`}>
        {tier}
      </span>
    );
  };

  return (
    <div>
      {/* 네이비 헤더 */}
      <div className="bg-gradient-to-br from-navy-dark to-navy px-6 pb-16 pt-10 text-center">
        <h1 className="text-2xl font-extrabold text-white mb-2">프랜차이즈 브랜드</h1>
        <p className="text-sm text-white/60">공정위 등록 {total.toLocaleString()}개 브랜드 · 검증된 창업 정보</p>
      </div>

      {/* 플로팅 검색바 */}
      <div className="mx-auto max-w-2xl px-4 -mt-6 relative z-10">
        <form onSubmit={handleSearch} className="flex gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-1.5">
          <input
            type="text"
            placeholder="브랜드명, 업종 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-3 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:text-white"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            검색
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Industry Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {industries.map((ind) => (
          <button
            key={ind.value}
            onClick={() => handleIndustryClick(ind.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              industry === ind.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {ind.label}
          </button>
        ))}
      </div>

      {/* 프랜차이즈 등록 유도 배너 */}
      <div className="mb-6">
        <RegisterPromoBanner type="franchise" />
      </div>

      {/* 프리미엄 프랜차이즈 - 2열 그리드 */}
      {featuredBrands.length > 0 && (
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">프리미엄 프랜차이즈</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">검증된 유료 브랜드를 먼저 확인하세요</p>
            </div>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{featuredBrands.length}개</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featuredBrands.map((brand) => {
              const tier = brand.tier || "BRONZE";

              if (tier === "GOLD") {
                return (
                  <div
                    key={brand.id}
                    onClick={() => router.push(`/franchise/${brand.id}`)}
                    className="border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    {brand.bannerImage ? (
                      <img src={brand.bannerImage} alt={brand.brandName} className="w-full h-20 rounded-lg object-cover mb-3" />
                    ) : (
                      <div className="w-full h-20 rounded-lg bg-yellow-200/50 dark:bg-yellow-800/30 flex items-center justify-center mb-3">
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">브랜드 이미지</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{brand.brandName}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{brand.companyName}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ml-2 shrink-0">GOLD</span>
                    </div>
                    {brand.totalStores !== null && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">매장 {brand.totalStores.toLocaleString()}개</p>
                    )}
                    <div className="flex gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span>📍가맹점 지도</span>
                      <span>🧮비용 계산기</span>
                      <span>💬상담 가능</span>
                    </div>
                  </div>
                );
              }

              if (tier === "SILVER") {
                return (
                  <div
                    key={brand.id}
                    onClick={() => router.push(`/franchise/${brand.id}`)}
                    className="border-2 border-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex gap-1 mb-3">
                      <div className="flex-1 h-14 rounded bg-gray-200 dark:bg-gray-600" />
                      <div className="flex-1 h-14 rounded bg-gray-200 dark:bg-gray-600" />
                      <div className="flex-1 h-14 rounded bg-gray-200 dark:bg-gray-600" />
                    </div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{brand.brandName}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{brand.companyName}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 ml-2 shrink-0">SILVER</span>
                    </div>
                    {brand.totalStores !== null && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">매장 {brand.totalStores.toLocaleString()}개</p>
                    )}
                    <div className="flex gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                      <span>🧮비용 계산기</span>
                      <span>💬상담 가능</span>
                    </div>
                  </div>
                );
              }

              // BRONZE
              return (
                <div
                  key={brand.id}
                  onClick={() => router.push(`/franchise/${brand.id}`)}
                  className="border-2 border-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{brand.brandName}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{brand.companyName}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 ml-2 shrink-0">BRONZE</span>
                  </div>
                  {brand.totalStores !== null && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">매장 {brand.totalStores.toLocaleString()}개</p>
                  )}
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    <span>💬상담 가능</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Result Count + Sort */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{total.toLocaleString()}</span>개 브랜드
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="stores">매장수 많은순</option>
          <option value="revenue">평균매출 높은순</option>
          <option value="fee_asc">가맹비 낮은순</option>
          <option value="recent">최근등록순</option>
        </select>
      </div>

      {/* Brand Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">등록된 브랜드가 없습니다</p>
          <p className="text-sm">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => {
            const hasManager = !!brand.managerId;
            return (
              <div
                key={brand.id}
                onClick={() => router.push(`/franchise/${brand.id}`)}
                className={`bg-white rounded-xl border ${hasManager ? 'border-blue-200' : 'border-gray-200'} p-6 hover:shadow-lg transition-all cursor-pointer relative`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-full ${hasManager ? 'bg-blue-100' : 'bg-gray-100'} flex items-center justify-center ${hasManager ? 'text-blue-600' : 'text-gray-600'} font-bold text-lg`}>
                    {brand.brandName.charAt(0)}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {brand.ftcId && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        공정위 등록
                      </span>
                    )}
                    {hasManager && (
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                        본사 인증
                      </span>
                    )}
                    {getTierBadge(brand.tier)}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{brand.brandName}</h3>
                <p className="text-sm text-gray-600 mb-4">{brand.companyName}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">업종</span>
                    <span className="font-medium text-gray-900">{brand.industry}</span>
                  </div>
                  {brand.franchiseFee !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">가맹비</span>
                      <span className="font-medium text-gray-900">
                        {brand.franchiseFee.toLocaleString()}만원
                      </span>
                    </div>
                  )}
                  {brand.totalStores !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">매장수</span>
                      <span className="font-medium text-gray-900">
                        {brand.totalStores.toLocaleString()}개
                      </span>
                    </div>
                  )}
                  {brand.avgRevenue !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">평균 매출</span>
                      <span className="font-medium text-gray-900">
                        {brand.avgRevenue.toLocaleString()}만원
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  {hasManager ? (
                    <p className="text-xs text-blue-600 font-medium">💬 본사 상담 가능</p>
                  ) : brand.ftcRawData ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("공정위 정보공개서 보기 기능은 상세페이지에서 확인할 수 있습니다");
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      📋 공정위 정보 보기
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
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
                  <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`} aria-label={`${p}페이지`} aria-current={page === p ? "page" : undefined}>{p}</button>
                ))}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="다음 페이지">&rsaquo;</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="마지막 페이지">&raquo;</button>
              </>
            );
          })()}
        </div>
      )}

      {/* 기능 비교표 - 카드형 */}
      <div className="mt-12 mb-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">프랜차이즈 등록 플랜 비교</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">우리 브랜드에 맞는 최적의 플랜을 선택하세요</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 무료 */}
          <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mb-2">FREE</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">무료</h3>
              <div className="mt-1"><span className="text-3xl font-extrabold text-gray-900 dark:text-white">0</span><span className="text-gray-500 text-sm">원/월</span></div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2.5">
              <PlanFeature enabled text="목록 노출" />
              <PlanFeature enabled text="기본 검색순위" />
              <PlanFeature text="티어 배지" />
              <PlanFeature text="프리미엄 영역" />
              <PlanFeature text="브랜드 편집" />
              <PlanFeature text="문의 상담" />
              <PlanFeature text="비용 계산기" />
              <PlanFeature text="메인페이지 노출" />
              <PlanFeature text="가맹점 지도" />
            </div>
          </div>

          {/* 브론즈 */}
          <div className="rounded-xl border-2 border-orange-200 dark:border-orange-800 p-5 bg-orange-50/30 dark:bg-orange-950/20 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 mb-2">BRONZE</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">브론즈</h3>
              <div className="mt-1"><span className="text-3xl font-extrabold text-gray-900 dark:text-white">30</span><span className="text-gray-500 text-sm">만원/월</span></div>
            </div>
            <div className="border-t border-orange-100 dark:border-orange-900 pt-4 space-y-2.5">
              <PlanFeature enabled text="목록 노출" />
              <PlanFeature enabled text="검색순위 +1" highlight="orange" />
              <PlanFeature enabled text="BRONZE 배지" highlight="orange" />
              <PlanFeature enabled text="하단 프리미엄 영역" />
              <PlanFeature enabled text="텍스트 브랜드 편집" />
              <PlanFeature enabled text="문의 상담" />
              <PlanFeature text="비용 계산기" />
              <PlanFeature text="메인페이지 노출" />
              <PlanFeature text="가맹점 지도" />
            </div>
            <button onClick={() => router.push("/pricing?tab=franchise")} className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-colors">등록하기</button>
          </div>

          {/* 실버 */}
          <div className="rounded-xl border-2 border-gray-300 dark:border-gray-600 p-5 bg-gray-50/50 dark:bg-gray-750/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 mb-2">SILVER</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">실버</h3>
              <div className="mt-1"><span className="text-3xl font-extrabold text-gray-900 dark:text-white">60</span><span className="text-gray-500 text-sm">만원/월</span></div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2.5">
              <PlanFeature enabled text="목록 노출" />
              <PlanFeature enabled text="검색순위 +2" highlight="gray" />
              <PlanFeature enabled text="SILVER 배지" highlight="gray" />
              <PlanFeature enabled text="중단 프리미엄 영역" />
              <PlanFeature enabled text="텍스트 + 이미지 3장" />
              <PlanFeature enabled text="문의 상담" />
              <PlanFeature enabled text="비용 계산기" />
              <PlanFeature text="메인페이지 노출" />
              <PlanFeature text="가맹점 지도" />
            </div>
            <button onClick={() => router.push("/pricing?tab=franchise")} className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold bg-gray-500 hover:bg-gray-600 text-white transition-colors">등록하기</button>
          </div>

          {/* 골드 */}
          <div className="rounded-xl border-2 border-yellow-400 dark:border-yellow-600 p-5 relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-yellow-100/50 to-yellow-50 dark:from-yellow-950/30 dark:via-yellow-900/20 dark:to-yellow-950/30"></div>
            <div className="absolute top-3 right-3"><span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500 text-white">BEST</span></div>
            <div className="relative text-center mb-5">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 mb-2">GOLD</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">골드</h3>
              <div className="mt-1"><span className="text-3xl font-extrabold text-gray-900 dark:text-white">100</span><span className="text-gray-500 text-sm">만원/월</span></div>
            </div>
            <div className="relative border-t border-yellow-200 dark:border-yellow-800 pt-4 space-y-2.5">
              <PlanFeature enabled text="목록 노출" />
              <PlanFeature enabled text="검색순위 +3 (최상위)" highlight="yellow" />
              <PlanFeature enabled text="GOLD 배지" highlight="yellow" />
              <PlanFeature enabled text="최상단 프리미엄 영역" bold />
              <PlanFeature enabled text="이미지 무제한 + 영상" bold />
              <PlanFeature enabled text="문의 상담" />
              <PlanFeature enabled text="비용 계산기" />
              <PlanFeature enabled text="메인페이지 노출" bold />
              <PlanFeature enabled text="가맹점 지도" bold />
            </div>
            <button onClick={() => router.push("/pricing?tab=franchise")} className="relative mt-5 w-full py-2.5 rounded-lg text-sm font-semibold bg-yellow-500 hover:bg-yellow-600 text-white transition-colors">등록하기</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
