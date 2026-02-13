"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Store, TrendingUp, DollarSign, Search, FileEdit, Building,
  Paintbrush, Trash2, Sparkles, Signpost, MapPin, ChevronRight,
  ChevronLeft, Home, User, Users, Calculator, Check, Scale, Hammer,
  ArrowRight, ShieldCheck, FileText, ClipboardList, BarChart3,
  Receipt, Target, Calendar, ChevronDown, MessageCircle, Eye,
} from "lucide-react";
import { AuthNavItems } from "./(main)/auth-nav";
import { formatKRW } from "@/lib/utils/format";
import {
  BUSINESS_CATEGORY_LABELS,
  SAFETY_GRADE_CONFIG, PREMIUM_AD_CONFIG,
} from "@/lib/utils/constants";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";

/* ─── CountUp ─── */
function CountUp({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const dur = 1400;
    const t0 = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, end]);

  return <span ref={ref}>{value.toLocaleString("ko-KR")}{suffix}</span>;
}

/* ─── Skeleton Card ─── */
function SkeletonCard() {
  return (
    <div className="w-64 flex-none snap-start overflow-hidden rounded-xl border border-gray-200 bg-white md:w-auto md:flex-1">
      <div className="aspect-[4/3] animate-pulse bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

/* ─── Interfaces ─── */
interface ListingCard {
  id: string; title: string; businessCategory: string; storeType: string;
  price: string; monthlyRent: string | null; premiumFee: string | null;
  monthlyRevenue: string | null; monthlyProfit: string | null;
  areaPyeong: number | null; floor: string | null;
  city: string; district: string;
  images: { url: string; thumbnailUrl: string | null }[];
  safetyGrade: string | null; isPremium: boolean; premiumRank: number;
  hasDiagnosisBadge: boolean;
  seller?: { isTrustedSeller?: boolean };
}
interface FranchiseCard {
  id: string; brandName: string; subcategory: string;
  monthlyAvgSales: string | null; startupCost: string | null;
  storeCount: number | null; isPromoting: boolean;
}
interface BoardPostCard {
  id: string; category: string; title: string;
  thumbnailUrl: string | null; createdAt: string;
}
interface BannerItem { id: string; title: string; imageUrl: string; linkUrl: string | null; }
interface RawListingResponse {
  id: string; title: string; businessCategory: string; storeType: string;
  price: string | number | bigint; monthlyRent: string | number | bigint | null;
  premiumFee: string | number | bigint | null;
  monthlyRevenue: string | number | bigint | null;
  monthlyProfit: string | number | bigint | null;
  areaPyeong: number | null; floor: string | null;
  city: string; district: string;
  images: { url: string; thumbnailUrl: string | null }[];
  safetyGrade: string | null; isPremium: boolean | null; premiumRank: number | null;
  hasDiagnosisBadge?: boolean;
}

/* ─── Constants ─── */
const REGION_TABS = ["서울", "경기", "그 외"];
const FRANCHISE_TABS = ["외식", "도소매", "서비스"];

const CATEGORY_ICONS = [
  { icon: Store, label: "점포 찾기", href: "/listings" },
  { icon: FileEdit, label: "점포 팔기", href: "/listings/new" },
  { icon: Building, label: "프랜차이즈", href: "/franchise" },
  { icon: Search, label: "점포찾기 의뢰", href: "/listings" },
  { icon: Paintbrush, label: "인테리어", href: "/bbs?category=인테리어" },
  { icon: Trash2, label: "철거 의뢰", href: "/bbs?category=철거" },
  { icon: Sparkles, label: "청소 의뢰", href: "/bbs?category=청소" },
  { icon: Signpost, label: "간판 의뢰", href: "/bbs?category=간판" },
];

const HERO_SLIDES = [
  { title: "안전한 점포거래,\n권리샵과 함께", sub: "검증된 매물만 거래하는 프리미엄 플랫폼", cta: "매물 보러가기", ctaHref: "/listings" },
  { title: "권리진단서로\n안전한 거래", sub: "권리금 적정성 분석부터 위험요소 체크까지", cta: "권리진단서 발급", ctaHref: "/reports/request" },
  { title: "내 매물, 프리미엄 광고로\n빠르게", sub: "상위 노출과 프리미엄 배지로 빠른 매도", cta: "서비스 요금 보기", ctaHref: "/pricing" },
];

const CATEGORY_EMOJI: Record<string, string> = {
  CAFE_BAKERY: "☕", CHICKEN: "🍗", KOREAN_FOOD: "🍚", PIZZA: "🍕",
  BUNSIK: "🍜", RETAIL: "🏪", BAR_PUB: "🍺", WESTERN_FOOD: "🍝",
  JAPANESE_FOOD: "🍣", CHINESE_FOOD: "🥟", SERVICE: "✂️",
  ENTERTAINMENT: "🎮", EDUCATION: "📚", DELIVERY: "🛵", ACCOMMODATION: "🏨",
};

const MARKET_BARS = [
  { area: "강남", value: 18000, max: 18000 },
  { area: "홍대", value: 14500, max: 18000 },
  { area: "신촌", value: 11000, max: 18000 },
  { area: "잠실", value: 12500, max: 18000 },
  { area: "건대", value: 10500, max: 18000 },
];

function toCard(l: RawListingResponse): ListingCard {
  return {
    ...l,
    price: String(l.price ?? "0"),
    monthlyRent: l.monthlyRent ? String(l.monthlyRent) : null,
    premiumFee: l.premiumFee ? String(l.premiumFee) : null,
    monthlyRevenue: l.monthlyRevenue ? String(l.monthlyRevenue) : null,
    monthlyProfit: l.monthlyProfit ? String(l.monthlyProfit) : null,
    isPremium: Boolean(l.isPremium),
    premiumRank: Number(l.premiumRank ?? 0),
    hasDiagnosisBadge: Boolean(l.hasDiagnosisBadge),
  };
}

/* ═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  /* state */
  const [regionTab, setRegionTab] = useState("서울");
  const [franchiseTab, setFranchiseTab] = useState("외식");
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [premiumListings, setPremiumListings] = useState<ListingCard[]>([]);
  const [franchises, setFranchises] = useState<FranchiseCard[]>([]);
  const [posts, setPosts] = useState<BoardPostCard[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerDir, setBannerDir] = useState<"left" | "right">("right");
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [loadingFranchises, setLoadingFranchises] = useState(true);
  const [showFloating, setShowFloating] = useState(false);
  const [footerOpen, setFooterOpen] = useState<string | null>(null);

  /* ─── fetch ─── */
  useEffect(() => {
    fetch("/api/admin/banners").then(r => r.json()).then(j => { if (j.data?.length) setBanners(j.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    const n = banners.length || HERO_SLIDES.length;
    if (n <= 1) return;
    const t = setInterval(() => { setBannerDir("right"); setBannerIdx(i => (i + 1) % n); }, 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  useEffect(() => {
    setLoadingPremium(true);
    fetch("/api/listings?premiumOnly=true&limit=4").then(r => r.json())
      .then(j => setPremiumListings((j.data ?? []).map((l: RawListingResponse) => toCard(l))))
      .catch(() => {}).finally(() => setLoadingPremium(false));
  }, []);

  useEffect(() => {
    fetch("/api/bbs?limit=4").then(r => r.json())
      .then(j => setPosts(j.data?.slice(0, 4) ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingListings(true);
    const q = regionTab === "그 외" ? "" : regionTab;
    fetch(`/api/listings?query=${encodeURIComponent(q)}&limit=4`).then(r => r.json())
      .then(j => setListings((j.data ?? []).map((l: RawListingResponse) => toCard(l))))
      .catch(() => {}).finally(() => setLoadingListings(false));
  }, [regionTab]);

  useEffect(() => {
    setLoadingFranchises(true);
    fetch(`/api/franchise?category=${encodeURIComponent(franchiseTab)}`).then(r => r.json())
      .then(j => setFranchises(j.data?.slice(0, 4) ?? []))
      .catch(() => {}).finally(() => setLoadingFranchises(false));
  }, [franchiseTab]);

  /* floating bar scroll listener */
  useEffect(() => {
    const onScroll = () => setShowFloating(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bannerCount = banners.length || HERO_SLIDES.length;
  const prevBanner = () => { setBannerDir("left"); setBannerIdx(i => (i - 1 + bannerCount) % bannerCount); };
  const nextBanner = () => { setBannerDir("right"); setBannerIdx(i => (i + 1) % bannerCount); };

  /* ─── listing card renderer ─── */
  const renderListingCard = (item: ListingCard, isMobileCarousel = false) => {
    const tierKey = item.premiumRank === 3 ? "VIP" : item.premiumRank === 2 ? "PREMIUM" : item.premiumRank === 1 ? "BASIC" : null;
    const tc = tierKey ? PREMIUM_AD_CONFIG[tierKey] : null;
    return (
      <Link
        key={item.id}
        href={`/listings/${item.id}`}
        className={`group overflow-hidden rounded-xl border bg-white transition-all active:scale-[0.98] md:hover:-translate-y-1 md:hover:shadow-lg ${isMobileCarousel ? "w-64 flex-none snap-start" : ""} ${tc ? `border-2 ${tc.border}` : "border-gray-200"}`}
      >
        {tc && <div className={`h-1 bg-gradient-to-r ${tc.gradient}`} />}
        <div className="relative aspect-[4/3] bg-gray-100">
          {item.images?.[0] ? (
            <Image src={item.images[0].thumbnailUrl ?? item.images[0].url} alt={item.title} fill className="object-cover md:transition-transform md:duration-300 md:group-hover:scale-105" sizes="(max-width:768px) 260px, 25vw" loading="lazy" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-white via-[#F1F5F9] to-[#E2E8F0]">
              <span className="text-5xl drop-shadow-sm">{CATEGORY_EMOJI[item.businessCategory] ?? "🏠"}</span>
              <span className="text-xs font-medium text-navy/40">{BUSINESS_CATEGORY_LABELS[item.businessCategory] ?? item.businessCategory}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
          <span className="absolute left-2 top-2 rounded bg-navy/80 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {BUSINESS_CATEGORY_LABELS[item.businessCategory] ?? item.businessCategory}
          </span>
          {item.safetyGrade && SAFETY_GRADE_CONFIG[item.safetyGrade] && (
            <span className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm border ${SAFETY_GRADE_CONFIG[item.safetyGrade].bg} ${SAFETY_GRADE_CONFIG[item.safetyGrade].color} ${SAFETY_GRADE_CONFIG[item.safetyGrade].border}`}>
              {SAFETY_GRADE_CONFIG[item.safetyGrade].label}
            </span>
          )}
          {tc && (
            <span className={`absolute bottom-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-bold border ${tc.bg} ${tc.color} ${tc.border}`}>{tc.badge}</span>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1">
            <h3 className="truncate text-[13px] font-bold text-navy">{item.title}</h3>
            {item.seller?.isTrustedSeller && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                <ShieldCheck className="h-2.5 w-2.5" />
                안심
              </span>
            )}
          </div>
          <div className="mt-1.5 space-y-0.5 text-xs">
            <div className="flex gap-2">
              <span className="w-14 shrink-0 text-gray-400">보증금</span>
              <span className="font-bold text-navy">{formatKRW(Number(item.price))}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-14 shrink-0 text-gray-400">권리금</span>
              <span className={`font-bold ${Number(item.premiumFee) > 0 ? "text-orange-600" : "text-navy"}`}>
                {item.premiumFee && Number(item.premiumFee) > 0 ? formatKRW(Number(item.premiumFee)) : "무권리"}
              </span>
            </div>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400">
            <MapPin className="h-3 w-3" /> {item.city} {item.district}
          </p>
        </div>
      </Link>
    );
  };

  /* ═══════ RENDER ═══════ */
  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-0">

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-40 border-b border-navy-dark bg-navy backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 md:py-3">
          <Link href="/" className="flex items-center gap-1.5">
            <Image src="/logos/krw_shop_logo_symbol_transparent.png" alt="권리샵" width={28} height={28} priority />
            <span className="font-heading text-base font-bold text-white md:text-lg">권리샵</span>
          </Link>
          <nav className="hidden items-center gap-5 md:flex">
            <Link href="/listings" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">점포 찾기</Link>
            <Link href="/listings/new" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">점포 팔기</Link>
            <Link href="/franchise" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">프랜차이즈</Link>
            <Link href="/experts" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">전문가</Link>
            <Link href="/simulator" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">시뮬레이터</Link>
            <Link href="/bbs" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">이용가이드</Link>
          </nav>
          <div className="flex items-center"><AuthNavItems /></div>
        </div>
      </header>

      {/* ═══ 1. Hero Banner ═══ */}
      <section className="relative overflow-hidden">
        <div className="relative h-[200px] md:h-[350px]">
          {banners.length > 0 ? banners.map((b, i) => (
            <div key={b.id} className="absolute inset-0 flex items-center justify-center transition-all duration-600 ease-in-out"
              style={{ opacity: i === bannerIdx ? 1 : 0, transform: i === bannerIdx ? "translateX(0)" : bannerDir === "right" ? "translateX(50px)" : "translateX(-50px)", pointerEvents: i === bannerIdx ? "auto" : "none" }}>
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-white via-[#F1F5F9] to-[#E2E8F0] px-6">
                {b.linkUrl ? <Link href={b.linkUrl}><h2 className="font-heading text-xl font-bold text-navy md:text-4xl">{b.title}</h2></Link>
                  : <h2 className="font-heading text-xl font-bold text-navy md:text-4xl">{b.title}</h2>}
              </div>
            </div>
          )) : HERO_SLIDES.map((s, i) => (
            <div key={i} className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-white via-[#F1F5F9] to-[#E2E8F0] transition-all duration-600 ease-in-out"
              style={{ opacity: i === bannerIdx ? 1 : 0, transform: i === bannerIdx ? "translateX(0)" : bannerDir === "right" ? "translateX(50px)" : "translateX(-50px)", pointerEvents: i === bannerIdx ? "auto" : "none" }}>
              <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #1B3A5C 0.5px, transparent 0)", backgroundSize: "32px 32px" }} />
              <div className="relative z-10 w-full px-5 text-center md:px-8">
                <h2 className="font-heading text-xl font-bold leading-tight text-navy whitespace-pre-line md:text-4xl lg:text-5xl">{s.title}</h2>
                <p className="mt-2 text-xs text-navy/60 md:mt-3 md:text-base">{s.sub}</p>
                <Link href={s.ctaHref}
                  className="mt-4 inline-flex min-h-[48px] w-full max-w-xs items-center justify-center gap-2 rounded-full bg-navy px-6 text-sm font-bold text-white shadow-lg transition-all active:scale-95 hover:bg-navy-dark md:mt-6 md:w-auto md:hover:scale-105">
                  {s.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        {bannerCount > 1 && (<>
          <button onClick={prevBanner} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-navy/10 p-2 text-navy backdrop-blur-sm md:left-4 md:p-2.5 hover:bg-navy/20" aria-label="이전"><ChevronLeft className="h-4 w-4 md:h-5 md:w-5" /></button>
          <button onClick={nextBanner} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-navy/10 p-2 text-navy backdrop-blur-sm md:right-4 md:p-2.5 hover:bg-navy/20" aria-label="다음"><ChevronRight className="h-4 w-4 md:h-5 md:w-5" /></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" role="tablist">
            {Array.from({ length: bannerCount }).map((_, i) => (
              <button key={i} onClick={() => setBannerIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === bannerIdx ? "w-6 bg-navy" : "w-2 bg-navy/30"}`}
                role="tab" aria-selected={i === bannerIdx} aria-label={`배너 ${i + 1}`} />
            ))}
          </div>
        </>)}
      </section>

      {/* ═══ 2. Stats Counter Bar ═══ */}
      <section className="bg-navy py-4 md:py-5">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 md:grid-cols-4 md:gap-0">
          {[
            { label: "등록 매물", value: 1234, suffix: "건", icon: Store },
            { label: "권리진단서 발급", value: 456, suffix: "건", icon: FileText },
            { label: "안전거래 완료", value: 789, suffix: "건", icon: ShieldCheck },
            { label: "전문가 상담", value: 234, suffix: "건", icon: Users },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 text-white md:justify-center md:gap-3">
              <s.icon className="h-4 w-4 shrink-0 text-accent-light md:h-5 md:w-5" />
              <div>
                <p className="text-[10px] text-white/60 md:text-xs">{s.label}</p>
                <p className="font-heading text-base font-bold md:text-xl">
                  <CountUp end={s.value} suffix={s.suffix} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 4. Category Icons ═══ */}
      <RevealOnScroll>
        <section className="bg-gray-50 py-5 md:py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-4 gap-2 md:grid-cols-8 md:gap-3">
              {CATEGORY_ICONS.map(c => (
                <Link key={c.label} href={c.href}
                  className="group flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 transition-all md:gap-2.5 md:py-4 md:hover:-translate-y-0.5 md:hover:border-navy md:hover:bg-navy md:hover:text-white md:hover:shadow-md active:bg-navy/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F0FE] transition-colors md:h-14 md:w-14 md:rounded-xl md:group-hover:bg-white/20">
                    <c.icon className="h-5 w-5 text-navy transition-colors md:h-7 md:w-7 md:group-hover:text-white" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight md:text-[11px]">{c.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 5. Premium Listings ═══ */}
      <section className="border-t border-gray-200 bg-gradient-to-b from-amber-50/50 to-gray-50 py-6 md:py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-yellow-500 md:h-5 md:w-5" />
              <h2 className="font-heading text-base font-bold text-navy md:text-xl">프리미엄 매물</h2>
            </div>
            <Link href="/listings" className="flex items-center text-xs text-gray-500 md:text-sm">전체보기 <ChevronRight className="h-3.5 w-3.5" /></Link>
          </div>
          {/* Mobile: horizontal scroll / Desktop: grid */}
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:mt-4 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible lg:grid-cols-4">
            {loadingPremium ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />) :
              premiumListings.length > 0 ? premiumListings.map(item => {
                const tk = item.premiumRank === 3 ? "VIP" : item.premiumRank === 2 ? "PREMIUM" : "BASIC";
                const tc = PREMIUM_AD_CONFIG[tk];
                const tierBg = tk === "VIP" ? "from-[#FEF3C7] to-[#FDE68A]" : tk === "PREMIUM" ? "from-[#DBEAFE] to-[#BFDBFE]" : "from-[#F3F4F6] to-[#E5E7EB]";
                return (
                  <Link key={item.id} href={`/listings/${item.id}`}
                    className={`group w-64 flex-none snap-start overflow-hidden rounded-xl border-2 bg-white transition-all active:scale-[0.98] md:w-auto md:flex-1 md:hover:-translate-y-1 md:hover:shadow-lg ${tc?.border ?? "border-gray-200"}`}>
                    <div className={`h-1 bg-gradient-to-r ${tc?.gradient ?? ""}`} />
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {item.images?.[0] ? <Image src={item.images[0].thumbnailUrl ?? item.images[0].url} alt={item.title} fill className="object-cover" sizes="(max-width:768px) 256px, 25vw" loading="lazy" />
                        : (
                          <div className={`flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${tierBg}`}>
                            <span className="text-5xl drop-shadow-sm">{CATEGORY_EMOJI[item.businessCategory] ?? "🏠"}</span>
                            <span className={`text-xs font-medium ${tk === "VIP" ? "text-amber-600" : tk === "PREMIUM" ? "text-blue-500" : "text-gray-500"}`}>{BUSINESS_CATEGORY_LABELS[item.businessCategory] ?? item.businessCategory}</span>
                          </div>
                        )}
                      <span className={`absolute left-2 bottom-2 rounded px-1.5 py-0.5 text-[10px] font-bold border ${tc?.bg} ${tc?.color} ${tc?.border}`}>{tc?.badge}</span>
                    </div>
                    <div className="p-3">
                      <h3 className="truncate text-[13px] font-bold text-navy">{item.title}</h3>
                      <div className="mt-1.5 space-y-0.5 text-xs">
                        <div className="flex gap-2"><span className="w-14 text-gray-400">보증금</span><span className="font-bold text-navy">{formatKRW(Number(item.price))}</span></div>
                        <div className="flex gap-2"><span className="w-14 text-gray-400">권리금</span><span className={`font-bold ${Number(item.premiumFee) > 0 ? "text-orange-600" : "text-navy"}`}>{item.premiumFee && Number(item.premiumFee) > 0 ? formatKRW(Number(item.premiumFee)) : "무권리"}</span></div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {item.hasDiagnosisBadge && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
                            권리진단 완료
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-400"><MapPin className="h-3 w-3" />{item.city} {item.district}</p>
                    </div>
                  </Link>
                );
              }) : <p className="col-span-4 py-8 text-center text-sm text-gray-400">프리미엄 매물이 없습니다</p>}
          </div>
        </div>
      </section>

      {/* ═══ 6. Report Promo ═══ */}
      <RevealOnScroll>
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#1e40af] to-[#3b82f6] py-10 md:py-16">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px,white 1px,transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="md:flex md:items-center md:gap-12">
              {/* text */}
              <div className="flex-1 text-center md:text-left">
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">권리진단서</span>
                <h2 className="mt-3 font-heading text-xl font-bold text-white md:text-3xl">내 가게 권리금,<br />적정한가요?</h2>
                <p className="mt-2 text-xs text-white/70 md:text-sm">권리진단서로 안전한 거래를 시작하세요</p>
              </div>
              {/* feature cards */}
              <div className="mt-6 space-y-3 md:mt-0 md:flex md:flex-1 md:gap-4 md:space-y-0">
                {[
                  { icon: BarChart3, title: "권리금 적정성 평가", desc: "주변 시세 대비 AI 분석" },
                  { icon: ShieldCheck, title: "위험요소 분석", desc: "임대차·건물·상권 점검" },
                  { icon: ClipboardList, title: "임대차 체크리스트", desc: "거래 전 필수 확인 항목" },
                ].map(c => (
                  <div key={c.title} className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm md:flex-1 md:flex-col md:items-start md:gap-0 md:p-5">
                    <c.icon className="h-6 w-6 shrink-0 text-white md:h-7 md:w-7" />
                    <div className="md:mt-3">
                      <h3 className="text-sm font-bold text-white">{c.title}</h3>
                      <p className="mt-0.5 text-xs text-white/60">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col items-center gap-3 md:flex-row md:justify-start">
              <Link href="/reports/request" className="flex min-h-[48px] w-full max-w-sm items-center justify-center gap-2 rounded-full bg-white text-sm font-bold text-[#1e40af] shadow-lg transition-all active:scale-95 md:w-auto md:px-10 md:hover:scale-105">
                권리진단서 발급받기 <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-white/50">권리진단서 BASIC 20,000원~ | PREMIUM 40,000원~</p>
            </div>
            <div className="mt-3 flex justify-center md:justify-start">
              <Link href="/reports/sample" className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white active:scale-95">
                <Eye className="h-3.5 w-3.5" /> 샘플 미리보기
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 7. Today's Recommended ═══ */}
      <RevealOnScroll>
        <section className="py-6 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-bold text-navy md:text-xl">오늘의 추천 매물</h2>
              <Link href="/listings" className="flex items-center text-xs text-gray-500 md:text-sm">전체보기 <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {REGION_TABS.map(t => (
                <button key={t} onClick={() => setRegionTab(t)}
                  className={`min-h-[36px] flex-none rounded-lg px-4 text-sm font-medium transition-all ${regionTab === t ? "bg-navy text-white" : "bg-gray-100 text-gray-600 active:bg-gray-200"}`}>
                  {t}
                </button>
              ))}
            </div>
            {/* Mobile: horizontal scroll / Desktop: 4-col grid */}
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
              {loadingListings ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) :
                listings.length === 0 ? (
                  <div className="flex w-full flex-col items-center py-12 text-center md:col-span-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F0FE]">
                      <Store className="h-10 w-10 text-navy/40" />
                    </div>
                    <p className="mt-4 text-base font-bold text-navy">아직 추천 매물이 없어요</p>
                    <p className="mt-1 text-sm text-gray-400">첫 번째 매물을 등록해보세요!</p>
                    <Link href="/listings/new" className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-navy px-6 text-sm font-medium text-white active:scale-95 hover:bg-navy-dark">
                      <FileEdit className="h-4 w-4" /> 매물 등록하기
                    </Link>
                  </div>
                ) : listings.map(item => renderListingCard(item, true))
              }
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 8. Simulator Promo ═══ */}
      <RevealOnScroll>
        <section className="bg-gradient-to-br from-[#e8eef5] to-[#f0f4f9] py-8 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="overflow-hidden rounded-2xl bg-white shadow-md md:flex">
              <div className="p-6 md:flex-1 md:p-10">
                <h2 className="font-heading text-lg font-bold text-navy md:text-2xl">창업 수익성을 미리 계산해보세요</h2>
                <p className="mt-2 text-xs text-gray-500 md:text-sm">업종별 예상 수익과 초기 투자비를 분석하세요.</p>
                <div className="mt-5 space-y-3 md:mt-6 md:space-y-4">
                  {[
                    { icon: BarChart3, label: "초기투자 분석", desc: "보증금, 권리금, 인테리어 등 총 창업비용" },
                    { icon: Receipt, label: "월 손익 시뮬레이션", desc: "매출 데이터 기반 월별 손익 추이" },
                    { icon: Target, label: "투자금 회수기간", desc: "투자 원금 회수 시점 예측" },
                  ].map(f => (
                    <div key={f.label} className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/10 md:h-10 md:w-10">
                        <f.icon className="h-4 w-4 text-navy md:h-5 md:w-5" />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-navy md:text-sm">{f.label}</h3>
                        <p className="text-[11px] text-gray-500 md:text-xs">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mobile: mini chart inline */}
                <div className="mt-5 flex items-end justify-center gap-2 md:hidden">
                  {[50, 70, 40, 60, 80].map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-7 rounded-t bg-gradient-to-t from-navy to-navy/50" style={{ height: `${h}px` }} />
                      <span className="text-[9px] text-gray-400">{["1월", "2월", "3월", "4월", "5월"][i]}</span>
                    </div>
                  ))}
                </div>
                <Link href="/simulator"
                  className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-accent font-medium text-white shadow-lg transition-all active:scale-[0.97] hover:bg-accent-dark md:mt-8 md:w-auto md:px-8">
                  시뮬레이터 시작하기 <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {/* Desktop: Simulator Preview */}
              <div className="hidden flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#E8F0FE] to-[#DBEAFE] p-10 lg:flex lg:w-[400px]">
                <div className="w-full rounded-xl bg-white p-5 shadow-sm">
                  <p className="text-xs font-medium text-gray-400">시뮬레이션 결과 미리보기</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-[#E8F0FE] p-3 text-center">
                      <p className="text-[10px] text-gray-500">총 투자금</p>
                      <p className="mt-1 text-lg font-bold text-navy">1.2억</p>
                    </div>
                    <div className="rounded-lg bg-[#FEF3C7] p-3 text-center">
                      <p className="text-[10px] text-gray-500">예상 월수익</p>
                      <p className="mt-1 text-lg font-bold text-accent-dark">850만</p>
                    </div>
                    <div className="rounded-lg bg-[#E8F0FE] p-3 text-center">
                      <p className="text-[10px] text-gray-500">회수기간</p>
                      <p className="mt-1 text-lg font-bold text-navy">14개월</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-1.5">
                    {[40, 55, 35, 65, 50, 75, 60].map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-gradient-to-t from-navy to-[#3B82F6]" style={{ height: `${h}px` }} />
                        <span className="text-[8px] text-gray-400">{["1월", "2월", "3월", "4월", "5월", "6월", "7월"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 9. Recommended Franchises ═══ */}
      <RevealOnScroll>
        <section className="border-t border-gray-200 bg-white py-6 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-bold text-navy md:text-xl">추천 프랜차이즈</h2>
              <Link href="/franchise" className="flex items-center text-xs text-gray-500 md:text-sm">전체보기 <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {FRANCHISE_TABS.map(t => (
                <button key={t} onClick={() => setFranchiseTab(t)}
                  className={`min-h-[36px] flex-none rounded-lg px-4 text-sm font-medium transition-all ${franchiseTab === t ? "bg-navy text-white" : "bg-gray-100 text-gray-600 active:bg-gray-200"}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-3 md:gap-4 md:overflow-visible lg:grid-cols-4">
              {loadingFranchises ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-56 flex-none snap-start rounded-xl border border-gray-200 bg-white p-4 md:w-auto md:flex-1">
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                </div>
              )) : franchises.length === 0 ? (
                <p className="col-span-4 py-8 text-center text-sm text-gray-400">프랜차이즈 정보가 없습니다</p>
              ) : franchises.map(b => (
                <div key={b.id} className="w-56 flex-none snap-start rounded-xl border border-gray-200 border-l-4 border-l-navy bg-white p-4 transition-all active:scale-[0.98] md:w-auto md:flex-1 md:p-5 md:hover:-translate-y-0.5 md:hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-navy">{b.subcategory}</span>
                      <h3 className="mt-0.5 text-sm font-bold text-navy md:text-base">{b.brandName}</h3>
                    </div>
                    {b.isPromoting && <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-600">프로모션</span>}
                  </div>
                  <div className="mt-2 space-y-1">
                    {b.monthlyAvgSales && <div className="flex items-center gap-1.5 text-xs"><TrendingUp className="h-3 w-3 text-purple" /><span className="text-gray-500">월매출</span><span className="ml-auto font-bold text-purple">{formatKRW(Number(b.monthlyAvgSales))}</span></div>}
                    {b.startupCost && <div className="flex items-center gap-1.5 text-xs"><DollarSign className="h-3 w-3 text-navy-light" /><span className="text-gray-500">창업비</span><span className="ml-auto font-bold text-navy">{formatKRW(Number(b.startupCost))}</span></div>}
                    {b.storeCount != null && <div className="flex items-center gap-1.5 text-xs"><Store className="h-3 w-3 text-gray-400" /><span className="text-gray-500">가맹점</span><span className="ml-auto font-bold text-navy">{b.storeCount.toLocaleString()}개</span></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 10. Expert Consultation ═══ */}
      <RevealOnScroll>
        <section className="py-6 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center font-heading text-lg font-bold text-navy md:text-2xl">전문 분야별 전문가와 직접 상담하세요</h2>
            <p className="mt-1.5 text-center text-xs text-gray-500 md:mt-2 md:text-sm">법률, 인테리어, 철거, 세무 전문가가 도와드립니다</p>
            <div className="mt-5 space-y-3 md:mt-8 md:grid md:grid-cols-3 md:gap-5 md:space-y-0">
              {[
                { icon: Scale, title: "법률 / 세무 전문가", desc: "계약서 검토, 세무 신고, 사업자 등록 등", color: "text-navy", bg: "bg-[#E8F0FE]" },
                { icon: Paintbrush, title: "인테리어 전문가", desc: "업종 맞춤 인테리어 설계부터 시공까지", color: "text-navy", bg: "bg-[#E8F0FE]" },
                { icon: Hammer, title: "철거 / 부동산 전문가", desc: "원상복구, 철거 견적, 상권 분석까지", color: "text-navy", bg: "bg-[#E8F0FE]" },
              ].map(c => (
                <div key={c.title} className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all active:scale-[0.98] md:flex-col md:items-start md:gap-0 md:p-6 md:hover:-translate-y-1 md:hover:shadow-lg">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${c.bg} md:h-12 md:w-12`}>
                    <c.icon className={`h-5 w-5 ${c.color} md:h-6 md:w-6`} />
                  </div>
                  <div className="md:mt-4">
                    <h3 className="text-sm font-bold text-navy md:text-lg">{c.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-500 md:mt-2 md:text-sm">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 text-center md:mt-8">
              <Link href="/experts" className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-navy px-8 font-medium text-white shadow-lg transition-all active:scale-[0.97] md:hover:bg-navy-dark">
                전문가 찾기 <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 11. Market Price Widget ═══ */}
      <RevealOnScroll>
        <section className="border-t border-gray-200 bg-white py-6 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 md:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-base font-bold text-navy md:text-xl">우리 동네 권리금 시세는?</h2>
                  <p className="mt-0.5 text-[11px] text-gray-500 md:text-sm">인기 지역 평균 권리금 (만원)</p>
                </div>
                <Link href="/market-price" className="flex shrink-0 items-center gap-1 text-xs font-medium text-navy md:text-sm">시세 보기 <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
              <div className="mt-6 flex items-end gap-3 md:gap-5">
                {MARKET_BARS.map(b => (
                  <div key={b.area} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-navy md:text-xs">{b.value.toLocaleString()}</span>
                    <div className="relative w-full overflow-hidden rounded-t-md bg-gray-100" style={{ height: "90px" }}>
                      <div className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-[#1B3A5C] to-[#3B82F6] transition-all duration-700" style={{ height: `${(b.value / b.max) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 md:text-xs">{b.area}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[10px] text-gray-400 md:text-xs">시세 비교 위젯에서 전체 지역의 상세 시세를 확인할 수 있습니다</p>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 12. Startup Info (Card Carousel) ═══ */}
      <RevealOnScroll>
        <section className="py-6 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-bold text-navy md:text-xl">창업정보</h2>
              <Link href="/bbs" className="flex items-center text-xs text-gray-500 md:text-sm">전체보기 <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
              {posts.length === 0 ? <p className="col-span-4 py-8 text-center text-sm text-gray-400">게시글이 없습니다</p>
                : posts.map(p => {
                  const catStyle = p.category === "이용가이드" ? { bg: "from-[#DBEAFE] to-[#BFDBFE]", icon: "text-blue-500", badge: "bg-blue-100 text-blue-700" }
                    : p.category === "알림공지" ? { bg: "from-[#FEF3C7] to-[#FDE68A]", icon: "text-amber-500", badge: "bg-amber-100 text-amber-700" }
                    : p.category === "창업정보" ? { bg: "from-[#DCFCE7] to-[#BBF7D0]", icon: "text-green-600", badge: "bg-green-100 text-green-700" }
                    : p.category === "이벤트" ? { bg: "from-[#EDE9FE] to-[#DDD6FE]", icon: "text-purple-600", badge: "bg-purple-100 text-purple-700" }
                    : { bg: "from-[#E8F0FE] to-[#DBEAFE]", icon: "text-navy", badge: "bg-navy/10 text-navy" };
                  return (
                    <Link key={p.id} href={`/bbs/${p.id}`}
                      className="group w-56 flex-none snap-start overflow-hidden rounded-xl border border-gray-200 bg-white transition-all active:scale-[0.98] md:w-auto md:flex-1 md:hover:-translate-y-1 md:hover:shadow-lg">
                      <div className={`relative h-28 bg-gradient-to-br ${catStyle.bg} md:h-36`}>
                        {p.thumbnailUrl ? <Image src={p.thumbnailUrl} alt={p.title} fill className="object-cover" sizes="(max-width:768px) 224px, 25vw" loading="lazy" />
                          : <div className="flex h-full items-center justify-center"><FileText className={`h-8 w-8 ${catStyle.icon}`} /></div>}
                      </div>
                      <div className="p-3 md:p-4">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${catStyle.badge}`}>{p.category}</span>
                        <h3 className="mt-1.5 line-clamp-2 text-[13px] font-bold text-navy transition-colors md:group-hover:text-navy-light">{p.title}</h3>
                        <p className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400"><Calendar className="h-3 w-3" />{new Date(p.createdAt).toLocaleDateString("ko-KR")}</p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 13. 서비스 요금 안내 ═══ */}
      <RevealOnScroll>
        <section className="border-t border-gray-200 bg-gray-50 py-6 md:py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center font-heading text-lg font-bold text-navy md:text-2xl">서비스 요금 안내</h2>
            <p className="mt-2 text-center text-xs text-gray-500 md:text-sm">매수자는 모든 매물 정보를 무료로 열람할 수 있습니다</p>

            {/* 매도자 광고 */}
            <div className="mx-auto mt-6 max-w-4xl md:mt-10">
              <h3 className="text-sm font-bold text-navy md:text-base">매도자 광고</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">프리미엄</span>
                    <span className="text-base font-bold text-navy md:text-lg">&#8361;200,000<span className="text-xs font-normal text-gray-400">/30일</span></span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-600 md:text-sm">
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />매물 목록 상위 노출</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />프리미엄 배지 표시</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />기본 조회수 통계</li>
                  </ul>
                  <p className="mt-2 text-[10px] text-gray-400">(부가세 별도)</p>
                </div>
                <div className="relative rounded-xl border-2 border-amber-300 bg-white p-4 md:p-5">
                  <span className="absolute -top-2.5 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white">추천</span>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">VIP</span>
                    <span className="text-base font-bold text-navy md:text-lg">&#8361;300,000<span className="text-xs font-normal text-gray-400">/30일</span></span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-600 md:text-sm">
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500" />홈페이지 캐러셀 노출</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500" />VIP 배지 + 골드 테두리</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500" />권리진단서 BASIC 1회 무료</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500" />안심거래 배지 부여</li>
                  </ul>
                  <p className="mt-2 text-[10px] text-gray-400">(부가세 별도)</p>
                </div>
              </div>
            </div>

            {/* 권리진단서 */}
            <div className="mx-auto mt-6 max-w-4xl md:mt-8">
              <h3 className="text-sm font-bold text-navy md:text-base">권리진단서</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">BASIC</span>
                    <span className="text-base font-bold text-navy md:text-lg">&#8361;20,000<span className="text-xs font-normal text-gray-400">/건</span></span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-600 md:text-sm">
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />권리금 적정성 평가</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />지역/업종 평균 비교</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />종합 위험 등급 판정</li>
                  </ul>
                  <p className="mt-2 text-[10px] text-gray-400">(부가세 별도)</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">PREMIUM</span>
                    <span className="text-base font-bold text-navy md:text-lg">&#8361;40,000<span className="text-xs font-normal text-gray-400">/건</span></span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-xs text-gray-600 md:text-sm">
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />BASIC 전체 항목 포함</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />임대차 체크리스트 20항목</li>
                    <li className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-blue-500" />PDF 리포트 다운로드</li>
                  </ul>
                  <p className="mt-2 text-[10px] text-gray-400">(부가세 별도)</p>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center md:mt-8">
              <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-medium text-navy hover:underline md:text-sm">자세히 보기 <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 14. Register CTA ═══ */}
      <section className="relative overflow-hidden bg-navy py-10 md:py-16">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px,white 1px,transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-lg font-bold text-white md:text-3xl">내 점포, 지금 등록하세요</h2>
          <p className="mt-2 text-xs text-gray-300 md:text-base">무료로 점포를 등록하고 빠르게 양도·양수하세요.</p>
          <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-row md:justify-center md:gap-4">
            <Link href="/listings/new" className="flex min-h-[48px] items-center justify-center rounded-lg bg-accent px-8 font-medium text-white shadow-lg transition-all active:scale-[0.97] hover:bg-accent-dark">
              점포 등록하기
            </Link>
            <Link href="/register" className="flex min-h-[48px] items-center justify-center rounded-lg border border-white/30 px-8 font-medium text-white transition-all active:scale-[0.97] md:hover:bg-white/10">
              무료 가입
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 15. Mobile Floating CTA ═══ */}
      <div
        className={`fixed bottom-14 left-0 right-0 z-40 px-4 transition-all duration-300 md:hidden ${showFloating ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex gap-2 rounded-xl bg-white/95 p-2 shadow-xl backdrop-blur-md border border-gray-200">
          <Link href="/listings/new" className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-bold text-white active:scale-95 hover:bg-accent-dark">
            <FileEdit className="h-4 w-4" /> 매물 등록
          </Link>
          <Link href="/experts" className="flex flex-1 min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-navy text-sm font-bold text-white active:scale-95">
            <MessageCircle className="h-4 w-4" /> 무료 상담
          </Link>
        </div>
      </div>

      {/* ═══ 16. Footer ═══ */}
      <footer className="border-t border-gray-200 bg-white py-6 md:py-10">
        <div className="mx-auto max-w-7xl px-4">
          {/* Mobile: accordion / Desktop: inline */}
          <div className="flex items-center gap-2">
            <Image src="/logos/krw_shop_logo_symbol_transparent.png" alt="권리샵" width={24} height={24} />
            <span className="font-heading text-sm font-bold text-navy">권리샵</span>
          </div>

          {/* Mobile accordion links */}
          <div className="mt-4 space-y-0 md:hidden">
            {[
              { title: "서비스", links: [{ label: "점포 찾기", href: "/listings" }, { label: "점포 팔기", href: "/listings/new" }, { label: "프랜차이즈", href: "/franchise" }, { label: "시뮬레이터", href: "/simulator" }] },
              { title: "고객지원", links: [{ label: "이용가이드", href: "/bbs" }, { label: "전문가 상담", href: "/experts" }, { label: "서비스 요금", href: "/pricing" }] },
              { title: "법적고지", links: [{ label: "이용약관", href: "/legal/terms" }, { label: "개인정보처리방침", href: "/legal/privacy" }, { label: "면책조항", href: "/legal/disclaimer" }] },
            ].map(group => (
              <div key={group.title} className="border-b border-gray-100">
                <button onClick={() => setFooterOpen(footerOpen === group.title ? null : group.title)}
                  className="flex min-h-[44px] w-full items-center justify-between py-3 text-sm font-medium text-gray-700">
                  {group.title}
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${footerOpen === group.title ? "rotate-180" : ""}`} />
                </button>
                {footerOpen === group.title && (
                  <div className="space-y-2 pb-3 pl-2">
                    {group.links.map(l => <Link key={l.href} href={l.href} className="block text-sm text-gray-500">{l.label}</Link>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop footer */}
          <div className="mt-4 hidden items-center justify-between md:flex">
            <nav className="flex gap-5 text-sm text-gray-500">
              <Link href="/legal/terms" className="hover:text-navy">이용약관</Link>
              <Link href="/legal/privacy" className="hover:text-navy">개인정보처리방침</Link>
              <Link href="/legal/disclaimer" className="hover:text-navy">면책조항</Link>
              <Link href="/pricing" className="hover:text-navy">서비스 요금</Link>
            </nav>
            <p className="text-xs text-gray-500">&copy; 2026 권리샵. All rights reserved.</p>
          </div>

          <p className="mt-4 text-center text-[10px] text-gray-400 md:text-xs">
            본 서비스에서 제공하는 정보는 참고용이며, 플랫폼은 매물의 정확성을 보증하지 않습니다.
          </p>
          <p className="mt-1 text-center text-[10px] text-gray-400 md:hidden">&copy; 2026 권리샵</p>
        </div>
      </footer>

      {/* ═══ Mobile Bottom Tab Bar ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {[
          { href: "/", icon: Home, label: "홈", active: true },
          { href: "/listings", icon: Search, label: "매물", active: false },
          { href: "/simulator", icon: Calculator, label: "시뮬레이터", active: false },
          { href: "/experts", icon: Users, label: "전문가", active: false },
          { href: "/dashboard", icon: User, label: "마이", active: false },
        ].map(t => (
          <Link key={t.href} href={t.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${t.active ? "text-navy" : "text-gray-500"}`}
            {...(t.active ? { "aria-current": "page" as const } : {})}>
            <t.icon className="h-5 w-5" />
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
