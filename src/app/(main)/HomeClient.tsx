"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import NoticeBanner from "@/components/NoticeBanner";
import ListingCard from "@/components/listing/ListingCard";
import Image from "next/image";
import { HomeServiceSection } from "@/components/promotion/PromotionCTA";

interface Listing {
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
}

interface FranchiseBrand {
  id: string;
  brandName: string;
  industry: string | null;
  totalStores: number | null;
  logo: string | null;
  tier: string;
  description: string | null;
  avgRevenue: number | null;
  franchiseFee: number | null;
}

interface PartnerService {
  id: string;
  companyName: string;
  serviceType: string;
  serviceArea: string[];
  tier: string;
  images: { url: string }[];
  description: string | null;
}

interface Equipment {
  id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  category: string;
  condition: string;
  tier: string;
  images: { url: string }[];
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  INTERIOR: "인테리어",
  SIGNAGE: "간판",
  ACCOUNTING: "세무/회계",
  LEGAL: "법무/법률",
  MARKETING: "마케팅",
  IT: "IT/시스템",
  HR: "인사/노무",
  DESIGN: "디자인",
  CONSULTING: "컨설팅",
  FINANCE: "금융/보험",
  LOGISTICS: "물류/배송",
  CLEANING: "청소/방역",
  SECURITY: "보안/경비",
  EQUIPMENT: "주방/설비",
  POS_SYSTEM: "POS/키오스크",
  DELIVERY: "배달/포장",
  OTHER: "기타",
};

const CATEGORY_ITEMS = [
  {
    name: "외식업",
    link: `/listings?keyword=${encodeURIComponent("외식업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 9h18M9 21V9m6 12V9M4 9l2-4h12l2 4M12 3v2" />
      </svg>
    ),
  },
  {
    name: "서비스업",
    link: `/listings?keyword=${encodeURIComponent("서비스업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33" />
      </svg>
    ),
  },
  {
    name: "도/소매업",
    link: `/listings?keyword=${encodeURIComponent("도/소매업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    name: "예술/스포츠",
    link: `/listings?keyword=${encodeURIComponent("예술/스포츠/시설업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    name: "교육/학원",
    link: `/listings?keyword=${encodeURIComponent("교육/학원업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    name: "숙박업",
    link: `/listings?keyword=${encodeURIComponent("숙박업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 0a3 3 0 016 0v1m0-1a3 3 0 016 0v1M3 7l9-4 9 4" />
      </svg>
    ),
  },
  {
    name: "협력업체",
    link: "/partners",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    name: "기타",
    link: `/listings?keyword=${encodeURIComponent("기타")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
  },
];

interface HomeClientProps {
  initialListings: Listing[];
  initialFranchiseBrands: FranchiseBrand[];
  initialPartnerServices: PartnerService[];
  initialEquipment: Equipment[];
}

export default function HomeClient({
  initialListings,
  initialFranchiseBrands,
  initialPartnerServices,
  initialEquipment,
}: HomeClientProps) {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<"partners" | "equipment">("partners");
  const franchiseScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const latestListings = initialListings;
  const franchiseBrands = initialFranchiseBrands;
  const partnerServices = initialPartnerServices;
  const equipment = initialEquipment;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/listings?keyword=${encodeURIComponent(searchKeyword)}`);
    }
  };

  const handleFranchiseScroll = () => {
    if (!franchiseScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = franchiseScrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollFranchise = (direction: "left" | "right") => {
    if (!franchiseScrollRef.current) return;
    const scrollAmount = 300;
    franchiseScrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const vipListings = latestListings.filter((l) => l.featuredTier === "VIP");
  const premBasicListings = latestListings.filter(
    (l) => l.featuredTier === "PREMIUM" || l.featuredTier === "BASIC"
  );
  const allBrands = franchiseBrands;
  const vipPartners = partnerServices.filter((p) => p.tier === "VIP");
  const otherPartners = partnerServices.filter((p) => p.tier === "PREMIUM" || p.tier === "BASIC");
  const vipEquipment = equipment.filter((e) => e.tier === "VIP");
  const premiumEquipment = equipment.filter((e) => e.tier === "PREMIUM");

  return (
    <>
      <NoticeBanner />

      {/* ===== 섹션 1: 히어로 + 가치 제안 통합 ===== */}
      <section className="relative overflow-hidden bg-green-700">
        {/* 배경 장식 — 크림 원 하나가 살짝 비침 */}
        <div aria-hidden className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-terra-500/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 -left-20 w-[500px] h-[500px] rounded-full bg-cream/5 blur-3xl" />

        {/* 메인 히어로 */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20 pb-12 md:pt-28 md:pb-16">
          {/* 키커 */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-terra-300 tracking-[0.2em] uppercase mb-5">
            <span className="w-6 h-px bg-terra-300" />
            상가 직거래 플랫폼
            <span className="w-6 h-px bg-terra-300" />
          </div>

          {/* 메인 카피 — 세리프 이탤릭 강세 */}
          <h1 className="font-extrabold text-cream leading-[1.05] tracking-tight mb-6 text-4xl md:text-6xl lg:text-7xl">
            권리금,
            <br className="md:hidden" />
            <span className="font-serif italic font-light text-terra-300"> 직접 거래하다.</span>
          </h1>
          <p className="text-base md:text-lg text-cream/70 leading-relaxed max-w-xl mx-auto mb-10">
            중개수수료 0원. 수천만 원의 권리금은<br />
            중간자 없이 당사자가 직접 합의할 때 가장 투명합니다.
          </p>

          {/* 검색바 */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-6">
            <div className="flex bg-cream rounded-full p-1.5 pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
              <svg className="w-5 h-5 text-muted mr-2.5 flex-shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                <path strokeWidth={2} strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="지역·업종으로 매물 찾기"
                className="flex-1 text-[15px] bg-transparent outline-none text-ink placeholder:text-muted"
                aria-label="매물 검색"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-green-700 text-cream rounded-full text-sm font-semibold hover:bg-green-800 transition-colors"
              >
                검색
              </button>
            </div>
          </form>

          {/* CTA */}
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/listings"
              className="px-8 py-3.5 bg-terra-500 text-cream rounded-full text-[15px] font-bold hover:bg-terra-600 active:bg-terra-700 transition-colors shadow-[0_8px_24px_rgba(217,108,79,0.4)]"
            >
              매물 둘러보기
            </Link>
            <Link
              href="/sell"
              className="px-8 py-3.5 bg-transparent border border-cream/40 text-cream rounded-full text-[15px] font-semibold hover:bg-cream/10 transition-colors"
            >
              내 매물 등록 →
            </Link>
          </div>
        </div>

        {/* 가치 제안 (히어로 하단) */}
        <div className="relative z-10 border-t border-cream/10 pb-8 pt-6">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
            {[
              { title: "중개수수료 0원", desc: "직거래로 비용 절약" },
              { title: "사업자 인증 필수", desc: "검증된 매도인" },
              { title: "상권분석 무료", desc: "데이터 기반 의사결정" },
              { title: "실시간 채팅", desc: "빠른 소통" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-terra-500 mt-1.5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-cream">{item.title}</div>
                  <div className="text-xs text-cream/50 mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 섹션 2: 업종별 매물 찾기 ===== */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="text-xs font-semibold text-terra-500 tracking-[0.15em] uppercase mb-2">Browse by category</div>
            <h2 className="font-extrabold text-green-700 text-2xl md:text-3xl tracking-tight">
              업종별로 <span className="font-serif italic font-light text-terra-500">찾아보기</span>
            </h2>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATEGORY_ITEMS.map((cat) => (
              <Link
                key={cat.name}
                href={cat.link}
                className="group flex flex-col items-center gap-2 py-5 px-2 rounded-2xl bg-cream border border-line hover:border-green-700 hover:shadow-[0_8px_24px_rgba(31,63,46,0.08)] hover:-translate-y-1 transition-all"
              >
                <div className="w-11 h-11 rounded-full bg-cream-elev group-hover:bg-green-700 flex items-center justify-center text-green-700 group-hover:text-cream transition-colors">
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-ink">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 섹션 3: 매물 통합 (VIP + 프리미엄/베이직) ===== */}
      {(vipListings.length > 0 || premBasicListings.length > 0) && (
        <section className="py-12 md:py-16 bg-cream-elev">
          <div className="max-w-7xl mx-auto px-6">
            {/* VIP 매물 */}
            {vipListings.length > 0 && (
              <>
                <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
                  <div>
                    <div className="text-xs font-semibold text-terra-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                      <span className="w-6 h-px bg-terra-500" />
                      VIP Exclusive
                    </div>
                    <h2 className="font-extrabold text-green-700 text-3xl md:text-4xl tracking-tight">
                      오늘의 <span className="font-serif italic font-light text-terra-500">추천 매물</span>
                    </h2>
                  </div>
                  <Link href="/listings" className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors whitespace-nowrap">
                    전체 보기 →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {vipListings.map((listing, vipIndex) => {
                    const addr = listing.addressRoad || listing.addressJibun || "주소 미입력";
                    const shortAddr = addr.split(" ").slice(0, 3).join(" ");
                    return (
                      <Link
                        key={listing.id}
                        href={`/listings/${listing.id}`}
                        className="flex bg-white rounded-xl overflow-hidden border-2 border-green-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                      >
                        <div className="relative w-[38%] min-h-[200px] bg-gradient-to-br from-gray-100 to-gray-200">
                          {listing.images[0] ? (
                            <Image
                              src={listing.images[0].url}
                              alt={`${listing.storeName || addr} 매물 사진`}
                              fill
                              sizes="(max-width: 768px) 100vw, 40vw"
                              className="object-cover"
                              priority={vipIndex === 0}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-11 h-11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white text-[11px] font-bold rounded shadow-[0_2px_8px_rgba(27,73,101,0.3)]">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            VIP
                          </span>
                        </div>
                        <div className="w-[62%] p-5 flex flex-col justify-center">
                          <div className="text-[11px] text-gray-500 mb-1.5">
                            {listing.category && <>{listing.category.name}</>}
                            {listing.subCategory && <> · {listing.subCategory.name}</>}
                          </div>
                          <h3 className="text-[17px] font-bold text-gray-900 mb-2.5">{shortAddr}</h3>
                          <div className="grid grid-cols-3 gap-2 mb-2.5">
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] text-gray-500 mb-0.5">보증금</p>
                              <p className="text-sm font-bold text-gray-900">{listing.deposit.toLocaleString()}만</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] text-gray-500 mb-0.5">월세</p>
                              <p className="text-sm font-bold text-gray-900">{listing.monthlyRent.toLocaleString()}만</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-[11px] text-gray-500 mb-0.5">권리금</p>
                              <p className="text-sm font-bold text-green-700">
                                {listing.premiumNone ? "무권리" : `${listing.premium.toLocaleString()}만`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {listing.areaPyeong && <span>{listing.areaPyeong}평</span>}
                            {listing.currentFloor && <><span>·</span><span>{listing.currentFloor}층</span></>}
                            <span>·</span>
                            <span>조회 {listing.viewCount}</span>
                            <span>·</span>
                            <span>관심 {listing.favoriteCount}</span>
                          </div>
                          {(listing.themes.length > 0 || ((listing as any)._count?.documents ?? 0) > 0) && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {listing.themes.slice(0, 2).map((theme) => (
                                <span key={theme} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">{theme}</span>
                              ))}
                              {((listing as any)._count?.documents ?? 0) > 0 && (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded">매출인증</span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* 프리미엄 · 베이직 매물 */}
            {premBasicListings.length > 0 && (
              <>
                <div className={`${vipListings.length > 0 ? "border-t border-line pt-10 mt-12" : ""}`}>
                  <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-green-700 text-cream text-[10px] font-bold rounded-full tracking-wider">PREMIUM</span>
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full tracking-wider">BASIC</span>
                      <h3 className="text-xl font-bold text-ink ml-1 tracking-tight">매물</h3>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {premBasicListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ===== Feature Strip — 시그니처 밴드 ===== */}
      <section className="bg-green-700 py-20 md:py-28 text-center relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-terra-500/15 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-6">
          <p className="text-terra-300 text-xs font-semibold tracking-[0.3em] uppercase mb-4">● Our Promise</p>
          <h2 className="font-extrabold text-cream text-4xl md:text-6xl leading-[1.1] tracking-tight">
            수수료 <span className="font-serif italic font-light text-terra-300">0원,</span>
            <br />
            그게 직거래다.
          </h2>
          <p className="text-cream/60 text-sm md:text-base mt-6 max-w-xl mx-auto">
            권리샵은 중개인 대신 사장님과 창업자를 직접 연결합니다.
            <br className="hidden md:block" />
            수천만 원의 권리금은 당사자 간 정직한 대화로 가장 투명해집니다.
          </p>
        </div>
      </section>

      {/* ===== 섹션 4: 프랜차이즈 (가로 스크롤) ===== */}
      <section className="py-12 md:py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <div className="text-xs font-semibold text-terra-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                <span className="w-6 h-px bg-terra-500" />
                Franchise
              </div>
              <h2 className="font-extrabold text-green-700 text-3xl md:text-4xl tracking-tight">
                검증된 <span className="font-serif italic font-light text-terra-500">프랜차이즈</span>
              </h2>
            </div>
            <Link href="/franchise" className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors whitespace-nowrap">
              더보기 →
            </Link>
          </div>
          <div className="relative">
            {/* 좌측 화살표 */}
            {showLeftArrow && (
              <button
                onClick={() => scrollFranchise("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/95 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
                aria-label="이전 프랜차이즈 보기"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {/* 우측 화살표 */}
            {showRightArrow && (
              <button
                onClick={() => scrollFranchise("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/95 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
                aria-label="다음 프랜차이즈 보기"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {/* 우측 페이드 그라디언트 */}
            {showRightArrow && (
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5]" />
            )}
          <div
            ref={franchiseScrollRef}
            onScroll={handleFranchiseScroll}
            className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
          >
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            {allBrands.map((brand) => (
              <Link
                key={brand.id}
                href={`/franchise/${brand.id}`}
                className="min-w-[280px] flex-shrink-0 bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  {brand.logo ? (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <Image src={brand.logo} alt={brand.brandName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      brand.tier === "GOLD" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {brand.brandName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900">{brand.brandName}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      brand.tier === "GOLD"
                        ? "bg-green-700 text-white"
                        : brand.tier === "SILVER"
                          ? "bg-gray-200 text-gray-600"
                          : "bg-gray-100 text-gray-600"
                    }`}>
                      {brand.tier}
                    </span>
                  </div>
                </div>
                {brand.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{brand.description}</p>
                )}
                <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-lg p-2.5">
                  {brand.totalStores && (
                    <div>
                      <p className="text-[11px] text-gray-500">매장수</p>
                      <p className="text-sm font-bold text-gray-900">{brand.totalStores.toLocaleString()}</p>
                    </div>
                  )}
                  {brand.franchiseFee && (
                    <div>
                      <p className="text-[11px] text-gray-500">가맹비</p>
                      <p className="text-sm font-bold text-gray-900">{(brand.franchiseFee / 10000).toLocaleString()}만</p>
                    </div>
                  )}
                  {brand.avgRevenue && (
                    <div>
                      <p className="text-[11px] text-gray-500">매출</p>
                      <p className="text-sm font-bold text-green-700">{(brand.avgRevenue / 10000).toLocaleString()}만</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ===== 섹션 5: 협력업체 + 집기장터 탭 통합 ===== */}
      <section className="py-12 md:py-16 bg-cream-elev">
        <div className="max-w-7xl mx-auto px-6">
          {/* 탭 헤더 */}
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <div className="text-xs font-semibold text-terra-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                <span className="w-6 h-px bg-terra-500" />
                Partners &amp; Equipment
              </div>
              <div className="flex items-center gap-1 bg-cream rounded-full p-1 border border-line">
                <button
                  onClick={() => setActiveTab("partners")}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all ${
                    activeTab === "partners"
                      ? "bg-green-700 text-cream shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  협력업체
                </button>
                <button
                  onClick={() => setActiveTab("equipment")}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-full transition-all ${
                    activeTab === "equipment"
                      ? "bg-green-700 text-cream shadow-sm"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  집기장터
                </button>
              </div>
            </div>
            <Link
              href={activeTab === "partners" ? "/partners" : "/equipment"}
              className="text-sm font-semibold text-green-700 hover:text-terra-500 transition-colors whitespace-nowrap"
            >
              더보기 →
            </Link>
          </div>

          {/* 협력업체 패널 */}
          {activeTab === "partners" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vipPartners.slice(0, 1).map((partner) => (
                <Link
                  key={partner.id}
                  href={`/partners/${partner.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {partner.images[0] ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={partner.images[0].url} alt={partner.companyName} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {partner.companyName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{partner.companyName}</h3>
                        <p className="text-xs text-gray-400">{SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-green-700 text-white text-[10px] font-bold rounded-md">VIP</span>
                  </div>
                  {partner.description && (
                    <p className="text-xs text-gray-500 line-clamp-1">{partner.description}</p>
                  )}
                  {partner.serviceArea.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      서비스 지역: {partner.serviceArea.slice(0, 3).join(", ")}
                      {partner.serviceArea.length > 3 && ` 외 ${partner.serviceArea.length - 3}곳`}
                    </p>
                  )}
                </Link>
              ))}
              {otherPartners.slice(0, vipPartners.length > 0 ? 2 : 3).map((partner) => (
                <Link
                  key={partner.id}
                  href={`/partners/${partner.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {partner.images[0] ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={partner.images[0].url} alt={partner.companyName} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {partner.companyName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{partner.companyName}</h3>
                        <p className="text-xs text-gray-400">{SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      partner.tier === "VIP"
                        ? "bg-green-700 text-white"
                        : partner.tier === "PREMIUM"
                          ? "bg-green-700/85 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}>
                      {partner.tier === "VIP" && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      )}
                      {partner.tier}
                    </span>
                  </div>
                  {partner.serviceArea.length > 0 && (
                    <p className="text-xs text-gray-400">
                      서비스 지역: {partner.serviceArea.slice(0, 2).join(", ")}
                      {partner.serviceArea.length > 2 && ` 외 ${partner.serviceArea.length - 2}곳`}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* 집기장터 패널 */}
          {activeTab === "equipment" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vipEquipment.slice(0, 1).map((item) => (
                <Link
                  key={item.id}
                  href={`/equipment/${item.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {item.images[0] ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.images[0].url} alt={item.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          🛠️
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                        <p className="text-sm font-bold text-green-700">{item.price === 0 ? "무료나눔" : `${item.price.toLocaleString()}원`}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-green-700 text-white text-[10px] font-bold rounded-md">VIP</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {item.condition === "NEW" ? "신품" : item.condition === "USED_LIKE_NEW" ? "거의새것" : "중고"}
                  </p>
                </Link>
              ))}
              {premiumEquipment.slice(0, vipEquipment.length > 0 ? 2 : 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/equipment/${item.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {item.images[0] ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.images[0].url} alt={item.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          🛠️
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                        <p className="text-sm font-bold text-green-700">{item.price === 0 ? "무료나눔" : `${item.price.toLocaleString()}원`}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      item.tier === "VIP"
                        ? "bg-green-700 text-white"
                        : item.tier === "PREMIUM"
                          ? "bg-green-700/85 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}>
                      {item.tier === "VIP" && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      )}
                      {item.tier}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {item.condition === "NEW" ? "신품" : item.condition === "USED_LIKE_NEW" ? "거의새것" : "중고"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 섹션 6: 사업자 CTA (네이비) ===== */}
      <HomeServiceSection />
    </>
  );
}
