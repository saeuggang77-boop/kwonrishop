"use client";

import Link from "next/link";
import Image from "next/image";
import TierBadge from "@/components/shared/TierBadge";
import SellerTrustBadge from "@/components/shared/SellerTrustBadge";

interface ListingCardProps {
  listing: {
    id: string;
    addressRoad: string | null;
    addressJibun: string | null;
    deposit: number;
    monthlyRent: number;
    premium: number;
    premiumNone: boolean;
    premiumNegotiable: boolean;
    brandType: string;
    storeName: string | null;
    areaPyeong: number | null;
    currentFloor: number | null;
    themes: string[];
    viewCount: number;
    favoriteCount: number;
    createdAt: string;
    category: { name: string; icon: string | null } | null;
    subCategory: { name: string } | null;
    images: { url: string }[];
    featuredTier?: string;
    sellerTrust?: { avgRating: number; reviewCount: number };
    _count?: { documents: number };
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const address = listing.addressRoad || listing.addressJibun || "주소 미입력";
  const shortAddress = address.split(" ").slice(0, 3).join(" ");
  const tier = listing.featuredTier || "FREE";
  const tierStyles: Record<string, string> = {
    VIP: "border-2 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10",
    PREMIUM: "border-2 border-gray-400 bg-gray-50/50 dark:bg-gray-700/10",
    BASIC: "border-2 border-blue-300 bg-blue-50/50 dark:bg-blue-900/10",
    FREE: "border border-gray-200 dark:border-gray-700",
  };

  return (
    <div className={`relative block bg-white dark:bg-gray-800 rounded-xl ${tierStyles[tier] || tierStyles.FREE} overflow-hidden hover:shadow-md transition-shadow`}>
      <Link href={`/listings/${listing.id}`}>
      {/* 이미지 */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
        {listing.images[0] ? (
          <Image
            src={listing.images[0].url}
            alt={`${listing.storeName || address} 매물 사진`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* 테마 태그 */}
        {listing.themes.length > 0 && (
          <div className="absolute top-2 left-2 flex gap-1">
            {listing.themes.slice(0, 2).map((theme) => (
              <span
                key={theme}
                className="px-2 py-0.5 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-medium rounded"
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* 유료 광고 배지 */}
        {tier !== "FREE" && (
          <div className="absolute bottom-2 left-2">
            <TierBadge tier={tier} size="sm" />
          </div>
        )}

        {/* 매출 인증 배지 */}
        {(listing._count?.documents ?? 0) > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-semibold rounded backdrop-blur-sm">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            매출인증
          </div>
        )}

      </div>

      {/* 정보 */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            {listing.category && (
              <span>
                {listing.category.icon} {listing.category.name}
              </span>
            )}
            {listing.subCategory && (
              <>
                <span>·</span>
                <span>{listing.subCategory.name}</span>
              </>
            )}
          </div>
          {listing.sellerTrust && listing.sellerTrust.reviewCount > 0 && (
            <SellerTrustBadge
              avgRating={listing.sellerTrust.avgRating}
              reviewCount={listing.sellerTrust.reviewCount}
              size="sm"
            />
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">{shortAddress}</p>

        {/* 금액 */}
        <div className="space-y-0.5">
          <p className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">보증금/월세 </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {listing.deposit.toLocaleString()} / {listing.monthlyRent.toLocaleString()}만
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">권리금 </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {listing.premiumNone
                ? "무권리"
                : `${listing.premium.toLocaleString()}만${listing.premiumNegotiable ? " (협의)" : ""}`}
            </span>
          </p>
        </div>

        {/* 면적 & 메타 */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex gap-2">
            {listing.areaPyeong && <span>{listing.areaPyeong}평</span>}
            {listing.currentFloor && <span>{listing.currentFloor}층</span>}
          </div>
          <div className="flex gap-2">
            <span>조회 {listing.viewCount}</span>
            <span>관심 {listing.favoriteCount}</span>
          </div>
        </div>
      </div>
    </Link>
    </div>
  );
}
