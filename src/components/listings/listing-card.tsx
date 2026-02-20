"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Coffee, UtensilsCrossed, Pizza, ShoppingBag, Wine,
  Scissors, Gamepad2, GraduationCap, Truck, Bed, ChefHat,
  Fish, Flame, Store, type LucideIcon,
} from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { formatLocation } from "@/lib/utils/format-location";
import { BUSINESS_CATEGORY_LABELS, PREMIUM_AD_CONFIG } from "@/lib/utils/constants";
import { CompareButton } from "@/components/listings/compare-button";

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
  priority?: boolean;
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

function catLabel(cat: string, subtype?: string | null) {
  if (subtype) return subtype;
  return BUSINESS_CATEGORY_LABELS[cat] ?? cat;
}

/** formatKRW에서 "원" 제거 (카드 전용) */
function price(amount: number) {
  return formatKRW(amount).replace(/원$/, "");
}

/** picsum placeholder 이미지인지 확인 */
function isPicsum(url: string | undefined | null): boolean {
  if (!url) return true;
  return url.includes("picsum.photos");
}

/** 업종별 Unsplash 더미 이미지 URL */
const CATEGORY_UNSPLASH: Record<string, string> = {
  KOREAN_FOOD:   "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=300&fit=crop",
  BUNSIK:        "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=300&fit=crop",
  CAFE_BAKERY:   "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop",
  CHICKEN:       "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop",
  SERVICE:       "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop",
  RETAIL:        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop",
  ENTERTAINMENT: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop",
  PIZZA:         "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
  BAR_PUB:       "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop",
  EDUCATION:     "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&h=300&fit=crop",
  WESTERN_FOOD:  "https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=400&h=300&fit=crop",
  CHINESE_FOOD:  "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&h=300&fit=crop",
  JAPANESE_FOOD: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
  ASIAN_FOOD:    "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
  MEAT:          "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
  BURGER:        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
  NIGHTCLUB:     "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=400&h=300&fit=crop",
  ACCOMMODATION: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
  OTHER:         "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
};

/** 업종별 아이콘 + 파스텔 배경 + 진한 아이콘색 매핑 */
const CATEGORY_ICON_MAP: Record<string, { icon: LucideIcon; bg: string; iconColor: string; label: string }> = {
  KOREAN_FOOD:   { icon: UtensilsCrossed, bg: "bg-[#FFF3E0]", iconColor: "text-[#E65100]", label: "한식" },
  CAFE_BAKERY:   { icon: Coffee,          bg: "bg-[#EFEBE9]", iconColor: "text-[#5D4037]", label: "카페/베이커리" },
  SERVICE:       { icon: Scissors,        bg: "bg-[#E3F2FD]", iconColor: "text-[#1565C0]", label: "서비스업" },
  RETAIL:        { icon: ShoppingBag,     bg: "bg-[#E8F5E9]", iconColor: "text-[#2E7D32]", label: "도소매" },
  ENTERTAINMENT: { icon: Gamepad2,        bg: "bg-[#F3E5F5]", iconColor: "text-[#6A1B9A]", label: "오락/스포츠" },
  CHICKEN:       { icon: UtensilsCrossed, bg: "bg-[#FFF8E1]", iconColor: "text-[#F57F17]", label: "치킨" },
  BUNSIK:        { icon: UtensilsCrossed, bg: "bg-[#FFE0B2]", iconColor: "text-[#E65100]", label: "분식" },
  EDUCATION:     { icon: GraduationCap,   bg: "bg-[#E0F7FA]", iconColor: "text-[#00695C]", label: "교육" },
  PIZZA:         { icon: Pizza,           bg: "bg-[#FFEBEE]", iconColor: "text-[#C62828]", label: "피자" },
  BAR_PUB:       { icon: Wine,            bg: "bg-[#F3E5F5]", iconColor: "text-[#6A1B9A]", label: "주류/호프" },
  WESTERN_FOOD:  { icon: ChefHat,         bg: "bg-[#FFEBEE]", iconColor: "text-[#AD1457]", label: "양식" },
  JAPANESE_FOOD: { icon: Fish,            bg: "bg-[#E3F2FD]", iconColor: "text-[#1565C0]", label: "일식" },
  CHINESE_FOOD:  { icon: Flame,           bg: "bg-[#FFEBEE]", iconColor: "text-[#B71C1C]", label: "중식" },
  DELIVERY:      { icon: Truck,           bg: "bg-[#E3F2FD]", iconColor: "text-[#1565C0]", label: "배달" },
  ACCOMMODATION: { icon: Bed,             bg: "bg-[#F3E5F5]", iconColor: "text-[#6A1B9A]", label: "숙박" },
  ASIAN_FOOD:    { icon: UtensilsCrossed, bg: "bg-[#FFF3E0]", iconColor: "text-[#E65100]", label: "아시안" },
  MEAT:          { icon: Flame,           bg: "bg-[#FFEBEE]", iconColor: "text-[#B71C1C]", label: "육류" },
  BURGER:        { icon: UtensilsCrossed, bg: "bg-[#FFF8E1]", iconColor: "text-[#F57F17]", label: "버거류" },
  NIGHTCLUB:     { icon: Wine,            bg: "bg-[#F3E5F5]", iconColor: "text-[#6A1B9A]", label: "유흥주점" },
  OTHER:         { icon: Store,           bg: "bg-[#F5F5F5]", iconColor: "text-[#616161]", label: "기타" },
};

/** 업종별 placeholder 이미지 컴포넌트 */
function CategoryPlaceholder({ category, size = "md" }: { category: string; size?: "sm" | "md" | "lg" }) {
  const cat = CATEGORY_ICON_MAP[category] ?? { icon: Store, bg: "bg-[#F5F5F5]", iconColor: "text-[#616161]", label: "매장" };
  const Icon = cat.icon;
  const iconCls = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const textCls = size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";
  return (
    <div className={`flex h-full flex-col items-center justify-center gap-1.5 ${cat.bg} ${cat.iconColor}`}>
      <Icon className={iconCls} />
      <span className={`${textCls} font-medium opacity-60`}>{cat.label}</span>
    </div>
  );
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

export function ListingCard({ listing, variant, isCarouselItem = false, priority = false }: ListingCardProps) {
  if (variant === "search") return <SearchCard listing={listing} />;
  if (variant === "recommend") return <RecommendCard listing={listing} isCarouselItem={isCarouselItem} priority={priority} />;
  return <PremiumCard listing={listing} isCarouselItem={isCarouselItem} priority={priority} />;
}

/* ────────────────────────────────────────────────────────────────
   Premium Card (큰 세로 카드, 홈 프리미엄 섹션)
   ──────────────────────────────────────────────────────────────── */

function PremiumCard({ listing, isCarouselItem, priority = false }: { listing: ListingCardData; isCarouselItem: boolean; priority?: boolean }) {
  const tc = listing.premiumRank >= 2 ? PREMIUM_AD_CONFIG[listing.premiumRank === 3 ? "VIP" : "PREMIUM"] : null;
  const fa = floorAreaStr(listing.floor, listing.areaPyeong);
  const badges = buildBadges(listing, false);
  const hasPremiumFee = listing.premiumFee != null && Number(listing.premiumFee) > 0;
  const hasRevenue = listing.monthlyRevenue != null && Number(listing.monthlyRevenue) > 0;
  const hasProfit = listing.monthlyProfit != null && Number(listing.monthlyProfit) > 0;
  const hasRealImage = listing.images?.[0] && !isPicsum(listing.images[0].url);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group overflow-hidden rounded-xl bg-white transition-all duration-200 active:scale-[0.98] md:hover:-translate-y-1 md:hover:shadow-lg ${isCarouselItem ? "w-48 flex-none snap-start md:w-full md:min-w-0" : "w-full"} ${tc ? "border-t-[3px] border-t-amber-500 shadow-sm" : "border border-gray-200 shadow-sm"}`}
    >
      <div className="relative aspect-[16/9] bg-gray-100">
        {hasRealImage ? (
          <Image src={listing.images[0].thumbnailUrl ?? listing.images[0].url} alt={listing.title} fill className="object-cover" sizes="(max-width:768px) 200px, 20vw" {...(priority ? { priority: true } : { loading: "lazy" as const })} />
        ) : CATEGORY_UNSPLASH[listing.businessCategory] ? (
          <Image src={CATEGORY_UNSPLASH[listing.businessCategory]} alt={listing.title} fill className="object-cover" sizes="(max-width:768px) 200px, 20vw" {...(priority ? { priority: true } : { loading: "lazy" as const })} />
        ) : (
          <CategoryPlaceholder category={listing.businessCategory} size="md" />
        )}
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {catLabel(listing.businessCategory, listing.businessSubtype)}
        </span>
        {fa && (
          <span className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{fa}</span>
        )}
      </div>
      <div className="p-3.5 space-y-1">
        <h3 className="font-bold text-base text-gray-900 truncate">{listing.title}</h3>
        <p className="text-sm text-gray-600">
          보증금 <span className="font-semibold text-gray-800">{price(Number(listing.price))}</span>
        </p>
        <p className="text-sm text-gray-600">
          월세 <span className="font-semibold text-gray-800">{listing.monthlyRent && Number(listing.monthlyRent) > 0 ? price(Number(listing.monthlyRent)) : "0"}</span>
        </p>
        <p className={`font-extrabold text-base ${hasPremiumFee ? "text-red-600" : "text-gray-800"}`}>
          {hasPremiumFee ? `권리금 ${price(Number(listing.premiumFee))}` : "무권리"}
        </p>
        {(hasRevenue || hasProfit) && <div className="h-px bg-gray-100" />}
        {(hasRevenue || hasProfit) && (
          <p className="text-xs text-gray-500">
            {hasRevenue && <>월매출 {price(Number(listing.monthlyRevenue))}</>}
            {hasRevenue && hasProfit && <span className="mx-1 text-gray-300">|</span>}
            {hasProfit && <>월수익 {price(Number(listing.monthlyProfit))}</>}
          </p>
        )}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map(b => (
              <span key={b.label} className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${b.cls}`}>{b.label}</span>
            ))}
          </div>
        )}
        <p className="flex items-center gap-0.5 text-xs text-gray-400">
          <MapPin className="h-2.5 w-2.5 shrink-0" />{formatLocation(listing.city, listing.district)}
        </p>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────────────────────────────
   Recommend Card (작은 세로 카드, 홈 오늘의 추천)
   ──────────────────────────────────────────────────────────────── */

function RecommendCard({ listing, isCarouselItem, priority = false }: { listing: ListingCardData; isCarouselItem: boolean; priority?: boolean }) {
  const isRecommend = listing.premiumRank === 2;
  const hasPremiumFee = listing.premiumFee != null && Number(listing.premiumFee) > 0;
  const hasRevenue = listing.monthlyRevenue != null && Number(listing.monthlyRevenue) > 0;
  const hasProfit = listing.monthlyProfit != null && Number(listing.monthlyProfit) > 0;
  const badges = buildBadges(listing, true);
  const hasRealImage = listing.images?.[0] && !isPicsum(listing.images[0].url);

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200 active:scale-[0.98] md:hover:-translate-y-1 md:hover:shadow-lg ${isCarouselItem ? "w-44 flex-none snap-start md:w-full md:min-w-0" : "w-full"} ${isRecommend ? "border-blue-200" : "border-gray-200"}`}
    >
      <div className="relative h-[120px] bg-gray-100">
        {hasRealImage ? (
          <Image src={listing.images[0].thumbnailUrl ?? listing.images[0].url} alt={listing.title} fill className="object-cover" sizes="(max-width:768px) 176px, 16vw" {...(priority ? { priority: true } : { loading: "lazy" as const })} />
        ) : CATEGORY_UNSPLASH[listing.businessCategory] ? (
          <Image src={CATEGORY_UNSPLASH[listing.businessCategory]} alt={listing.title} fill className="object-cover" sizes="(max-width:768px) 176px, 16vw" {...(priority ? { priority: true } : { loading: "lazy" as const })} />
        ) : (
          <CategoryPlaceholder category={listing.businessCategory} size="sm" />
        )}
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
          {catLabel(listing.businessCategory, listing.businessSubtype)}
        </span>
        {isRecommend && <span className="absolute right-1.5 bottom-1.5 rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">추천</span>}
      </div>
      <div className="p-3.5 space-y-1">
        <h3 className="font-bold text-base text-gray-900 truncate">{listing.title}</h3>
        <p className="text-sm text-gray-600">
          보증금 <span className="font-semibold text-gray-800">{price(Number(listing.price))}</span>
        </p>
        <p className="text-sm text-gray-600">
          월세 <span className="font-semibold text-gray-800">{listing.monthlyRent && Number(listing.monthlyRent) > 0 ? price(Number(listing.monthlyRent)) : "0"}</span>
        </p>
        <p className={`font-extrabold text-base ${hasPremiumFee ? "text-red-600" : "text-gray-800"}`}>
          {hasPremiumFee ? `권리금 ${price(Number(listing.premiumFee))}` : "무권리"}
        </p>
        {(hasRevenue || hasProfit) && <div className="h-px bg-gray-100" />}
        {(hasRevenue || hasProfit) && (
          <p className="text-xs text-gray-500">
            {hasRevenue && <>월매출 {price(Number(listing.monthlyRevenue))}</>}
            {hasRevenue && hasProfit && <span className="mx-0.5 text-gray-300">|</span>}
            {hasProfit && <>월수익 {price(Number(listing.monthlyProfit))}</>}
          </p>
        )}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {badges.map(b => <span key={b.label} className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${b.cls}`}>{b.label}</span>)}
          </div>
        )}
        <p className="flex items-center gap-0.5 text-xs text-gray-400 truncate">
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
  const hasRealImage = thumbnail && !isPicsum(thumbnail);
  const fa = floorAreaStr(listing.floor, listing.areaPyeong);
  const hasPremiumFee = listing.premiumFee != null && Number(listing.premiumFee) > 0;
  const hasRevenue = listing.monthlyRevenue != null && Number(listing.monthlyRevenue) > 0;
  const hasProfit = listing.monthlyProfit != null && Number(listing.monthlyProfit) > 0;
  const badges = buildBadges(listing, false);

  const tierConfig = listing.premiumRank >= 2 ? PREMIUM_AD_CONFIG[listing.premiumRank === 3 ? "VIP" : "PREMIUM"] : null;
  const imageCount = listing.images.length;

  const borderClass = listing.urgentTag?.active
    ? "border-2 border-red-400"
    : tierConfig
      ? "border-2 border-amber-400"
      : "border border-gray-100";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group flex gap-3 overflow-hidden rounded-xl bg-white p-3 transition-all duration-200 hover:shadow-md md:hover:-translate-y-0.5 ${borderClass}`}
    >
      {/* 썸네일 */}
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-40 sm:w-40">
        {hasRealImage ? (
          <Image src={thumbnail} alt={listing.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="160px" />
        ) : CATEGORY_UNSPLASH[listing.businessCategory] ? (
          <Image src={CATEGORY_UNSPLASH[listing.businessCategory]} alt={listing.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="160px" />
        ) : (
          <CategoryPlaceholder category={listing.businessCategory} size="lg" />
        )}
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {catLabel(listing.businessCategory, listing.businessSubtype)}
        </span>
        {fa && (
          <span className="absolute right-1.5 top-1.5 rounded bg-black/50 px-1 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">{fa}</span>
        )}
        {tierConfig ? (
          <span className={`absolute bottom-1.5 left-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold border ${tierConfig.bg} ${tierConfig.color} ${tierConfig.border}`}>
            {tierConfig.badge}
          </span>
        ) : imageCount > 1 ? (
          <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white backdrop-blur-sm">
            📷 {imageCount}
          </span>
        ) : null}
        {listing.isJumpUp && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-blue-600/90 px-1 py-0.5 text-[9px] font-bold text-white">⬆️</span>
        )}
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
        <h3 className="text-sm font-bold text-gray-900 truncate">{listing.title}</h3>
        <p className="truncate text-sm font-semibold text-[#1B3A5C]">
          보증금 {price(Number(listing.price))} / 월세{" "}
          {listing.monthlyRent && Number(listing.monthlyRent) > 0 ? price(Number(listing.monthlyRent)) : "0"}
        </p>
        <p className={`text-[15px] font-bold leading-tight ${hasPremiumFee ? "text-red-500" : "text-[#1B3A5C]"}`}>
          {hasPremiumFee ? `권리금 ${price(Number(listing.premiumFee))}` : "무권리"}
        </p>
        {(hasRevenue || hasProfit) && (
          <p className="truncate text-xs text-gray-500">
            {hasRevenue && <>월매출 {price(Number(listing.monthlyRevenue))}</>}
            {hasRevenue && hasProfit && <span className="mx-1 text-gray-300">|</span>}
            {hasProfit && <>월수익 {price(Number(listing.monthlyProfit))}</>}
          </p>
        )}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map(b => (
              <span key={b.label} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${b.cls}`}>{b.label}</span>
            ))}
          </div>
        )}
        <p className="flex items-center gap-0.5 text-xs text-gray-400">
          <MapPin className="h-3 w-3 shrink-0" />{formatLocation(listing.city, listing.district)}
        </p>
      </div>
    </Link>
  );
}
