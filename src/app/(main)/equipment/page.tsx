"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_CONDITION_LABELS, TRADE_METHOD_LABELS } from "@/lib/constants";
import PremiumCarousel from "@/components/shared/PremiumCarousel";
import EquipmentCard from "@/components/equipment/EquipmentCard";
import Image from "next/image";

interface Equipment {
  id: string;
  title: string;
  price: number;
  negotiable: boolean;
  condition: string;
  category: string;
  tradeMethod: string;
  addressRoad: string | null;
  addressJibun: string | null;
  viewCount: number;
  favoriteCount: number;
  images: { url: string }[];
  user: {
    name: string | null;
    image: string | null;
  };
}

export default function EquipmentListPage() {
  const router = useRouter();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [featuredEquipments, setFeaturedEquipments] = useState<Equipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [tradeMethod, setTradeMethod] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("latest");

  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (keyword) params.set("keyword", keyword);
    if (category) params.set("category", category);
    if (condition) params.set("condition", condition);
    if (tradeMethod) params.set("tradeMethod", tradeMethod);
    if (priceMin) params.set("minPrice", priceMin);
    if (priceMax) params.set("maxPrice", priceMax);
    if (sort) params.set("sort", sort);

    try {
      const res = await fetch(`/api/equipment?${params}`);
      const data = await res.json();
      setEquipments(data.equipment || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setEquipments([]);
    }
    setLoading(false);
  }, [page, keyword, category, condition, tradeMethod, priceMin, priceMax, sort]);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  useEffect(() => {
    fetch("/api/equipment?featured=true")
      .then((r) => r.json())
      .then((data) => setFeaturedEquipments(data.equipment || []))
      .catch(() => {});
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setPage(1);
  }

  function handleConditionChange(value: string) {
    setCondition(value);
    setPage(1);
  }

  function handleTradeMethodChange(value: string) {
    setTradeMethod(value);
    setPage(1);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">집기장터</h1>
        <p className="text-gray-600 dark:text-gray-400">사업자 인증된 사장님들의 중고 집기 직거래</p>
      </div>

      {/* 프리미엄 집기 캐러셀 */}
      <PremiumCarousel
        title="프리미엄 집기"
        subtitle="검증된 판매자의 추천 집기를 먼저 확인하세요"
        count={featuredEquipments.length}
      >
        {featuredEquipments.map((eq) => (
          <div
            key={eq.id}
            onClick={() => router.push(`/equipment/${eq.id}`)}
            className="min-w-[280px] max-w-[280px] snap-start rounded-xl border-2 border-blue-400 bg-blue-50 dark:bg-blue-900/20 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow shrink-0"
          >
            <div className="relative h-36 bg-gray-100 dark:bg-gray-700">
              {eq.images.length > 0 ? (
                <Image src={eq.images[0].url} alt={eq.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {eq.price === 0 && (
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">나눔</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{eq.title}</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                {eq.price === 0 ? "무료 나눔" : `${eq.price.toLocaleString()}원`}
                {eq.negotiable && eq.price > 0 && <span className="text-xs text-gray-400 ml-1">협의가능</span>}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category}
              </p>
            </div>
          </div>
        ))}
      </PremiumCarousel>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="집기명, 브랜드 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            검색
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">카테고리</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleCategoryChange("")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                category === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              전체
            </button>
            {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryChange(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  category === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 상태 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">상태</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleConditionChange("")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                condition === ""
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              전체
            </button>
            {Object.entries(EQUIPMENT_CONDITION_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleConditionChange(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  condition === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 거래방식 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">거래방식</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "", label: "전체" },
              { key: "DIRECT", label: "직거래" },
              { key: "DELIVERY", label: "택배" },
              { key: "BOTH", label: "둘다" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTradeMethodChange(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tradeMethod === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 가격 범위 + 정렬 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">가격 범위</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="최소"
                value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="text-gray-400">~</span>
              <input
                type="number"
                placeholder="최대"
                value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">원</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">정렬</label>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="price_asc">가격낮은순</option>
              <option value="price_desc">가격높은순</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          총 <span className="font-medium text-gray-900 dark:text-white">{total.toLocaleString()}</span>개
        </p>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : equipments.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">등록된 집기가 없습니다</p>
          <p className="text-sm">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipments.map((eq) => (
            <EquipmentCard key={eq.id} equipment={eq} />
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
                <button onClick={() => setPage(1)} disabled={page === 1} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="첫 페이지">&laquo;</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="이전 페이지">&lsaquo;</button>
                {pages.map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`} aria-label={`${p}페이지`} aria-current={page === p ? "page" : undefined}>{p}</button>
                ))}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="다음 페이지">&rsaquo;</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" aria-label="마지막 페이지">&raquo;</button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
