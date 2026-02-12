"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  MapPin,
  Shield,
  User,
  ChevronDown,
  Search,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/format";
import {
  EXPERT_CATEGORY_LABELS,
  EXPERT_CATEGORY_COLORS,
  REGIONS,
} from "@/lib/utils/constants";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ExpertItem {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  category: string;
  region: string | null;
  profileImage: string | null;
  specialties: string[];
  rating: number;
  reviewCount: number;
  experienceYears: number;
  consultationCount: number;
  isVerified: boolean;
}

interface ExpertsResponse {
  experts: ExpertItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/* ------------------------------------------------------------------ */
/*  Category tabs                                                      */
/* ------------------------------------------------------------------ */

const CATEGORY_TABS = [
  { key: "", label: "전체" },
  ...Object.entries(EXPERT_CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
  })),
];

/* ------------------------------------------------------------------ */
/*  Sort options                                                       */
/* ------------------------------------------------------------------ */

const SORT_OPTIONS = [
  { value: "recommended", label: "추천순" },
  { value: "rating", label: "평점순" },
  { value: "consultations", label: "상담많은순" },
];

/* ------------------------------------------------------------------ */
/*  Star Rating                                                        */
/* ------------------------------------------------------------------ */

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star
          key={i}
          size={size}
          className="fill-yellow-400 text-yellow-400"
        />
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
          <Star size={size} className="absolute text-gray-300" />
          <span className="absolute overflow-hidden" style={{ width: size / 2 }}>
            <Star size={size} className="fill-yellow-400 text-yellow-400" />
          </span>
        </span>
      );
    } else {
      stars.push(
        <Star key={i} size={size} className="text-gray-300" />
      );
    }
  }

  return <span className="inline-flex items-center gap-0.5">{stars}</span>;
}

/* ------------------------------------------------------------------ */
/*  Skeleton Card                                                      */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-3 w-32 rounded bg-gray-200" />
          <div className="h-3 w-20 rounded bg-gray-200" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-14 rounded-full bg-gray-200" />
        <div className="h-6 w-14 rounded-full bg-gray-200" />
        <div className="h-6 w-14 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-9 w-24 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expert Card                                                        */
/* ------------------------------------------------------------------ */

function ExpertCard({ expert }: { expert: ExpertItem }) {
  const categoryColor =
    EXPERT_CATEGORY_COLORS[expert.category] ?? { bg: "bg-gray-100", text: "text-gray-600" };
  const categoryLabel =
    EXPERT_CATEGORY_LABELS[expert.category] ?? expert.category;

  return (
    <Link
      href={`/experts/${expert.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-mint/40 hover:shadow-md"
    >
      <div className="flex gap-4">
        {/* Profile Image */}
        <div className="relative h-20 w-20 shrink-0">
          {expert.profileImage ? (
            <Image
              src={expert.profileImage}
              alt={expert.name}
              fill
              className="rounded-full object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-100">
              <User className="h-10 w-10 text-gray-400" />
            </div>
          )}
          {/* Category badge overlay */}
          <span
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryColor.bg} ${categoryColor.text}`}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-navy">
              {expert.name}
            </h3>
            {expert.isVerified && (
              <Shield className="h-4 w-4 shrink-0 text-mint" />
            )}
          </div>
          {expert.title && (
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {expert.title}
            </p>
          )}
          {expert.company && (
            <p className="mt-0.5 truncate text-sm text-gray-600">
              {expert.company}
            </p>
          )}
        </div>
      </div>

      {/* Specialties */}
      {expert.specialties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {expert.specialties.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Rating + Stats */}
      <div className="mt-3 flex items-center gap-2 text-sm">
        <StarRating rating={expert.rating} size={14} />
        <span className="font-semibold text-navy">
          {expert.rating.toFixed(1)}
        </span>
        <span className="text-gray-400">
          ({formatNumber(expert.reviewCount)}건)
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5" />
          경력 {expert.experienceYears}년
        </span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          상담 {formatNumber(expert.consultationCount)}건
        </span>
      </div>

      {/* Region + CTA */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        {expert.region && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            {expert.region}
          </span>
        )}
        <span className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-accent-dark">
          상담 신청
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Content (uses useSearchParams)                                */
/* ------------------------------------------------------------------ */

function ExpertsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [experts, setExperts] = useState<ExpertItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [category, setCategory] = useState(
    searchParams.get("category") ?? ""
  );
  const [region, setRegion] = useState(searchParams.get("region") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recommended");

  const fetchExperts = useCallback(
    async (pageNum: number, reset = false) => {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (region) params.set("region", region);
      if (sort) params.set("sort", sort);
      params.set("page", String(pageNum));
      params.set("limit", "12");

      try {
        const res = await fetch(`/api/experts?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch experts");

        const data: ExpertsResponse = await res.json();

        if (reset) {
          setExperts(data.experts);
        } else {
          setExperts((prev) => [...prev, ...data.experts]);
        }
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(pageNum);
      } catch {
        if (reset) setExperts([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [category, region, sort]
  );

  useEffect(() => {
    fetchExperts(1, true);
  }, [fetchExperts]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (region) params.set("region", region);
    if (sort && sort !== "recommended") params.set("sort", sort);
    const qs = params.toString();
    router.replace(`/experts${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [category, region, sort, router]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchExperts(page + 1, false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy to-navy-dark px-4 py-12 text-white md:py-16">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="font-heading text-3xl font-bold md:text-4xl">
            전문가 상담
          </h1>
          <p className="mt-3 text-base text-white/80 md:text-lg">
            검증된 전문가에게 상가 거래에 필요한 모든 상담을 받으세요
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[57px] z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3">
          {/* Category Tabs */}
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === tab.key
                    ? "bg-mint text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Region + Sort dropdowns */}
          <div className="flex gap-3">
            {/* Region Dropdown */}
            <div className="relative">
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none transition focus:border-mint focus:ring-1 focus:ring-mint"
              >
                <option value="">전체 지역</option>
                {Object.keys(REGIONS).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 outline-none transition focus:border-mint focus:ring-1 focus:ring-mint"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        {/* Total count */}
        {!isLoading && (
          <p className="mb-4 text-sm text-gray-500">
            전문가{" "}
            <span className="font-semibold text-navy">
              {formatNumber(total)}
            </span>
            명
          </p>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Expert Grid */}
        {!isLoading && experts.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {experts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-mint" />
                      불러오는 중...
                    </span>
                  ) : (
                    "더보기"
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!isLoading && experts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="h-16 w-16 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-500">
              조건에 맞는 전문가가 없습니다
            </p>
            <p className="mt-1 text-sm text-gray-400">
              다른 카테고리나 지역을 선택해 보세요
            </p>
            <button
              onClick={() => {
                setCategory("");
                setRegion("");
                setSort("recommended");
              }}
              className="mt-4 rounded-lg bg-mint px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mint-dark"
            >
              필터 초기화
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (Suspense wrapper for useSearchParams)                        */
/* ------------------------------------------------------------------ */

export default function ExpertsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <section className="bg-gradient-to-br from-navy to-navy-dark px-4 py-12 text-white md:py-16">
            <div className="mx-auto max-w-7xl text-center">
              <h1 className="font-heading text-3xl font-bold md:text-4xl">
                전문가 상담
              </h1>
              <p className="mt-3 text-base text-white/80 md:text-lg">
                검증된 전문가에게 상가 거래에 필요한 모든 상담을 받으세요
              </p>
            </div>
          </section>
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ExpertsPageContent />
    </Suspense>
  );
}
