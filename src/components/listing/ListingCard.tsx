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
    monthlyProfit?: number | null;
    monthlyRevenue?: number | null;
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
  const isAd = tier !== "FREE";

  const tierBadge = isTop
    ? "bg-terra-500 text-cream"
    : isMid
      ? "bg-green-700 text-cream"
      : "bg-black/55 text-white";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`flex gap-4 px-5 py-4 border-b border-line hover:bg-cream-elev/50 active:bg-cream-elev transition-colors ${
        isTop ? "bg-cream-elev/30" : ""
      }`}
    >
      {/* 이미지 (좌측 100~130px 둥근 정사각) */}
      <div className={`relative flex-shrink-0 w-[100px] h-[100px] md:w-[130px] md:h-[130px] rounded-2xl overflow-hidden ${isTop ? "ring-2 ring-green-700" : "bg-cream-elev"}`}>
        {listing.images[0] ? (
          <Image
            src={listing.images[0].url}
            alt={`${listing.storeName || address} 매물 사진`}
            fill
            sizes="(max-width: 768px) 100px, 130px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-line-deep">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* 등급 배지 */}
        {isAd && (
          <span className={`absolute top-1.5 left-1.5 inline-flex items-center font-bold rounded tracking-wider px-1.5 py-0.5 text-[10px] ${tierBadge}`}>
            {tier}
          </span>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 상단: 카테고리 + 메타 */}
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="inline-flex items-center bg-green-100 text-green-700 text-[11px] font-bold px-2 py-0.5 rounded">
            {listing.category?.name || "기타"}
            {listing.subCategory && ` · ${listing.subCategory.name}`}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-muted whitespace-nowrap">
            <span>
              {listing.currentFloor && `${listing.currentFloor}층`}
              {listing.currentFloor && listing.areaPyeong && " · "}
              {listing.areaPyeong && `${listing.areaPyeong}평`}
            </span>
            {isAd && <span className="text-[9px] text-muted border border-line px-1 py-px rounded">광고</span>}
          </div>
        </div>

        {/* 매물 제목 */}
        <h3 className="text-[14px] font-bold text-ink truncate mb-1 tracking-tight">
          {listing.storeName || shortAddress}
        </h3>

        {/* 가격 정보 (자연스러운 흐름) */}
        <div className="text-[13px] text-ink leading-[1.6] space-y-0.5">
          <div>
            보증금 {listing.deposit.toLocaleString()}만 / 월세 {listing.monthlyRent.toLocaleString()}만원
          </div>
          <div>
            권리금{" "}
            <strong className="text-terra-500 font-bold">
              {listing.premiumNone
                ? "무권리"
                : `${listing.premium.toLocaleString()}만${listing.premiumNegotiable ? " (협의가능)" : ""}`}
            </strong>
          </div>
        </div>

        {/* 매출/수익 박스 (있을 때만) */}
        {(listing.monthlyRevenue || listing.monthlyProfit) && (
          <div className="inline-flex self-start items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-[12px] font-bold mt-2">
            <span className="w-4 h-4 bg-green-700 text-white rounded-full grid place-items-center text-[8px] font-extrabold">₩</span>
            {listing.monthlyRevenue && `월매출 ${listing.monthlyRevenue.toLocaleString()}만`}
            {listing.monthlyRevenue && listing.monthlyProfit && " · "}
            {listing.monthlyProfit && `월수익 ${listing.monthlyProfit.toLocaleString()}만`}
          </div>
        )}

        {/* 테마 태그 + 매출인증 */}
        {(listing.themes.length > 0 || (listing._count?.documents ?? 0) > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {listing.themes.slice(0, 2).map((theme) => (
              <span key={theme} className="px-1.5 py-0.5 bg-terra-100 text-terra-500 text-[10.5px] rounded font-semibold">
                {theme}
              </span>
            ))}
            {(listing._count?.documents ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 bg-terra-500 text-cream text-[10.5px] rounded font-bold">
                매출인증
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
