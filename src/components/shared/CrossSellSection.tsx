"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import TierBadge from "./TierBadge";

interface CrossSellProps {
  type: "listing" | "franchise" | "partner" | "equipment";
  id: string;
}

interface ListingRecommendation {
  id: string;
  storeName: string;
  addressRoad: string;
  deposit: number;
  monthlyRent: number;
  premium: number;
  premiumNone: boolean;
  areaPyeong: number;
  viewCount: number;
  favoriteCount: number;
  category: { name: string; icon: string };
  images: { url: string }[];
  createdAt?: string;
}

interface CrossSellData {
  franchises?: any[];
  partners?: any[];
  listings?: any[];
  equipments?: any[];
  sameIndustry?: ListingRecommendation[];
  recentListings?: ListingRecommendation[];
  trendingListings?: ListingRecommendation[];
}

// 이 컴포넌트는 각 상세 페이지 하단에 삽입됨
// type에 따라 다른 카테고리의 추천 아이템을 수평 스크롤로 표시
export default function CrossSellSection({ type, id }: CrossSellProps) {
  const [data, setData] = useState<CrossSellData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recommendations?type=${type}&id=${id}&limit=4`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type, id]);

  if (loading) {
    return (
      <div className="space-y-6 mt-6">
        <div className="h-8 bg-gray-100 rounded w-40 animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-56 h-48 bg-gray-100 rounded-xl animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasContent =
    (data.franchises?.length ?? 0) > 0 ||
    (data.partners?.length ?? 0) > 0 ||
    (data.listings?.length ?? 0) > 0 ||
    (data.equipments?.length ?? 0) > 0 ||
    (data.sameIndustry?.length ?? 0) > 0 ||
    (data.recentListings?.length ?? 0) > 0 ||
    (data.trendingListings?.length ?? 0) > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-8 mt-8">
      {/* 매물 상세일 때: 같은 업종 추천만 표시 */}
      {type === "listing" && data.sameIndustry && data.sameIndustry.length > 0 && (
        <RecommendBlock
          title="🏪 지역 내 같은 업종 추천 매물"
          link={`/listings?category=${data.sameIndustry[0]?.category?.name || ""}`}
          linkLabel="전체보기"
        >
          {data.sameIndustry.slice(0, 3).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </RecommendBlock>
      )}

      {/* 추천 프랜차이즈 (프랜차이즈/협력업체/집기 상세에서만) */}
      {type !== "listing" && (data.franchises?.length ?? 0) > 0 && (
        <RecommendBlock
          title="추천 프랜차이즈"
          link="/franchise"
          linkLabel="전체보기"
        >
          {data.franchises!.map((f: any) => (
            <Link
              key={f.id}
              href={`/franchise/${f.id}`}
              className="block w-56 shrink-0 md:w-auto md:shrink bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm shrink-0">
                  {f.brandName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {f.brandName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {f.companyName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-2">
                <TierBadge tier={f.tier} />
                {f.industry && (
                  <span className="text-xs text-gray-400">{f.industry}</span>
                )}
              </div>
              <div className="text-xs text-gray-600 space-y-0.5">
                {f.totalStores && (
                  <p>매장수 {f.totalStores.toLocaleString()}개</p>
                )}
                {f.avgRevenue && (
                  <p>평균매출 월 {f.avgRevenue.toLocaleString()}만</p>
                )}
              </div>
            </Link>
          ))}
        </RecommendBlock>
      )}

      {/* 추천 협력업체 (프랜차이즈/협력업체/집기 상세에서만) */}
      {type !== "listing" && (data.partners?.length ?? 0) > 0 && (
        <RecommendBlock
          title="추천 협력업체"
          link="/partners"
          linkLabel="전체보기"
        >
          {data.partners!.map((p: any) => (
            <Link
              key={p.id}
              href={`/partners/${p.id}`}
              className="block w-56 shrink-0 md:w-auto md:shrink bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-28 bg-gray-100 relative">
                {p.images?.[0]?.url ? (
                  <Image
                    src={p.images[0].url}
                    alt={p.companyName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {p.companyName}
                  </p>
                  <TierBadge tier={p.tier} />
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {p.serviceType}
                </p>
              </div>
            </Link>
          ))}
        </RecommendBlock>
      )}

      {/* 관련 매물 (프랜차이즈/협력업체 상세에서) */}
      {(data.listings?.length ?? 0) > 0 && (
        <RecommendBlock
          title="관련 매물"
          link="/listings"
          linkLabel="전체보기"
        >
          {data.listings!.map((l: any) => (
            <Link
              key={l.id}
              href={`/listings/${l.id}`}
              className="block w-56 shrink-0 md:w-auto md:shrink bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-28 bg-gray-100 relative">
                {l.images?.[0]?.url ? (
                  <Image
                    src={l.images[0].url}
                    alt={l.storeName || "매물"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                    사진 없음
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {l.storeName || l.addressRoad || "매물"}
                </p>
                <p className="text-xs text-navy-700 font-medium mt-0.5">
                  {l.premiumNone
                    ? "무권리"
                    : `권리금 ${l.premium?.toLocaleString()}만`}
                  {" · "}보증금 {l.deposit?.toLocaleString()}만
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {l.category?.icon} {l.category?.name}
                  {l.areaPyeong && ` · ${l.areaPyeong}평`}
                </p>
              </div>
            </Link>
          ))}
        </RecommendBlock>
      )}

      {/* 추천 집기 (프랜차이즈/협력업체/집기 상세에서만) */}
      {type !== "listing" && (data.equipments?.length ?? 0) > 0 && (
        <RecommendBlock
          title="추천 집기"
          link="/equipment"
          linkLabel="전체보기"
        >
          {data.equipments!.map((eq: any) => (
            <Link
              key={eq.id}
              href={`/equipment/${eq.id}`}
              className="block w-56 shrink-0 md:w-auto md:shrink bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-28 bg-gray-100 dark:bg-gray-700 relative">
                {eq.images?.[0]?.url ? (
                  <Image
                    src={eq.images[0].url}
                    alt={eq.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm">
                    사진 없음
                  </div>
                )}
                {eq.price === 0 && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-xs font-medium rounded">
                    나눔
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {eq.title}
                </p>
                <p className="text-xs text-navy-700 dark:text-navy-400 font-medium mt-0.5">
                  {eq.price === 0
                    ? "무료 나눔"
                    : `${eq.price?.toLocaleString()}원`}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {eq.category}
                </p>
              </div>
            </Link>
          ))}
        </RecommendBlock>
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: ListingRecommendation }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block w-56 shrink-0 md:w-auto md:shrink bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="h-28 bg-gray-100 relative">
        {listing.images?.[0]?.url ? (
          <Image
            src={listing.images[0].url}
            alt={listing.storeName || "매물"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            사진 없음
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-gray-900 text-sm truncate">
          {listing.storeName || listing.addressRoad || "매물"}
        </p>
        <p className="text-xs text-navy-700 font-medium mt-0.5">
          {listing.premiumNone
            ? "무권리"
            : `권리금 ${listing.premium?.toLocaleString()}만`}
          {" · "}보증금 {listing.deposit?.toLocaleString()}만
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {listing.category?.icon} {listing.category?.name}
          {listing.areaPyeong && ` · ${listing.areaPyeong}평`}
        </p>
      </div>
    </Link>
  );
}

function RecommendBlock({
  title,
  link,
  linkLabel,
  children,
}: {
  title: string;
  link: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <Link
          href={link}
          className="text-sm text-navy-700 hover:text-navy-700"
        >
          {linkLabel} →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 pr-4 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible md:pr-0">
        {children}
      </div>
    </div>
  );
}
