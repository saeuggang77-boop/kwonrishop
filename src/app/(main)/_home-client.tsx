"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, type FormEvent, type CSSProperties } from "react";
import {
  Search, FileText, Building2,
  ChevronRight, ChevronLeft,
  ShieldCheck, Calculator, BarChart3,
  Sparkles, Clock,
} from "lucide-react";
import { RevealOnScroll } from "@/components/ui/reveal-on-scroll";
import { ListingCard, type ListingCardData } from "@/components/listings/listing-card";
import { REGION_DATA } from "@/lib/utils/constants";
import { RecentListingsSection } from "@/components/home/recent-listings-section";
import HomeBelowFold from "./_home-below-fold";

/* ─── Constants ─── */
const QUICK_MENU = [
  { icon: Search, label: "점포 찾기", href: "/listings" },
  { icon: FileText, label: "점포 팔기", href: "/sell" },
  { icon: Building2, label: "프랜차이즈", href: "/franchise" },
  { icon: ShieldCheck, label: "권리진단서", href: "/reports/request" },
  { icon: Calculator, label: "시뮬레이터", href: "/simulator" },
  { icon: BarChart3, label: "상권분석", href: "/area-analysis" },
];

/* ─── Hero Slides (CSS-only backgrounds) ─── */
interface HeroSlide {
  title: string;
  sub: string;
  gradient: string;
  patternStyle: CSSProperties;
  image: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    title: "상가 권리금,\n비싸게 사고 있진 않나요?",
    sub: "AI가 분석한 적정 권리금으로 안전한 거래를 시작하세요",
    image: "/images/hero/slide-1.jpg",
    gradient: "linear-gradient(135deg, #1B3A5C 0%, #234B73 40%, #2D6A9F 70%, #3B82B0 100%)",
    patternStyle: {
      backgroundImage: [
        "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
        "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "radial-gradient(ellipse at 20% 80%, rgba(245,158,11,0.15) 0%, transparent 50%)",
        "radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.12) 0%, transparent 50%)",
      ].join(","),
      backgroundSize: "40px 40px, 40px 40px, 100% 100%, 100% 100%",
    },
  },
  {
    title: "권리금 진단서 무료 발급",
    sub: "주변 시세 대비 권리금 적정성을 AI가 판단해드립니다",
    image: "/images/hero/slide-2.jpg",
    gradient: "linear-gradient(135deg, #78350F 0%, #92400E 25%, #B45309 55%, #D97706 100%)",
    patternStyle: {
      backgroundImage: [
        "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 20px)",
        "repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 20px)",
        "radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.08) 0%, transparent 70%)",
      ].join(","),
      backgroundSize: "28px 28px, 28px 28px, 100% 100%",
    },
  },
  {
    title: "점포 매물 등록은 무료!",
    sub: "사진만 올리면 전국 매수자에게 노출됩니다",
    image: "/images/hero/slide-3.jpg",
    gradient: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 35%, #1E40AF 75%, #2563EB 100%)",
    patternStyle: {
      backgroundImage: [
        "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.06) 1px, transparent 0)",
        "radial-gradient(ellipse at 30% 70%, rgba(59,130,246,0.12) 0%, transparent 40%)",
        "radial-gradient(ellipse at 70% 30%, rgba(96,165,250,0.08) 0%, transparent 50%)",
      ].join(","),
      backgroundSize: "24px 24px, 100% 100%, 100% 100%",
    },
  },
];

/* ─── Helper function for city categorization ─── */
function cityShort(city: string): string {
  if (city.startsWith("서울")) return "서울";
  if (city.startsWith("경기")) return "경기";
  return "기타";
}

/* ─── Props ─── */
export interface HomeClientProps {
  premiumListings: ListingCardData[];
  recommendedListings: ListingCardData[];
}

/* ═══════════════════════════════════════════════════════════ */
export default function HomeClient({
  premiumListings,
  recommendedListings,
}: HomeClientProps) {
  const router = useRouter();

  /* state */
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerDir, setBannerDir] = useState<"left" | "right">("right");
  const [searchQuery, setSearchQuery] = useState("");
  const [recTab, setRecTab] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [popularKeywords, setPopularKeywords] = useState<string[]>([]);

  /* ─── Popular keywords ─── */
  useEffect(() => {
    fetch("/api/popular-searches")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.keywords) setPopularKeywords(d.keywords); })
      .catch(() => {});
  }, []);

  /* ─── Hero auto-play ─── */
  useEffect(() => {
    const n = HERO_SLIDES.length;
    if (n <= 1) return;
    const t = setInterval(() => { setBannerDir("right"); setBannerIdx(i => (i + 1) % n); }, 5000);
    return () => clearInterval(t);
  }, []);

  const bannerCount = HERO_SLIDES.length;
  const prevBanner = () => { setBannerDir("left"); setBannerIdx(i => (i - 1 + bannerCount) % bannerCount); };
  const nextBanner = () => { setBannerDir("right"); setBannerIdx(i => (i + 1) % bannerCount); };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/listings?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleRegionSearch = () => {
    const params = new URLSearchParams();
    if (selectedCity) params.append("city", selectedCity);
    if (selectedDistrict) params.append("district", selectedDistrict);
    router.push(`/listings?${params.toString()}`);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict("");
  };

  const slides = HERO_SLIDES;

  /* ═══════ RENDER ═══════ */
  return (
    <div className="bg-surface-1">

      {/* ═══ 1. Hero Banner + Search Bar ═══ */}
      <section className="relative overflow-hidden">
        <div className="relative h-[320px] md:h-[440px]">
          {slides.map((s, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: i === bannerIdx ? 1 : 0,
                transform: i === bannerIdx ? "translateX(0)" : bannerDir === "right" ? "translateX(50px)" : "translateX(-50px)",
                transition: "all 600ms ease-in-out",
                pointerEvents: i === bannerIdx ? "auto" : "none",
              }}
            >
              {/* Background layer */}
              <div className="absolute inset-0" style={{ background: s.gradient }} />
              <Image src={s.image} alt="" fill className="object-cover opacity-25" sizes="100vw" priority={i === 0} loading={i === 0 ? "eager" : "lazy"} />
              <div className="absolute inset-0" style={s.patternStyle} />
              {/* Decorative elements per slide */}
              {i === 0 && (
                <>
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-400/5 blur-3xl" />
                  <div className="absolute -left-10 bottom-10 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-amber-500/5 to-transparent" />
                </>
              )}
              {i === 1 && (
                <>
                  <div className="absolute -right-10 top-1/4 h-56 w-56 rounded-full bg-yellow-300/8 blur-3xl" />
                  <div className="absolute left-1/4 -top-10 h-40 w-40 rounded-full bg-amber-200/10 blur-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-900/20 to-transparent" />
                </>
              )}
              {i === 2 && (
                <>
                  <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full border border-blue-400/10" />
                  <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 h-60 w-60 rounded-full border border-blue-300/5" />
                  <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-blue-500/8 blur-3xl" />
                </>
              )}

              {/* Text content */}
              <div className="relative z-10 w-full px-5 text-center md:px-8">
                <h2 className="font-heading text-2xl font-bold leading-tight whitespace-pre-line text-white drop-shadow-sm md:text-5xl lg:text-6xl">
                  {s.title}
                </h2>
                <p className="mt-2 text-base text-white/80 md:mt-3 md:text-xl">
                  {s.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Search bar + Region dropdown */}
        <div className="absolute bottom-3 left-0 right-0 z-20 px-4 md:bottom-8">
          {/* Text search bar */}
          <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl overflow-hidden rounded-full border border-gray-200 bg-white shadow-2xl">
            <div className="flex flex-1 items-center gap-3 px-5">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="지역, 업종으로 매물 검색 (예: 강남역 카페)"
                className="h-14 w-full bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none md:h-16 md:text-lg"
              />
            </div>
            <button type="submit" className="m-2 rounded-full bg-accent px-8 text-sm font-bold text-white transition-colors hover:bg-accent-dark active:scale-95">
              검색
            </button>
          </form>

          {/* Region dropdown row */}
          <div className="mx-auto mt-3 flex max-w-2xl items-center gap-2 rounded-2xl bg-white p-3 shadow-xl md:gap-3">
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="h-11 flex-1 rounded-lg border-0 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy md:h-12"
            >
              <option value="">시/도 선택</option>
              {Object.keys(REGION_DATA).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedCity}
              className="h-11 flex-1 rounded-lg border-0 bg-white px-3 text-sm text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy md:h-12"
            >
              <option value="">구/군 선택</option>
              {selectedCity && REGION_DATA[selectedCity]?.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>

            <button
              onClick={handleRegionSearch}
              disabled={!selectedCity}
              className="h-11 rounded-lg bg-accent px-5 text-sm font-bold text-white transition-colors hover:bg-accent-dark disabled:bg-gray-300 disabled:text-gray-500 active:scale-95 md:h-12 md:px-6"
            >
              매물검색
            </button>
          </div>
        </div>

        {/* Banner nav */}
        {bannerCount > 1 && (<>
          <button onClick={prevBanner} className="absolute left-2 top-[35%] -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:left-4 md:p-2.5" aria-label="이전">
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <button onClick={nextBanner} className="absolute right-2 top-[35%] -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 md:right-4 md:p-2.5" aria-label="다음">
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <div className="absolute bottom-32 left-1/2 flex -translate-x-1/2 gap-1.5 md:bottom-36" role="tablist">
            {Array.from({ length: bannerCount }).map((_, i) => (
              <button key={i} onClick={() => setBannerIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === bannerIdx ? "w-6 bg-white" : "w-2 bg-white/30"}`}
                role="tab" aria-selected={i === bannerIdx} aria-label={`배너 ${i + 1}`} />
            ))}
          </div>
        </>)}
      </section>

      {/* Popular keywords */}
      {popularKeywords.length > 0 && (
        <div className="bg-surface-2 py-3">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-2 px-5">
            <span className="text-accent font-semibold text-xs">인기</span>
            {popularKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => router.push(`/listings?search=${encodeURIComponent(kw)}`)}
                className="rounded-full bg-navy/5 border border-navy/10 px-3 py-1 text-xs text-navy transition-colors hover:bg-navy/10"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 2. Quick Menu (6 items) ═══ */}
      <RevealOnScroll>
        <section className="bg-white py-8 md:py-10">
          <div className="mx-auto max-w-4xl px-4">
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
              {QUICK_MENU.map(c => (
                <Link key={c.label} href={c.href}
                  className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-navy/20 active:bg-gray-50">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy-50 transition-all duration-200 md:h-16 md:w-16 md:group-hover:bg-navy">
                      <c.icon className="h-7 w-7 text-navy transition-colors md:h-8 md:w-8 md:group-hover:text-white" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight text-gray-700 md:text-xs">{c.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 2.5. Recent Listings ═══ */}
      <RecentListingsSection />

      {/* ═══ 3. Premium Listings ═══ */}
      <RevealOnScroll>
        <section className="border-t border-gray-200 bg-white py-12 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500 md:h-6 md:w-6" />
                <h2 className="font-heading text-lg font-bold text-navy md:text-2xl">프리미엄 매물</h2>
              </div>
              <Link href="/listings" className="flex items-center text-xs text-gray-500 transition-colors hover:text-navy md:text-sm">전체보기 <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-5 md:gap-4 md:overflow-visible">
              {premiumListings.length > 0 ? premiumListings.map((item, idx) => (
                <ListingCard key={item.id} listing={item} variant="premium" isCarouselItem priority={idx < 3} />
              )) : <p className="col-span-5 py-8 text-center text-sm text-gray-400">프리미엄 매물이 없습니다</p>}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 4. Today's Recommended ═══ */}
      <RevealOnScroll>
        <section className="bg-surface-1 py-12 md:py-20">
          <div className="mx-auto max-w-[1200px] px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-navy md:text-2xl">오늘의 추천 매물</h2>
              <Link href="/listings" className="flex items-center text-xs text-gray-500 transition-colors hover:text-navy md:text-sm">전체보기 <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>

            {/* Tab buttons */}
            <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
              {["all", "서울", "경기", "기타"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRecTab(tab)}
                  className={`flex-none rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                    recTab === tab
                      ? "bg-navy text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-navy/30"
                  }`}
                >
                  {tab === "all" ? "전체" : tab}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
              {(() => {
                const filtered = recTab === "all"
                  ? recommendedListings
                  : recommendedListings.filter(l => {
                      const short = cityShort(l.city);
                      return short === recTab;
                    });
                return filtered.length === 0 ? (
                  <p className="col-span-6 py-6 text-center text-sm text-gray-400">해당 지역 매물이 없습니다</p>
                ) : filtered.map(item => (
                  <ListingCard key={item.id} listing={item} variant="recommend" />
                ));
              })()}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ═══ 5. Trust Indicators ═══ */}
      <RevealOnScroll>
        <section className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
              {[
                { value: "1,200+", label: "등록 매물", icon: Building2 },
                { value: "5,000+", label: "AI 진단 완료", icon: ShieldCheck },
                { value: "98%", label: "거래 만족도", icon: "⭐" },
                { value: "24시간", label: "매물 노출", icon: Clock },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy md:h-14 md:w-14">
                    {typeof stat.icon === "string" ? <span className="text-xl">{stat.icon}</span> : <stat.icon className="h-6 w-6" />}
                  </div>
                  <p className="mt-3 font-heading text-2xl font-bold text-navy md:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealOnScroll>

      <HomeBelowFold />
    </div>
  );
}
