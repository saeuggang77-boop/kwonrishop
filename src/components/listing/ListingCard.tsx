"use client";

import Link from "next/link";
import Image from "next/image";

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
    _count?: { documents: number };
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const address = listing.addressRoad || listing.addressJibun || "주소 미입력";
  const shortAddress = address.split(" ").slice(0, 3).join(" ");
  const tier = listing.featuredTier || "FREE";
  const tierStyles: Record<string, string> = {
    VIP: "border-2 border-navy-600 shadow-[0_4px_16px_rgba(27,73,101,0.15)] hover:shadow-[0_8px_28px_rgba(27,73,101,0.25)]",
    PREMIUM: "border-[1.5px] border-navy-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]",
    BASIC: "border border-gray-200 dark:border-gray-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
    FREE: "border border-gray-200 dark:border-gray-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
  };

  return (
    <div className={`relative block bg-white dark:bg-gray-800 rounded-xl ${tierStyles[tier] || tierStyles.FREE} overflow-hidden hover:-translate-y-1 transition-all duration-300`}>
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

        {/* 유료 광고 배지 (좌상단) */}
        {tier !== "FREE" && (
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1 font-bold rounded ${
              tier === "VIP"
                ? "px-3 py-1.5 text-[11px] bg-navy-700 text-white shadow-[0_2px_8px_rgba(27,73,101,0.3)]"
                : tier === "PREMIUM"
                  ? "px-2.5 py-1 text-[10px] bg-navy-700/85 text-white backdrop-blur-sm"
                  : "px-2 py-0.5 text-[9px] bg-white/85 text-gray-500 backdrop-blur-sm"
            }`}>
              {tier === "VIP" && (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              )}
              {tier}
            </span>
          </div>
        )}

      </div>

      {/* 정보 */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
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
            <span className="font-bold text-navy-700 dark:text-navy-300">
              {listing.premiumNone
                ? "무권리"
                : `${listing.premium.toLocaleString()}만${listing.premiumNegotiable ? " (협의)" : ""}`}
            </span>
          </p>
        </div>

        {/* 면적 & 메타 */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-500">
          <div className="flex gap-2">
            {listing.areaPyeong && <span>{listing.areaPyeong}평</span>}
            {listing.currentFloor && <span>{listing.currentFloor}층</span>}
          </div>
          <div className="flex gap-2">
            <span>조회 {listing.viewCount}</span>
            <span>관심 {listing.favoriteCount}</span>
          </div>
        </div>

        {/* 테마 태그 + 매출인증 */}
        {(listing.themes.length > 0 || (listing._count?.documents ?? 0) > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {listing.themes.slice(0, 2).map((theme) => (
              <span key={theme} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] rounded">
                {theme}
              </span>
            ))}
            {(listing._count?.documents ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] rounded">
                매출인증
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
    </div>
  );
}
