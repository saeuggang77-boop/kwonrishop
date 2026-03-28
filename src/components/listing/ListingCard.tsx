"use client";

import Link from "next/link";
import Image from "next/image";
import { useCompareStore } from "@/store/compareStore";
import TierBadge from "@/components/shared/TierBadge";
import { toast } from "@/lib/toast";

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
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const address = listing.addressRoad || listing.addressJibun || "주소 미입력";
  const shortAddress = address.split(" ").slice(0, 3).join(" ");
  const { addToCompare, removeFromCompare, isInCompare } = useCompareStore();
  const inCompare = isInCompare(listing.id);

  const tier = listing.featuredTier || "FREE";
  const tierStyles: Record<string, string> = {
    VIP: "border-2 border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10",
    PREMIUM: "border-2 border-gray-400 bg-gray-50/50 dark:bg-gray-700/10",
    BASIC: "border-2 border-blue-300 bg-blue-50/50 dark:bg-blue-900/10",
    FREE: "border border-gray-200 dark:border-gray-700",
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inCompare) {
      removeFromCompare(listing.id);
    } else {
      const success = addToCompare(listing.id);
      if (!success) {
        toast.info("최대 3개까지 비교 가능합니다");
      }
    }
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

        {/* 비교하기 체크박스 */}
        <button
          onClick={handleCompareToggle}
          className={`absolute top-2 right-2 w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${
            inCompare
              ? "bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500"
              : "bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          }`}
          title="비교하기"
          aria-label={inCompare ? "비교 목록에서 제거" : "비교 목록에 추가"}
        >
          {inCompare && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* 정보 */}
      <div className="p-3">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-1">
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
