"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Store,
  TrendingUp,
  DollarSign,
  Search,
  FileEdit,
  Building,
  Paintbrush,
  Trash2,
  Sparkles,
  Signpost,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Home,
  User,
  Users,
  Calculator,
  Crown,
  Check,
  Scale,
  Hammer,
  Receipt,
  BarChart3,
  Target,
  ArrowRight,
} from "lucide-react";
import { AuthNavItems } from "./(main)/auth-nav";
import { formatKRW } from "@/lib/utils/format";
import { REGIONS, BUSINESS_CATEGORY_LABELS, SAFETY_GRADE_CONFIG, PREMIUM_AD_CONFIG } from "@/lib/utils/constants";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

interface ListingCard {
  id: string;
  title: string;
  businessCategory: string;
  storeType: string;
  price: string;
  monthlyRent: string | null;
  premiumFee: string | null;
  monthlyRevenue: string | null;
  monthlyProfit: string | null;
  areaPyeong: number | null;
  floor: string | null;
  city: string;
  district: string;
  images: { url: string; thumbnailUrl: string | null }[];
  safetyGrade: string | null;
  isPremium: boolean;
  premiumRank: number;
}

interface FranchiseCard {
  id: string;
  brandName: string;
  subcategory: string;
  monthlyAvgSales: string | null;
  startupCost: string | null;
  storeCount: number | null;
  isPromoting: boolean;
}

interface BoardPostCard {
  id: string;
  category: string;
  title: string;
  createdAt: string;
}

interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
}

/** Raw listing shape from /api/listings before BigInt string coercion */
interface RawListingResponse {
  id: string;
  title: string;
  businessCategory: string;
  storeType: string;
  price: string | number | bigint;
  monthlyRent: string | number | bigint | null;
  premiumFee: string | number | bigint | null;
  monthlyRevenue: string | number | bigint | null;
  monthlyProfit: string | number | bigint | null;
  areaPyeong: number | null;
  floor: string | null;
  city: string;
  district: string;
  images: { url: string; thumbnailUrl: string | null }[];
  safetyGrade: string | null;
  isPremium: boolean | null;
  premiumRank: number | null;
}

const REGION_TABS = ["서울", "경기", "그 외"];
const FRANCHISE_TABS = ["외식", "도소매", "서비스"];

const CATEGORY_ICONS = [
  { icon: Store, label: "점포 찾기", href: "/listings", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: FileEdit, label: "점포 팔기", href: "/listings/new", color: "text-green-500", bg: "bg-green-50" },
  { icon: Building, label: "프랜차이즈", href: "/franchise", color: "text-purple-500", bg: "bg-purple-50" },
  { icon: Search, label: "점포찾기 의뢰", href: "/listings", color: "text-orange-500", bg: "bg-orange-50" },
  { icon: Paintbrush, label: "인테리어 의뢰", href: "/bbs?category=인테리어", color: "text-pink-500", bg: "bg-pink-50" },
  { icon: Trash2, label: "철거 의뢰", href: "/bbs?category=철거", color: "text-red-500", bg: "bg-red-50" },
  { icon: Sparkles, label: "청소 의뢰", href: "/bbs?category=청소", color: "text-cyan-500", bg: "bg-cyan-50" },
  { icon: Signpost, label: "간판 의뢰", href: "/bbs?category=간판", color: "text-amber-500", bg: "bg-amber-50" },
];

const BANNERS_FALLBACK = [
  { title: "전국 상가·점포 매물", sub: "내 점포, 여기서 찾자!", gradient: "from-navy via-navy-light to-mint" },
  { title: "프랜차이즈 창업 정보", sub: "브랜드별 매출·창업비용 한눈에", gradient: "from-[#6366f1] via-[#8b5cf6] to-[#a78bfa]" },
  { title: "무료 점포 등록", sub: "지금 바로 내 점포를 등록하세요", gradient: "from-[#f59e0b] via-[#f97316] to-[#ef4444]" },
];

const regionKeys = Object.keys(REGIONS);

/** Normalize raw listing API response to ListingCard shape */
function toListingCard(l: RawListingResponse): ListingCard {
  return {
    ...l,
    price: String(l.price ?? "0"),
    monthlyRent: l.monthlyRent ? String(l.monthlyRent) : null,
    premiumFee: l.premiumFee ? String(l.premiumFee) : null,
    monthlyRevenue: l.monthlyRevenue ? String(l.monthlyRevenue) : null,
    monthlyProfit: l.monthlyProfit ? String(l.monthlyProfit) : null,
    isPremium: Boolean(l.isPremium),
    premiumRank: Number(l.premiumRank ?? 0),
  };
}

export default function HomePage() {
  const router = useRouter();
  const [regionTab, setRegionTab] = useState("서울");
  const [franchiseTab, setFranchiseTab] = useState("외식");
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [premiumListings, setPremiumListings] = useState<ListingCard[]>([]);
  const [franchises, setFranchises] = useState<FranchiseCard[]>([]);
  const [posts, setPosts] = useState<BoardPostCard[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerDir, setBannerDir] = useState<"left" | "right">("right");
  const [dataLoadError, setDataLoadError] = useState(false);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const districtOptions = selectedCity ? REGIONS[selectedCity] ?? [] : [];

  // Fetch banners
  useEffect(() => {
    fetch("/api/admin/banners")
      .then((r) => r.json())
      .then((j) => { if (j.data?.length) setBanners(j.data); })
      .catch(() => { setDataLoadError(true); /* non-critical: fallback banners used */ });
  }, []);

  // Auto-slide banner
  useEffect(() => {
    const count = banners.length || BANNERS_FALLBACK.length;
    if (count <= 1) return;
    const timer = setInterval(() => {
      setBannerDir("right");
      setBannerIdx((i) => (i + 1) % count);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Fetch premium listings
  useEffect(() => {
    fetch("/api/listings?premiumOnly=true&limit=4")
      .then((r) => r.json())
      .then((j) =>
        setPremiumListings(
          (j.data ?? []).map((l: RawListingResponse) => toListingCard(l))
        )
      )
      .catch(() => { setPremiumListings([]); setDataLoadError(true); });
  }, []);

  useEffect(() => {
    fetch("/api/bbs?limit=5")
      .then((r) => r.json())
      .then((j) => setPosts(j.data?.slice(0, 5) ?? []))
      .catch(() => { setPosts([]); setDataLoadError(true); });
  }, []);

  useEffect(() => {
    const regionParam = regionTab === "그 외" ? "" : regionTab;
    fetch(`/api/listings?query=${regionParam}&limit=6`)
      .then((r) => r.json())
      .then((j) =>
        setListings(
          (j.data ?? []).map((l: RawListingResponse) => toListingCard(l))
        )
      )
      .catch(() => { setListings([]); setDataLoadError(true); });
  }, [regionTab]);

  useEffect(() => {
    fetch(`/api/franchise?category=${franchiseTab}`)
      .then((r) => r.json())
      .then((j) => setFranchises(j.data?.slice(0, 4) ?? []))
      .catch(() => { setFranchises([]); setDataLoadError(true); });
  }, [franchiseTab]);

  const handleLocationSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (selectedCity) params.set("city", selectedCity);
      if (selectedDistrict) params.set("district", selectedDistrict);
      router.push(`/listings?${params.toString()}`);
    },
    [selectedCity, selectedDistrict]
  );

  const bannerCount = banners.length || BANNERS_FALLBACK.length;

  const prevBanner = () => {
    setBannerDir("left");
    setBannerIdx((i) => (i - 1 + bannerCount) % bannerCount);
  };
  const nextBanner = () => {
    setBannerDir("right");
    setBannerIdx((i) => (i + 1) % bannerCount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Data Load Error Banner */}
      {dataLoadError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-700">
          일부 데이터를 불러오지 못했습니다.
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logos/krw_shop_logo_symbol_transparent.png" alt="권리샵" width={32} height={32} priority />
            <span className="font-heading text-lg font-bold text-navy">권리샵</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/listings" className="text-sm font-medium text-gray-600 transition-colors hover:text-navy">점포 찾기</Link>
            <Link href="/listings/new" className="text-sm font-medium text-gray-600 transition-colors hover:text-navy">점포 팔기</Link>
            <Link href="/franchise" className="text-sm font-medium text-gray-600 transition-colors hover:text-navy">프랜차이즈</Link>
            <Link href="/bbs" className="text-sm font-medium text-gray-600 transition-colors hover:text-navy">이용가이드</Link>
          </nav>
          <div className="flex items-center">
            <AuthNavItems />
          </div>
        </div>
      </header>

      {/* Banner Carousel */}
      <section className="relative overflow-hidden">
        <div className="relative h-56 md:h-72 lg:h-80">
          {banners.length > 0 ? (
            banners.map((b, i) => (
              <div
                key={b.id}
                className="absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out"
                style={{
                  opacity: i === bannerIdx ? 1 : 0,
                  transform: i === bannerIdx
                    ? "translateX(0)"
                    : bannerDir === "right"
                      ? "translateX(40px)"
                      : "translateX(-40px)",
                  pointerEvents: i === bannerIdx ? "auto" : "none",
                }}
              >
                {b.linkUrl ? (
                  <Link href={b.linkUrl} className="block h-full w-full">
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-navy to-mint">
                      <h2 className="font-heading text-2xl font-bold text-white md:text-4xl">{b.title}</h2>
                    </div>
                  </Link>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-navy to-mint">
                    <h2 className="font-heading text-2xl font-bold text-white md:text-4xl">{b.title}</h2>
                  </div>
                )}
              </div>
            ))
          ) : (
            BANNERS_FALLBACK.map((b, i) => (
              <div
                key={i}
                className={`absolute inset-0 flex items-center justify-center bg-gradient-to-r ${b.gradient} transition-all duration-700 ease-in-out`}
                style={{
                  opacity: i === bannerIdx ? 1 : 0,
                  transform: i === bannerIdx
                    ? "translateX(0)"
                    : bannerDir === "right"
                      ? "translateX(40px)"
                      : "translateX(-40px)",
                  pointerEvents: i === bannerIdx ? "auto" : "none",
                }}
              >
                <div className="text-center text-white">
                  <h2 className="font-heading text-2xl font-bold md:text-4xl animate-fade-in">{b.title}</h2>
                  <p className="mt-2 text-sm text-white md:text-base animate-slide-up">{b.sub}</p>
                  {i === 0 && (
                    <Link
                      href="/listings"
                      className="mt-5 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-navy shadow-lg transition-all hover:scale-105 hover:shadow-xl animate-slide-up"
                    >
                      매물 보러가기
                    </Link>
                  )}
                  {i === 1 && (
                    <Link
                      href="/franchise"
                      className="mt-5 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-purple-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl animate-slide-up"
                    >
                      프랜차이즈 둘러보기
                    </Link>
                  )}
                  {i === 2 && (
                    <Link
                      href="/listings/new"
                      className="mt-5 inline-block rounded-full bg-white px-8 py-3 text-sm font-bold text-orange-500 shadow-lg transition-all hover:scale-105 hover:shadow-xl animate-slide-up"
                    >
                      무료로 매물 등록하기
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Banner nav */}
        {bannerCount > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
              aria-label="이전 배너"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50"
              aria-label="다음 배너"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2" role="tablist">
              {Array.from({ length: bannerCount }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === bannerIdx ? "w-6 bg-white" : "w-2 bg-white/40"}`}
                  role="tab"
                  aria-selected={i === bannerIdx}
                  aria-label={`배너 ${i + 1}번으로 이동`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Search Bar */}
      <section className="border-b border-gray-200 bg-white py-4 shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <form onSubmit={handleLocationSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict(""); }}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-mint focus:ring-2 focus:ring-mint/20 sm:w-44"
            >
              <option value="">시/도 선택</option>
              {regionKeys.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedCity}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors focus:border-mint focus:ring-2 focus:ring-mint/20 disabled:bg-gray-100 sm:w-44"
            >
              <option value="">구/군 선택</option>
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-mint px-8 py-2.5 text-sm font-bold text-white transition-all duration-150 hover:bg-mint-dark active:scale-[0.97]"
            >
              매물검색
            </button>
          </form>
        </div>
      </section>

      {/* Category Icons */}
      <RevealOnScroll>
        <section className="bg-gray-50 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
              {CATEGORY_ICONS.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="flex flex-col items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-2 py-4 text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-mint hover:shadow-md"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${cat.bg}`}>
                    <cat.icon className={`h-6 w-6 ${cat.color}`} />
                  </div>
                  <span className="text-center text-[11px] font-medium leading-tight">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Premium Listings Carousel */}
      {premiumListings.length > 0 && (
          <section className="border-t border-gray-200 bg-gradient-to-b from-amber-50/50 to-gray-50 py-10">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  <h2 className="font-heading text-xl font-bold text-navy">프리미엄 매물</h2>
                </div>
                <Link href="/listings" className="flex items-center text-sm text-gray-500 transition-colors hover:text-mint">
                  전체보기 <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {premiumListings.map((item) => {
                  const tierKey = item.premiumRank === 3 ? "VIP" : item.premiumRank === 2 ? "PREMIUM" : "BASIC";
                  const tierConfig = PREMIUM_AD_CONFIG[tierKey];
                  return (
                    <Link
                      key={item.id}
                      href={`/listings/${item.id}`}
                      className={`group flex-none w-72 overflow-hidden rounded-xl border-2 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${tierConfig?.border ?? "border-gray-200"}`}
                    >
                      <div className={`h-1 bg-gradient-to-r ${tierConfig?.gradient ?? ""}`} />
                      <div className="relative aspect-[4/3] bg-gray-100">
                        {item.images?.[0] ? (
                          <Image
                            src={item.images[0].thumbnailUrl ?? item.images[0].url}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="288px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300">
                            <Store className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                        <span className={`absolute left-2 bottom-2 rounded px-2 py-0.5 text-[11px] font-bold border ${tierConfig?.bg ?? ""} ${tierConfig?.color ?? ""} ${tierConfig?.border ?? ""}`}>
                          {tierConfig?.badge}
                        </span>
                      </div>
                      <div className="p-3.5">
                        <h3 className="truncate text-sm font-bold text-navy">{item.title}</h3>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex gap-3">
                            <span className="w-16 text-gray-500">보증금/월세</span>
                            <span className="font-bold text-navy">
                              {formatKRW(Number(item.price))}
                              {item.monthlyRent ? ` / ${formatKRW(Number(item.monthlyRent))}` : ""}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <span className="w-16 text-gray-500">권리금</span>
                            <span className={`font-bold ${Number(item.premiumFee) > 0 ? "text-orange-600" : "text-mint"}`}>
                              {item.premiumFee && Number(item.premiumFee) > 0 ? formatKRW(Number(item.premiumFee)) : "무권리"}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-500">
                          <MapPin className="h-3 w-3" /> {item.city} {item.district}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
      )}

      {/* Today's Recommended Listings */}
      <RevealOnScroll>
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-navy">오늘의 추천 매물</h2>
              <Link href="/listings" className="flex items-center text-sm text-gray-500 transition-colors hover:text-mint">
                전체보기 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 flex gap-2">
              {REGION_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRegionTab(tab)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ${regionTab === tab ? "bg-navy text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {listings.length === 0 ? (
                <p className="col-span-3 py-12 text-center text-gray-500">매물이 없습니다</p>
              ) : (
                listings.map((item) => {
                  const tierKey = item.premiumRank === 3 ? "VIP" : item.premiumRank === 2 ? "PREMIUM" : item.premiumRank === 1 ? "BASIC" : null;
                  const tierConfig = tierKey ? PREMIUM_AD_CONFIG[tierKey] : null;
                  return (
                  <Link
                    key={item.id}
                    href={`/listings/${item.id}`}
                    className={`group overflow-hidden rounded-xl border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${tierConfig ? `border-2 ${tierConfig.border}` : "border-gray-200"}`}
                  >
                    {tierConfig && <div className={`h-1 bg-gradient-to-r ${tierConfig.gradient}`} />}
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {item.images?.[0] ? (
                        <Image
                          src={item.images[0].thumbnailUrl ?? item.images[0].url}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          <Store className="h-10 w-10" />
                        </div>
                      )}
                      {/* Gradient overlay for readability */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                      <span className="absolute left-2 top-2 rounded bg-navy/80 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                        {BUSINESS_CATEGORY_LABELS[item.businessCategory] ?? item.businessCategory}
                      </span>
                      {item.safetyGrade && SAFETY_GRADE_CONFIG[item.safetyGrade] && (
                        <span className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-bold backdrop-blur-sm border ${SAFETY_GRADE_CONFIG[item.safetyGrade].bg} ${SAFETY_GRADE_CONFIG[item.safetyGrade].color} ${SAFETY_GRADE_CONFIG[item.safetyGrade].border}`}>
                          안전 {SAFETY_GRADE_CONFIG[item.safetyGrade].label}
                        </span>
                      )}
                      {tierConfig && (
                        <span className={`absolute left-1/2 -translate-x-1/2 bottom-2 rounded px-2 py-0.5 text-[11px] font-bold border ${tierConfig.bg} ${tierConfig.color} ${tierConfig.border}`}>
                          {tierConfig.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="truncate text-sm font-bold text-navy">{item.title}</h3>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex gap-3">
                          <span className="w-16 text-gray-500">보증금/월세</span>
                          <span className="font-bold text-navy">
                            {formatKRW(Number(item.price))}
                            {item.monthlyRent ? ` / ${formatKRW(Number(item.monthlyRent))}` : ""}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <span className="w-16 text-gray-500">권리금</span>
                          <span className={`font-bold ${Number(item.premiumFee) > 0 ? "text-orange-600" : "text-mint"}`}>
                            {item.premiumFee && Number(item.premiumFee) > 0 ? formatKRW(Number(item.premiumFee)) : "무권리"}
                          </span>
                        </div>
                      </div>
                      {(item.monthlyRevenue || item.monthlyProfit) && (
                        <div className="mt-2 flex gap-3 border-t border-gray-100 pt-2 text-[11px]">
                          {item.monthlyRevenue && <span className="text-gray-500">월매출 <span className="font-medium text-mint">{formatKRW(Number(item.monthlyRevenue))}</span></span>}
                          {item.monthlyProfit && <span className="text-gray-500">월수익 <span className="font-medium text-green-600">{formatKRW(Number(item.monthlyProfit))}</span></span>}
                        </div>
                      )}
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-500">
                        <MapPin className="h-3 w-3" /> {item.city} {item.district}
                      </p>
                    </div>
                  </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Recommended Franchises */}
      <RevealOnScroll>
        <section className="border-t border-gray-200 bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-navy">추천 프랜차이즈</h2>
              <Link href="/franchise" className="flex items-center text-sm text-gray-500 transition-colors hover:text-mint">
                전체보기 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex gap-2">
              {FRANCHISE_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFranchiseTab(tab)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ${franchiseTab === tab ? "bg-mint text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {franchises.length === 0 ? (
                <p className="col-span-4 py-12 text-center text-gray-500">프랜차이즈 정보가 없습니다</p>
              ) : (
                franchises.map((brand) => (
                  <div
                    key={brand.id}
                    className="rounded-xl border border-gray-200 border-l-4 border-l-mint bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-medium text-mint">{brand.subcategory}</span>
                        <h3 className="mt-1 text-base font-bold text-navy">{brand.brandName}</h3>
                      </div>
                      {brand.isPromoting && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">프로모션</span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {brand.monthlyAvgSales && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-3.5 w-3.5 text-mint" />
                          <span className="text-gray-500">월 평균매출</span>
                          <span className="ml-auto font-bold text-navy">{formatKRW(Number(brand.monthlyAvgSales))}</span>
                        </div>
                      )}
                      {brand.startupCost && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-3.5 w-3.5 text-navy-light" />
                          <span className="text-gray-500">창업비용</span>
                          <span className="ml-auto font-bold text-navy">{formatKRW(Number(brand.startupCost))}</span>
                        </div>
                      )}
                      {brand.storeCount != null && (
                        <div className="flex items-center gap-2 text-sm">
                          <Store className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-gray-500">가맹점</span>
                          <span className="ml-auto font-bold text-navy">{brand.storeCount.toLocaleString()}개</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Startup Info */}
      <RevealOnScroll>
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-navy">창업정보</h2>
              <Link href="/bbs" className="flex items-center text-sm text-gray-500 transition-colors hover:text-mint">
                전체보기 <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
              {posts.length === 0 ? (
                <p className="py-8 text-center text-gray-500">게시글이 없습니다</p>
              ) : (
                posts.map((post) => (
                  <Link key={post.id} href={`/bbs/${post.id}`} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">{post.category}</span>
                      <span className="text-sm text-gray-800">{post.title}</span>
                    </div>
                    <span className="shrink-0 text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Expert Consultation */}
      <RevealOnScroll>
        <section className="border-t border-gray-200 bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center">
              <h2 className="font-heading text-2xl font-bold text-navy md:text-3xl">
                전문 분야별 전문가와 직접 상담하세요
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-gray-500">
                검증된 각 분야 전문가가 창업과 점포 운영에 필요한 모든 상담을 도와드립니다.
                법률, 인테리어, 철거, 세무, 부동산 전문가를 지금 만나보세요.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Scale,
                  title: "법률 / 세무 전문가",
                  desc: "계약서 검토, 세무 신고, 사업자 등록 등 법률·세무 분야의 전문 상담을 받아보세요.",
                  color: "text-blue-500",
                  bg: "bg-blue-50",
                },
                {
                  icon: Paintbrush,
                  title: "인테리어 전문가",
                  desc: "업종에 최적화된 인테리어 설계부터 시공까지, 경험 많은 전문가가 함께합니다.",
                  color: "text-pink-500",
                  bg: "bg-pink-50",
                },
                {
                  icon: Hammer,
                  title: "철거 / 부동산 전문가",
                  desc: "원상복구, 철거 견적부터 상권 분석, 입지 선정까지 전문가의 도움을 받으세요.",
                  color: "text-orange-500",
                  bg: "bg-orange-50",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.bg}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-navy">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{card.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/experts"
                className="inline-flex items-center gap-2 rounded-lg bg-mint px-8 py-3 font-medium text-white shadow-lg shadow-mint/25 transition-all duration-150 hover:bg-mint-dark hover:shadow-xl hover:shadow-mint/30 active:scale-[0.97]"
              >
                <Users className="h-5 w-5" />
                전문가 찾기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Startup Simulator */}
      <RevealOnScroll>
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:flex">
              {/* Left content */}
              <div className="flex-1 p-8 md:p-10 lg:p-12">
                <span className="inline-block rounded-full bg-mint/10 px-3 py-1 text-xs font-bold text-mint">
                  NEW
                </span>
                <h2 className="mt-4 font-heading text-2xl font-bold text-navy md:text-3xl">
                  창업 수익성을 미리 계산해보세요
                </h2>
                <p className="mt-3 max-w-lg text-gray-500">
                  권리샵 시뮬레이터로 업종별 예상 수익과 초기 투자비를 미리 분석하고,
                  데이터 기반의 스마트한 창업 결정을 내리세요.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    { icon: BarChart3, label: "업종별 수익 분석", desc: "실제 매출 데이터 기반 예상 수익 시뮬레이션" },
                    { icon: Receipt, label: "초기 투자비 산정", desc: "보증금, 권리금, 인테리어 등 총 창업비용 계산" },
                    { icon: Target, label: "손익분기점 계산", desc: "투자금 회수 시점과 월별 손익 추이 분석" },
                  ].map((feature) => (
                    <div key={feature.label} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mint/10">
                        <feature.icon className="h-5 w-5 text-mint" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-navy">{feature.label}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <Link
                    href="/simulator"
                    className="inline-flex items-center gap-2 rounded-lg bg-mint px-8 py-3 font-medium text-white shadow-lg shadow-mint/25 transition-all duration-150 hover:bg-mint-dark hover:shadow-xl hover:shadow-mint/30 active:scale-[0.97]"
                  >
                    <Calculator className="h-5 w-5" />
                    시뮬레이터 시작하기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              {/* Right visual */}
              <div className="hidden items-center justify-center bg-gradient-to-br from-mint/5 to-navy/5 p-10 lg:flex lg:w-96">
                <div className="text-center">
                  <Calculator className="mx-auto h-20 w-20 text-mint/60" />
                  <p className="mt-4 text-sm font-medium text-navy/60">
                    창업 시뮬레이터
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    업종 선택 한 번으로 수익성 분석 완료
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* Subscription Plans */}
      <RevealOnScroll>
        <section className="border-t border-gray-200 bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center">
              <h2 className="font-heading text-2xl font-bold text-navy md:text-3xl">
                나에게 맞는 요금제를 선택하세요
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-500">
                무료 플랜부터 전문가 전용 플랜까지, 필요에 맞는 요금제로 권리샵의 모든 기능을 활용하세요.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* FREE Plan */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy">FREE</h3>
                    <p className="text-xs text-gray-500">무료</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-2xl font-bold text-navy">
                    &#8361;0<span className="text-sm font-normal text-gray-400">/월</span>
                  </p>
                </div>
                <ul className="mt-5 space-y-3">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> 매물 검색 및 조회
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> 월 3건 매물 등록
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> 기본 시뮬레이터 이용
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    href="/pricing"
                    className="block rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 transition-all duration-150 hover:border-mint hover:text-mint"
                  >
                    현재 플랜
                  </Link>
                </div>
              </div>

              {/* PRO Plan */}
              <div className="relative rounded-xl border-2 border-mint bg-white p-6 shadow-lg shadow-mint/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-mint/15">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-mint px-4 py-1 text-xs font-bold text-white">
                  인기
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mint/10">
                    <Crown className="h-5 w-5 text-mint" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy">PRO</h3>
                    <p className="text-xs text-gray-500">프로</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-2xl font-bold text-navy">
                    &#8361;29,900<span className="text-sm font-normal text-gray-400">/월</span>
                  </p>
                </div>
                <ul className="mt-5 space-y-3">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> 무제한 매물 등록
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> 프리미엄 시뮬레이터
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> 안전거래 리포트 제공
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    href="/pricing"
                    className="block rounded-lg bg-mint py-2.5 text-center text-sm font-bold text-white shadow-sm transition-all duration-150 hover:bg-mint-dark active:scale-[0.97]"
                  >
                    PRO 시작하기
                  </Link>
                </div>
              </div>

              {/* EXPERT Plan */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/10">
                    <Crown className="h-5 w-5 text-navy" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy">EXPERT</h3>
                    <p className="text-xs text-gray-500">전문가</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-2xl font-bold text-navy">
                    &#8361;59,900<span className="text-sm font-normal text-gray-400">/월</span>
                  </p>
                </div>
                <ul className="mt-5 space-y-3">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> PRO 플랜 전체 포함
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> 1:1 전문가 상담 무제한
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 shrink-0 text-mint" /> 상권 분석 리포트 제공
                  </li>
                </ul>
                <div className="mt-6">
                  <Link
                    href="/pricing"
                    className="block rounded-lg border border-navy py-2.5 text-center text-sm font-medium text-navy transition-all duration-150 hover:bg-navy hover:text-white"
                  >
                    EXPERT 시작하기
                  </Link>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link href="/pricing" className="text-sm text-gray-500 underline underline-offset-4 transition-colors hover:text-mint">
                요금제 상세 비교 보기
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* CTA */}
      <section className="relative overflow-hidden bg-navy py-16">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">내 점포, 지금 등록하세요</h2>
          <p className="mt-3 text-gray-300">무료로 점포를 등록하고 빠르게 양도·양수하세요.</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/listings/new" className="rounded-lg bg-mint px-8 py-3 font-medium text-white shadow-lg shadow-mint/25 transition-all duration-150 hover:bg-mint-dark hover:shadow-xl hover:shadow-mint/30 active:scale-[0.97]">
              점포 등록하기
            </Link>
            <Link href="/register" className="rounded-lg border border-white/30 px-8 py-3 font-medium text-white transition-all duration-150 hover:border-white/60 hover:bg-white/10">
              무료 가입
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Image src="/logos/krw_shop_logo_symbol_transparent.png" alt="권리샵" width={28} height={28} />
              <span className="font-heading text-sm font-bold text-navy">권리샵</span>
            </div>
            <nav className="flex gap-6 text-sm text-gray-500">
              <Link href="/legal/terms" className="transition-colors hover:text-navy">이용약관</Link>
              <Link href="/legal/privacy" className="transition-colors hover:text-navy">개인정보처리방침</Link>
              <Link href="/legal/disclaimer" className="transition-colors hover:text-navy">면책조항</Link>
            </nav>
            <p className="text-xs text-gray-500">&copy; 2026 권리샵. All rights reserved.</p>
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">
            본 서비스에서 제공하는 정보는 참고용이며, 플랫폼은 매물의 정확성을 보증하지 않습니다.
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <Link href="/" className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-mint" aria-current="page">
          <Home className="h-5 w-5" /> 홈
        </Link>
        <Link href="/listings" className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500 transition-colors hover:text-mint">
          <Search className="h-5 w-5" /> 점포찾기
        </Link>
        <Link href="/listings/new" className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500 transition-colors hover:text-mint">
          <FileEdit className="h-5 w-5" /> 점포팔기
        </Link>
        <Link href="/franchise" className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500 transition-colors hover:text-mint">
          <Building className="h-5 w-5" /> 프랜차이즈
        </Link>
        <Link href="/dashboard" className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500 transition-colors hover:text-mint">
          <User className="h-5 w-5" /> 내정보
        </Link>
      </nav>
    </div>
  );
}
