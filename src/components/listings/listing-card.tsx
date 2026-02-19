"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { formatLocation } from "@/lib/utils/format-location";
import { BUSINESS_CATEGORY_LABELS, PREMIUM_AD_CONFIG } from "@/lib/utils/constants";
import { CompareButton } from "@/components/listings/compare-button";
import { CATEGORY_EMOJI, CATEGORY_GRADIENT, CATEGORY_PLACEHOLDER } from "./listing-card-constants";

/* ================================================================
   Types
   ================================================================ */

export interface ListingCardData {
  id: string;
  title: string;
  businessCategory: string;
  storeType: string;
  price: string;
  monthlyRent: string | null;
  premiumFee: string | null;
  city: string;
  district: string;
  images: { url: string; thumbnailUrl: string | null }[];
  safetyGrade: string | null;
  isPremium: boolean;
  premiumRank: number;
  hasDiagnosisBadge: boolean;
  areaPyeong: number | null;
  floor: string | number | null;
  seller?: { name?: string | null; image?: string | null; isTrustedSeller?: boolean };
  neighborhood?: string | null;
  monthlyRevenue?: string | null;
  monthlyProfit?: string | null;
  managementFee?: string | null;
  areaM2?: number | null;
  businessSubtype?: string | null;
  viewCount?: number;
  likeCount?: number;
  isJumpUp?: boolean;
  urgentTag?: { active: boolean; reason: string | null } | null;
  createdAt?: string;
}

export type ListingCardVariant = "premium" | "recommend" | "search";

export interface ListingCardProps {
  listing: ListingCardData;
  variant: ListingCardVariant;
  isCarouselItem?: boolean;
}

/* ================================================================
   Helpers
   ================================================================ */

function floorAreaStr(floor: string | number | null, pyeong: number | null): string | null {
  const parts: string[] = [];
  if (floor != null) parts.push(typeof floor === "number" ? `${floor}층` : floor);
  if (pyeong != null) parts.push(`${pyeong}평`);
  return parts.length ? parts.join(" · ") : null;
}

function catLabel(cat: string) {
  return BUSINESS_CATEGORY_LABELS[cat] ?? cat;
}

/** 매출인증 ✓, 권리진단 ◎, 안심거래 🛡 (매출인증+권리진단 둘 다 통과 시) */
function buildBadges(listing: ListingCardData, compact: boolean) {
  const badges: { label: string; cls: string }[] = [];
  const hasSales = listing.safetyGrade === "A";
  const hasDiag = listing.hasDiagnosisBadge;

  if (hasSales) badges.push({ label: compact ? "매출인증 ✓" : "매출인증 ✓", cls: "bg-green-100 text-green-700" });
  if (hasDiag) badges.push({ label: compact ? "권리진단 ◎" : "권리진단 ◎", cls: "bg-purple-100 text-purple-700" });
  if (hasSales && hasDiag) badges.push({ label: "안심거래 🛡", cls: "bg-blue-100 text-blue-700" });

  return badges;
}

/* ================================================================
   Component
   ================================================================ */

export function ListingCard({ listing, variant, isCarouselItem = false }: ListingCardProps) {
  if (variant === "search") return <SearchCard listing={listing} />;
  if (variant === "recommend") return <RecommendCard listing={listing} isCarouselItem={isCarouselItem} />;
  return <PremiumCard listing={listing} isCarouselItem={isCarouselItem} />;
}

/* ────────────────────────────────────────────────────────────────
   Premium Card (큰 세로 카드, 홈 프리미엄 섹션)
   ──────────────────────────────────────────────────────────────── */

function PremiumCard({ listing, isCarouselItem }: { listing: ListingCardData; isCarouselItem: boolean }) {
  const tc = listing.premiumRank >= 2 ? PREMIUM_AD_CONFIG[listing.premiumRank === 3 ? "VIP" : "PREMIUM"] : null;
  const catGrad = CATEGORY_GRADIENT[listing.businessCategory] ?? "from-[#F3F4F6] to-[#E5E7EB]";
  const fa = floorAreaStr(listing.floor, listing.areaPyeong);
  const badges = buildBadges(listing, false);
  const hasPremiumFee = listing.premiumFee != null && Number(listing.premiumFee) > 0;
  const hasRevenue = listing.monthlyRevenue != null && Number(listing.monthlyRevenue) > 0;
  const hasProfit = listing.monthlyProfit != null && Number(listing.monthlyProfit) > 0;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group overflow-hidden rounded-xl border-2 bg-white transition-all active:scale-[0.98] md:hover:-translate-y-1 md:hover:shadow-lg ${isCarouselItem ? "w-48 flex-none snap-start md:w-full md:min-w-0" : "w-full"} ${tc?.border ?? "border-gray-200"}`}
    >
      {tc && <div className={`h-1 bg-gradient-to-r ${tc.gradient}`} />}
      <div className="relative aspect-[16/9] bg-gray-100">
        {listing.images?.[0] ? (
          <Image src={listing.images[0].thumbnailUrl ?? listing.images[0].url} alt={listing.title} fill className="object-cover" sizes="(max-width:768px) 200px, 20vw" loading="lazy" />
        ) : (
          <div className={`flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${catGrad}`}>
            <span className="text-3xl drop-shadow-sm">{CATEGORY_EMOJI[listing.businessCategory] ?? "🏠"}</span>
          </div>
        )}
        {/* 카테고리 뱃지 */}
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {catLabel(listing.businessCategory)}
        </span>
        {/* 층·평수 */}
        {fa && (
          <span className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{fa}</span>
        )}
        {/* 프리미엄 뱃지 */}
        {tc && (
          <span className={`absolute left-2 bottom-2 rounded px-1.5 py-0.5 text-[10px] font-bold border ${tc.bg} ${tc.color} ${tc.border}`}>{tc.badge}</span>
        )}
      </div>
      <div className="p-3 space-y-1">
        {/* 매물명 */}
        <h3 className="text-xs font-bold text-gray-900 truncate">{listing.title}</h3>
        {/* 1줄: 보증금 / 월세 */}
        <div className="flex items-baseline gap-1 text-sm">
          <span className="text-gray-400">보증금</span>
          <span className="font-bold text-[#1B3A5C]">{formatKRW(Number(listing.price))}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400">월세</span>
          <span className="font-bold text-[#1B3A5C]">{listing.monthlyRent && Number(listing.monthlyRent) > 0 ? formatKRW(Number(listing.monthlyRent)) : "0원"}</span>
        </div>
        {/* 2줄: 권리금 */}
        <p className={`text-base font-bold ${hasPremiumFee ? "text-red-500" : "text-[#1B3A5C]"}`}>
          {hasPremiumFee ? `권리금 ${formatKRW(Number(listing.premiumFee))}` : "무권리"}
        </p>
        {/* 3줄: 월매출 / 월수익 */}
        {(hasRevenue || hasProfit) && (
          <p className="text-[11px] text-gray-500">
            {hasRevenue && <>월매출 {formatKRW(Number(listing.monthlyRevenue))}</>}
            {hasRevenue && hasProfit && <span className="mx-1 text-gray-300">|</span>}
            {hasProfit && <>월수익 {formatKRW(Number(listing.monthlyProfit))}</>}
          </p>
        )}
        {/* 배지 */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map(b => (
              <span key={b.label} className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${b.cls}`}>{b.label}</span>
            ))}
          </div>
        )}
        {/* 위치 */}
        <p className="flex items-center gap-0.5 text-[10px] text-gray-400">
          <MapPin className="h-2.5 w-2.5 shrink-0" />{formatLocation(listing.city, listing.district)}
        </p>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────────
   Recommend Card (작은 세로 카드, 홈 오늘의 추천)
   ──────────────────────────────────────────────────────────────── */

function RecommendCard({ listing, isCarouselItem }: { listing: ListingCardData; isCarouselItem: boolean }) {
  const catGrad = CATEGORY_GRADIENT[listing.businessCategory] ?? "from-[#F3F4F6] to-[#E5E7EB]";
  const isRecommend = listing.premiumRank === 2;
  const hasPremiumFee = listing.premiumFee != null && Number(listing.premiumFee) > 0;
  const badges = buildBadges(listing, true);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group overflow-hidden rounded-lg border bg-white transition-all active:scale-[0.98] md:hover:-translate-y-0.5 md:hover:shadow-md ${isCarouselItem ? "w-44 flex-none snap-start md:w-full md:min-w-0" : "w-full"} ${isRecommend ? "border-blue-200" : "border-gray-200"}`}
    >
      <div className="relative h-[120px] bg-gray-100">
        {listing.images?.[0] ? (
          <Image src={listing.images[0].thumbnailUrl ?? listing.images[0].url} alt={listing.title} fill className="object-cover" sizes="(max-width:768px) 176px, 16vw" loading="lazy" />
        ) : (
          <div className={`flex h-full items-center justify-center bg-gradient-to-br ${catGrad}`}>
            <span className="text-4xl">{CATEGORY_EMOJI[listing.businessCategory] ?? "🏠"}</span>
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
          {catLabel(listing.businessCategory)}
        </span>
        {isRecommend && <span className="absolute right-1.5 bottom-1.5 rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">추천</span>}
      </div>
      <div className="p-2.5 space-y-1">
        {/* 매물명 */}
        <h3 className="text-[11px] font-bold text-gray-900 truncate">{listing.title}</h3>
        {/* 1줄: 보증금 / 월세 */}
        <div className="flex items-baseline gap-1 text-xs">
          <span className="text-gray-400">보증금</span>
          <span className="font-bold text-[#1B3A5C]">{formatKRW(Number(listing.price))}</span>
        </div>
        {/* 2줄: 권리금 */}
        <p className={`text-sm font-bold ${hasPremiumFee ? "text-red-500" : "text-[#1B3A5C]"}`}>
          {hasPremiumFee ? `권리금 ${formatKRW(Number(listing.premiumFee))}` : "무권리"}
        </p>
        {/* 배지 */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {badges.map(b => <span key={b.label} className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${b.cls}`}>{b.label}</span>)}
          </div>
        )}
        {/* 위치 */}
        <p className="flex items-center gap-0.5 text-[10px] text-gray-400 truncate">
          <MapPin className="h-2.5 w-2.5 shrink-0" />{formatLocation(listing.city, listing.district)}
        </p>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────────
   Search Card (가로형, 점포찾기)
   ──────────────────────────────────────────────────────────────── */

function SearchCard({ listing }: { listing: ListingCardData }) {
  const thumbnail = listing.images[0]?.thumbnailUrl ?? listing.images[0]?.url;
  const fa = floorAreaStr(listing.floor, listing.areaPyeong);
  const hasPremiumFee = listing.premiumFee != null && Number(listing.premiumFee) > 0;
  const hasRevenue = listing.monthlyRevenue != null && Number(listing.monthlyRevenue) > 0;
  const hasProfit = listing.monthlyProfit != null && Number(listing.monthlyProfit) > 0;
  const badges = buildBadges(listing, false);

  const tierConfig = listing.premiumRank >= 2 ? PREMIUM_AD_CONFIG[listing.premiumRank === 3 ? "VIP" : "PREMIUM"] : null;
  const imageCount = listing.images.length;

  // 프리미엄 → 골드 테두리, 급매 → 빨간 테두리, 일반 → 기본
  const borderClass = listing.urgentTag?.active
    ? "border-2 border-red-400"
    : tierConfig
      ? "border-2 border-amber-400"
      : "border border-gray-100";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group flex gap-3 overflow-hidden rounded-xl bg-white p-3 transition-shadow hover:shadow-md ${borderClass}`}
    >
      {/* 썸네일 */}
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-40 sm:w-40">
        {thumbnail ? (
          <Image src={thumbnail} alt={listing.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="160px" />
        ) : (() => {
          const cat = CATEGORY_PLACEHOLDER[listing.businessCategory] ?? { gradient: "from-gray-600/70 to-gray-400/50", icon: "🏠" };
          return (
            <div className={`flex h-full items-center justify-center bg-gradient-to-br ${cat.gradient}`}>
              <span className="text-4xl drop-shadow-lg">{cat.icon}</span>
            </div>
          );
        })()}
        {/* 카테고리 뱃지 */}
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {catLabel(listing.businessCategory)}
        </span>
        {/* 층·평수 */}
        {fa && (
          <span className="absolute right-1.5 top-1.5 rounded bg-black/50 px-1 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{fa}</span>
        )}
        {/* 프리미엄 뱃지 or 사진 수 */}
        {tierConfig ? (
          <span className={`absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold border ${tierConfig.bg} ${tierConfig.color} ${tierConfig.border}`}>
            {tierConfig.badge}
          </span>
        ) : imageCount > 1 ? (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white backdrop-blur-sm">
            📷 {imageCount}
          </span>
        ) : null}
        {/* 점프업 */}
        {listing.isJumpUp && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-blue-600/90 px-1 py-0.5 text-[9px] font-bold text-white">⬆️</span>
        )}
        {/* 비교 버튼 */}
        <CompareButton
          listing={{
            id: listing.id,
            title: listing.title,
            businessCategory: listing.businessCategory,
            city: listing.city,
            district: listing.district,
            thumbnail: thumbnail ?? null,
            price: listing.price,
            monthlyRent: listing.monthlyRent,
            premiumFee: listing.premiumFee,
            monthlyRevenue: listing.monthlyRevenue ?? null,
            monthlyProfit: listing.monthlyProfit ?? null,
            areaM2: listing.areaM2 ?? null,
            areaPyeong: listing.areaPyeong,
            floor: typeof listing.floor === "string" ? null : listing.floor ?? null,
            safetyGrade: listing.safetyGrade,
            isPremium: listing.isPremium,
            premiumRank: listing.premiumRank,
            storeType: listing.storeType,
          }}
          variant="card"
        />
      </div>

      {/* 정보 */}
      <div className="flex min-w-0 flex-1 flex-col justify-center space-y-1">
        {/* 매물명 */}
        <h3 className="text-sm font-bold text-gray-900 truncate">{listing.title}</h3>
        {/* 1줄: 보증금 / 월세 */}
        <p className="text-sm font-semibold text-[#1B3A5C]">
          보증금 {formatKRW(Number(listing.price))} / 월세{" "}
          {listing.monthlyRent && Number(listing.monthlyRent) > 0 ? formatKRW(Number(listing.monthlyRent)) : "0원"}
        </p>
        {/* 2줄: 권리금 */}
        <p className={`text-[15px] font-bold ${hasPremiumFee ? "text-red-500" : "text-[#1B3A5C]"}`}>
          {hasPremiumFee ? `권리금 ${formatKRW(Number(listing.premiumFee))}` : "무권리"}
        </p>
        {/* 3줄: 월매출 / 월수익 */}
        {(hasRevenue || hasProfit) && (
          <p className="text-xs text-gray-500">
            {hasRevenue && <>월매출 {formatKRW(Number(listing.monthlyRevenue))}</>}
            {hasRevenue && hasProfit && <span className="mx-1 text-gray-300">|</span>}
            {hasProfit && <>월수익 {formatKRW(Number(listing.monthlyProfit))}</>}
          </p>
        )}
        {/* 배지 */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map(b => (
              <span key={b.label} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${b.cls}`}>{b.label}</span>
            ))}
          </div>
        )}
        {/* 위치: 구까지만 */}
        <p className="flex items-center gap-0.5 text-xs text-gray-400">
          <MapPin className="h-3 w-3 shrink-0" />{formatLocation(listing.city, listing.district)}
        </p>
      </div>
    </Link>
  );
}
