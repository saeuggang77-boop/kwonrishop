"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
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
  industry: string;
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

export default function HomeClient() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [franchiseBrands, setFranchiseBrands] = useState<FranchiseBrand[]>([]);
  const [partnerServices, setPartnerServices] = useState<PartnerService[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [latestRes, franchiseRes, partnerRes, equipmentRes] = await Promise.all([
        fetch("/api/listings?limit=20&sort=latest"),
        fetch("/api/franchise?featured=true&limit=10"),
        fetch("/api/partners?featured=true&limit=10"),
        fetch("/api/equipment?featured=true&limit=8"),
      ]);

      const [latestData, franchiseData, partnerData, equipmentData] = await Promise.all([
        latestRes.json(),
        franchiseRes.json(),
        partnerRes.json(),
        equipmentRes.json(),
      ]);

      setLatestListings(latestData.listings || []);
      setFranchiseBrands(franchiseData.brands || []);
      setPartnerServices(partnerData.partners || []);
      setEquipment(equipmentData.equipment || []);
    } catch (error) {
      console.error("Failed to fetch homepage data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      window.location.href = `/listings?keyword=${encodeURIComponent(searchKeyword)}`;
    }
  };

  const vipListings = latestListings.filter((l) => l.featuredTier === "VIP");
  const premBasicListings = latestListings.filter(
    (l) => l.featuredTier === "PREMIUM" || l.featuredTier === "BASIC"
  );
  const goldBrands = franchiseBrands.filter((b) => b.tier === "GOLD");
  const otherBrands = franchiseBrands.filter((b) => b.tier === "SILVER" || b.tier === "BRONZE");
  const vipPartners = partnerServices.filter((p) => p.tier === "VIP");
  const otherPartners = partnerServices.filter((p) => p.tier === "PREMIUM" || p.tier === "BASIC");
  const vipEquipment = equipment.filter((e) => e.tier === "VIP");
  const premiumEquipment = equipment.filter((e) => e.tier === "PREMIUM");

  return (
    <>
      <NoticeBanner />

      {/* ===== 1. 히어로 (네이비 배경 - 메인 전용) ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-navy-light py-16 md:py-20">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-3">
            상가직거래, <span className="text-gold-light">권리샵</span>
          </h1>
          <p className="text-base text-white/60 leading-relaxed max-w-md mx-auto mb-8">
            중개수수료 없이 권리금 직거래.<br />
            매물등록부터 거래완료까지 안전하게.
          </p>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-6">
            <div className="flex bg-white rounded-2xl p-1.5 pl-5 shadow-lg shadow-black/10">
              <svg className="w-5 h-5 text-gray-400 mr-2.5 flex-shrink-0 self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                <path strokeWidth={2} strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="원하는 지역이나 업종을 검색하세요"
                className="flex-1 text-[15px] bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
                aria-label="매물 검색"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
            </div>
          </form>

          <div className="flex gap-3 justify-center">
            <Link
              href="/listings"
              className="px-7 py-3 bg-blue-600 text-white rounded-xl text-[15px] font-bold hover:bg-blue-700 transition-colors"
            >
              매물 검색하기
            </Link>
            <Link
              href="/sell"
              className="px-7 py-3 bg-white/10 border border-white/30 text-white rounded-xl text-[15px] font-semibold hover:bg-white/20 transition-colors"
            >
              내 매물 등록하기
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 2. 가치 제안 바 ===== */}
      <div className="bg-white border-b border-gray-200 py-5">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-10">
          {[
            {
              title: "중개수수료 0원",
              desc: "중개사 없이 직거래",
              bg: "bg-blue-50",
              color: "text-blue-600",
              icon: <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
            },
            {
              title: "사업자 인증 필수",
              desc: "허위매물 차단",
              bg: "bg-emerald-50",
              color: "text-emerald-600",
              icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
            },
            {
              title: "상권분석 무료",
              desc: "공공데이터 기반",
              bg: "bg-amber-50",
              color: "text-amber-700",
              icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
            },
            {
              title: "실시간 채팅",
              desc: "매도인 직접 소통",
              bg: "bg-blue-50",
              color: "text-blue-600",
              icon: <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
            },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-5 h-5 ${item.color}`}>
                  {item.icon}
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">{item.title}</div>
                <div className="text-[11px] text-gray-400">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 3. 업종별 매물 찾기 ===== */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-xl font-extrabold text-gray-900 text-center mb-6">
            업종별 매물 찾기
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2.5">
            {CATEGORY_ITEMS.map((cat) => (
              <Link
                key={cat.name}
                href={cat.link}
                className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-white border border-gray-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold text-gray-600">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. VIP 매물 ===== */}
      {!loading && vipListings.length > 0 && (
        <section className="py-14 bg-bg-warm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-xl font-extrabold text-gray-900">
                <span className="text-gold">VIP</span> 매물
              </h2>
              <Link href="/listings" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                더보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {vipListings.map((listing) => {
                const addr = listing.addressRoad || listing.addressJibun || "주소 미입력";
                const shortAddr = addr.split(" ").slice(0, 3).join(" ");
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="flex bg-white rounded-2xl overflow-hidden border-2 border-gold shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                  >
                    <div className="relative w-[38%] min-h-[200px] bg-gradient-to-br from-gray-100 to-gray-200">
                      {listing.images[0] ? (
                        <Image
                          src={listing.images[0].url}
                          alt={`${listing.storeName || addr} 매물 사진`}
                          fill
                          sizes="(max-width: 768px) 100vw, 40vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-11 h-11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      {listing.themes.length > 0 && (
                        <div className="absolute top-2.5 left-2.5 flex gap-1">
                          {listing.themes.slice(0, 2).map((theme) => (
                            <span key={theme} className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md">{theme}</span>
                          ))}
                        </div>
                      )}
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-gradient-to-r from-gold to-amber-700 text-white text-xs font-bold rounded-md">VIP</span>
                      {((listing as any)._count?.documents ?? 0) > 0 && (
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-semibold rounded backdrop-blur-sm">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          매출인증
                        </div>
                      )}
                    </div>
                    <div className="w-[62%] p-5 flex flex-col justify-center">
                      <div className="text-xs text-gray-400 mb-1.5">
                        {listing.category && <>{listing.category.name}</>}
                        {listing.subCategory && <> · {listing.subCategory.name}</>}
                      </div>
                      <h3 className="text-[17px] font-bold text-gray-900 mb-2.5">{shortAddr}</h3>
                      <div className="grid grid-cols-3 gap-2 mb-2.5">
                        <div className="bg-amber-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-gray-400 mb-0.5">보증금</p>
                          <p className="text-sm font-bold text-gray-900">{listing.deposit.toLocaleString()}만</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-gray-400 mb-0.5">월세</p>
                          <p className="text-sm font-bold text-gray-900">{listing.monthlyRent.toLocaleString()}만</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-gray-400 mb-0.5">권리금</p>
                          <p className="text-sm font-bold text-blue-600">
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
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== 5. 프리미엄 · 베이직 매물 (통합) ===== */}
      {!loading && premBasicListings.length > 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  <span className="text-indigo-500">프리미엄</span> · <span className="text-blue-600">베이직</span> 매물
                </h2>
                <p className="text-sm text-gray-400 mt-1">다양한 업종의 매물을 만나보세요</p>
              </div>
              <Link href="/listings" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                전체보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {premBasicListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 6. 프랜차이즈 (1줄) ===== */}
      <section className="py-14 bg-bg-cool">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">프랜차이즈</h2>
            <Link href="/franchise" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              더보기 →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* GOLD 브랜드 (span 2) */}
              {goldBrands.slice(0, 1).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/franchise/${brand.id}`}
                  className="md:col-span-2 p-5 bg-white rounded-2xl border-2 border-gold relative hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm"
                >
                  <span className="absolute top-3.5 right-3.5 px-2 py-0.5 bg-gradient-to-r from-gold to-amber-700 text-white text-[10px] font-bold rounded-md">GOLD</span>
                  <div className="flex items-start gap-3 mb-2.5">
                    {brand.logo ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={brand.logo} alt={brand.brandName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                        {brand.brandName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">{brand.brandName}</h3>
                      <p className="text-xs text-gray-400">{brand.industry}</p>
                      {brand.totalStores && <p className="text-xs text-gray-500">매장 {brand.totalStores.toLocaleString()}개</p>}
                    </div>
                  </div>
                  {brand.description && (
                    <p className="text-xs text-gray-500 mb-2.5 line-clamp-1">{brand.description}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2.5 pt-2.5 border-t border-gray-100">
                    {brand.franchiseFee && (
                      <div>
                        <p className="text-[10px] text-gray-400">창업비용</p>
                        <p className="text-sm font-bold text-gray-900">{(brand.franchiseFee / 10000).toLocaleString()}만원</p>
                      </div>
                    )}
                    {brand.avgRevenue && (
                      <div>
                        <p className="text-[10px] text-gray-400">평균매출</p>
                        <p className="text-sm font-bold text-gray-900">{(brand.avgRevenue / 10000).toLocaleString()}만원</p>
                      </div>
                    )}
                    {brand.totalStores && (
                      <div>
                        <p className="text-[10px] text-gray-400">매장수</p>
                        <p className="text-sm font-bold text-gray-900">{brand.totalStores.toLocaleString()}개</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {/* SILVER / BRONZE (각 1칸) */}
              {otherBrands.slice(0, goldBrands.length > 0 ? 2 : 4).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/franchise/${brand.id}`}
                  className="p-4 bg-white rounded-2xl border border-gray-200 relative hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm"
                >
                  <span className={`absolute top-3 right-3 px-2 py-0.5 text-white text-[10px] font-bold rounded-md ${
                    brand.tier === "SILVER" ? "bg-gray-400" : "bg-amber-800"
                  }`}>
                    {brand.tier}
                  </span>
                  <div className="flex items-start gap-3 mb-2">
                    {brand.logo ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={brand.logo} alt={brand.brandName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                        {brand.brandName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">{brand.brandName}</h3>
                      <p className="text-xs text-gray-400">{brand.industry}</p>
                    </div>
                  </div>
                  {brand.totalStores && <p className="text-xs text-gray-500">매장 {brand.totalStores.toLocaleString()}개</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 7. 협력업체 (1줄) ===== */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">협력업체</h2>
            <Link href="/partners" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              더보기 →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* VIP 파트너 (span 2) */}
              {vipPartners.slice(0, 1).map((partner) => (
                <Link
                  key={partner.id}
                  href={`/partners/${partner.id}`}
                  className="md:col-span-2 p-5 bg-white rounded-2xl border-2 border-gold relative hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm"
                >
                  <span className="absolute top-3.5 right-3.5 px-2 py-0.5 bg-gradient-to-r from-gold to-amber-700 text-white text-[10px] font-bold rounded-md">VIP</span>
                  <div className="flex items-start gap-3 mb-2">
                    {partner.images[0] ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={partner.images[0].url} alt={partner.companyName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                        {partner.companyName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">{partner.companyName}</h3>
                      <p className="text-xs text-gray-400">{SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}</p>
                      {partner.serviceArea.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {partner.serviceArea.slice(0, 3).join(", ")}
                          {partner.serviceArea.length > 3 && ` 외 ${partner.serviceArea.length - 3}곳`}
                        </p>
                      )}
                    </div>
                  </div>
                  {partner.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1.5">{partner.description}</p>
                  )}
                </Link>
              ))}
              {/* PREMIUM / BASIC (각 1칸) */}
              {otherPartners.slice(0, vipPartners.length > 0 ? 2 : 4).map((partner) => (
                <Link
                  key={partner.id}
                  href={`/partners/${partner.id}`}
                  className="p-4 bg-white rounded-2xl border border-gray-200 relative hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm"
                >
                  <span className={`absolute top-3 right-3 px-2 py-0.5 text-white text-[10px] font-bold rounded-md ${
                    partner.tier === "PREMIUM" ? "bg-gray-500" : "bg-blue-500"
                  }`}>
                    {partner.tier}
                  </span>
                  <div className="flex items-start gap-3 mb-2">
                    {partner.images[0] ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={partner.images[0].url} alt={partner.companyName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                        {partner.companyName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-[15px] font-bold text-gray-900">{partner.companyName}</h3>
                      <p className="text-xs text-gray-400">{SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}</p>
                    </div>
                  </div>
                  {partner.serviceArea.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {partner.serviceArea.slice(0, 2).join(", ")}
                      {partner.serviceArea.length > 2 && ` 외 ${partner.serviceArea.length - 2}곳`}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 8. 장비/인테리어 섹션 ===== */}
      {!loading && (vipEquipment.length > 0 || premiumEquipment.length > 0) && (
        <section className="py-14 bg-bg-cool">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">중고장비 마켓</h2>
                <p className="text-sm text-gray-400 mt-1">창업 비용 절감, 검증된 장비를 합리적인 가격에</p>
              </div>
              <Link href="/equipment" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                더보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* VIP 장비 (span 2) */}
              {vipEquipment.slice(0, 1).map((item) => (
                <Link
                  key={item.id}
                  href={`/equipment/${item.id}`}
                  className="md:col-span-2 p-5 bg-white rounded-2xl border-2 border-gold relative hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm"
                >
                  <span className="absolute top-3.5 right-3.5 px-2 py-0.5 bg-gradient-to-r from-gold to-amber-700 text-white text-[10px] font-bold rounded-md">VIP</span>
                  <div className="flex items-start gap-3 mb-2">
                    {item.images[0] ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={item.images[0].url} alt={item.title} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-2xl flex-shrink-0">
                        🛠️
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-[15px] font-bold text-gray-900 mb-1 line-clamp-2">{item.title}</h3>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-lg font-bold text-blue-600">
                          {item.price === 0 ? "무료나눔" : `${item.price.toLocaleString()}원`}
                        </span>
                        {item.negotiable && item.price > 0 && (
                          <span className="text-xs text-gray-400">협의가능</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{item.condition === "NEW" ? "신품" : item.condition === "USED_LIKE_NEW" ? "거의새것" : "중고"}</span>
                        <span>·</span>
                        <span>조회 {item.viewCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {/* PREMIUM 장비 (각 1칸) */}
              {premiumEquipment.slice(0, vipEquipment.length > 0 ? 2 : 4).map((item) => (
                <Link
                  key={item.id}
                  href={`/equipment/${item.id}`}
                  className="p-4 bg-white rounded-2xl border border-gray-200 relative hover:shadow-lg hover:-translate-y-1 transition-all shadow-sm"
                >
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-gray-500 text-white text-[10px] font-bold rounded-md">PREMIUM</span>
                  <div className="mb-3">
                    {item.images[0] ? (
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2">
                        <Image src={item.images[0].url} alt={item.title} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center text-4xl mb-2">
                        🛠️
                      </div>
                    )}
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{item.title}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-blue-600">
                        {item.price === 0 ? "무료" : `${item.price.toLocaleString()}`}
                      </span>
                      {item.price > 0 && <span className="text-xs text-gray-400">원</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
                    <span>{item.condition === "NEW" ? "신품" : "중고"}</span>
                    <span>·</span>
                    <span>조회 {item.viewCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 9. 사업자 CTA (네이비) ===== */}
      <HomeServiceSection />
    </>
  );
}
