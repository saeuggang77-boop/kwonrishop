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
  const isTop = tier === "VIP";
  const isMid = tier === "PREMIUM";

  const cardClass = isTop
    ? "border-2 border-green-700 bg-cream-elev shadow-[0_8px_32px_rgba(31,63,46,0.10)] hover:shadow-[0_16px_40px_rgba(31,63,46,0.14)]"
    : isMid
      ? "border-[1.5px] border-line-deep bg-cream shadow-[0_2px_12px_rgba(31,63,46,0.06)] hover:shadow-[0_8px_24px_rgba(31,63,46,0.10)]"
      : "border border-line bg-cream hover:shadow-[0_4px_16px_rgba(31,63,46,0.08)]";

  return (
    <div className={`relative block rounded-3xl ${cardClass} overflow-hidden hover:-translate-y-1 active:scale-[0.98] transition-all duration-300`}>
      <Link href={`/listings/${listing.id}`}>
        {/* 이미지 */}
        <div className={`relative aspect-[4/3] ${isTop ? "bg-green-800" : "bg-cream-elev"}`}>
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
            <div className={`w-full h-full flex items-center justify-center ${isTop ? "text-cream/40" : "text-line-deep"}`}>
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* 등급 배지 */}
          {tier !== "FREE" && (
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center gap-1 font-bold rounded-full tracking-wider ${
                  isTop
                    ? "px-3 py-1.5 text-[11px] bg-terra-500 text-cream"
                    : isMid
                      ? "px-2.5 py-1 text-[10px] bg-green-700 text-cream"
                      : "px-2 py-0.5 text-[9px] bg-green-100 text-green-700"
                }`}
              >
                {tier}
              </span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="p-4">
          <div className="text-xs text-terra-500 font-semibold mb-1.5">
            {listing.category && <span>{listing.category.name}</span>}
            {listing.subCategory && <span> · {listing.subCategory.name}</span>}
          </div>

          <h3 className="text-base font-bold text-ink truncate mb-1 tracking-tight">{shortAddress}</h3>

          {/* 금액 영역 — 세리프 이탤릭 강세 + 대시 구분선 */}
          <div className="pt-3 mt-3 border-t border-dashed border-line-deep space-y-1.5">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-muted">보증금/월세</span>
              <span className="font-semibold text-ink">
                {listing.deposit.toLocaleString()} / {listing.monthlyRent.toLocaleString()}만
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-muted">권리금</span>
              <span className="font-serif italic font-medium text-green-700 text-xl leading-none tracking-tight">
                {listing.premiumNone
                  ? "무권리"
                  : `${listing.premium.toLocaleString()}만${listing.premiumNegotiable ? " (협의)" : ""}`}
              </span>
            </div>
          </div>

          {/* 면적 & 메타 */}
          <div className="flex items-center justify-between mt-3 text-[11px] text-muted">
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
            <div className="flex flex-wrap gap-1.5 mt-3">
              {listing.themes.slice(0, 2).map((theme) => (
                <span key={theme} className="px-2 py-0.5 bg-cream-elev text-green-700 text-[10px] rounded-full font-medium">
                  {theme}
                </span>
              ))}
              {(listing._count?.documents ?? 0) > 0 && (
                <span className="px-2 py-0.5 bg-terra-100 text-terra-700 text-[10px] rounded-full font-bold">
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
