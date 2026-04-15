"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NoticeBanner from "@/components/NoticeBanner";
import ListingCard from "@/components/listing/ListingCard";

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
  _count?: { documents: number };
}

interface HomeClientProps {
  initialListings: Listing[];
}

const CATEGORY_ITEMS = [
  {
    name: "외식업",
    link: `/listings?keyword=${encodeURIComponent("외식업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 9h18M9 21V9m6 12V9M4 9l2-4h12l2 4M12 3v2" />
      </svg>
    ),
  },
  {
    name: "서비스업",
    link: `/listings?keyword=${encodeURIComponent("서비스업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83" />
      </svg>
    ),
  },
  {
    name: "도/소매업",
    link: `/listings?keyword=${encodeURIComponent("도/소매업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    name: "예술/스포츠",
    link: `/listings?keyword=${encodeURIComponent("예술/스포츠/시설업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      </svg>
    ),
  },
  {
    name: "교육/학원",
    link: `/listings?keyword=${encodeURIComponent("교육/학원업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M2 3h6a4 4 0 014 4v14" />
      </svg>
    ),
  },
  {
    name: "숙박업",
    link: `/listings?keyword=${encodeURIComponent("숙박업")}`,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 21h18M3 7v1a3 3 0 006 0V7" />
      </svg>
    ),
  },
];

export default function HomeClient({
  initialListings,
}: HomeClientProps) {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");

  const vipListings = initialListings.filter((l) => l.featuredTier === "VIP").slice(0, 2);
  const otherListings = initialListings
    .filter((l) => l.featuredTier === "PREMIUM" || l.featuredTier === "BASIC")
    .slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      router.push(`/listings?keyword=${encodeURIComponent(searchKeyword)}`);
    } else {
      router.push("/listings");
    }
  };

  return (
    <>
      <NoticeBanner />

      {/* ===== 1. HERO ===== */}
      <section className="relative bg-green-700 text-cream px-6 pt-20 pb-16 md:pt-24 md:pb-20 text-center overflow-hidden">
        <div aria-hidden className="absolute -top-52 -right-24 w-[600px] h-[600px] rounded-full bg-terra-500/12 blur-3xl pointer-events-none" />
        <div aria-hidden className="absolute -bottom-24 -left-36 w-[400px] h-[400px] rounded-full bg-cream/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 text-[11px] font-bold text-terra-300 tracking-[0.3em] uppercase mb-5 before:content-[''] before:w-6 before:h-px before:bg-terra-300 after:content-[''] after:w-6 after:h-px after:bg-terra-300">
            상가 직거래 플랫폼
          </div>
          <h1 className="font-extrabold text-cream leading-[1.15] tracking-tight mb-5 text-4xl md:text-5xl">
            정직한 상가 직거래,
            <span className="block font-light text-terra-300 mt-1">권리샵.</span>
          </h1>
          <p className="text-sm md:text-[15px] text-cream/65 leading-relaxed max-w-lg mx-auto mb-8">
            중개 없이, 당사자끼리<br />
            권리금까지 투명하게 합의합니다.
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex items-center bg-cream rounded-full p-1.5 pl-6 shadow-[0_16px_48px_rgba(0,0,0,0.15)]">
              <svg className="w-4 h-4 text-muted mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="지역, 업종, 상호명으로 매물 찾기"
                className="flex-1 py-3 text-sm bg-transparent outline-none text-ink placeholder:text-muted"
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
        </div>
      </section>

      {/* ===== 2. 업종 가로 띠 ===== */}
      <section className="bg-cream border-b border-line px-4 py-4">
        <div className="max-w-5xl mx-auto flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide">
          {CATEGORY_ITEMS.map((cat) => (
            <Link
              key={cat.name}
              href={cat.link}
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink whitespace-nowrap px-3 py-2 rounded-full hover:bg-cream-elev transition-colors"
            >
              <span className="text-green-700">{cat.icon}</span>
              {cat.name}
            </Link>
          ))}
          <Link
            href="/listings"
            className="inline-flex items-center text-sm font-semibold text-terra-500 whitespace-nowrap px-3 py-2 rounded-full hover:bg-cream-elev transition-colors"
          >
            전체 업종 →
          </Link>
        </div>
      </section>

      {/* ===== 3. 추천 매물 통합 ===== */}
      <section className="py-16 md:py-20 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
            <div>
              <div className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
                <span className="w-6 h-px bg-terra-500" />
                Featured Listings
              </div>
              <h2 className="font-extrabold text-green-700 tracking-tight text-2xl md:text-3xl">
                오늘의 <span className="font-light text-terra-500">추천 매물</span>
              </h2>
            </div>
            <Link href="/listings" className="text-sm font-bold text-green-700 hover:text-terra-500 transition-colors">
              전체 매물 →
            </Link>
          </div>

          {vipListings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {vipListings.map((listing, idx) => {
                const addr = listing.addressRoad || listing.addressJibun || "주소 미입력";
                const shortAddr = addr.split(" ").slice(0, 3).join(" ");
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="flex bg-cream-elev rounded-3xl overflow-hidden border-2 border-green-700 shadow-[0_8px_32px_rgba(31,63,46,0.10)] hover:shadow-[0_16px_40px_rgba(31,63,46,0.14)] hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative w-[40%] shrink-0 bg-green-800" style={{ minHeight: 180 }}>
                      {listing.images[0] ? (
                        <Image
                          src={listing.images[0].url}
                          alt={`${listing.storeName || addr} 매물 사진`}
                          fill
                          sizes="(max-width: 768px) 40vw, 20vw"
                          className="object-cover"
                          priority={idx === 0}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-light text-5xl text-terra-300">
                            {(listing.storeName || addr).charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="absolute top-3.5 left-3.5 px-3 py-1 bg-terra-500 text-cream text-[10px] font-bold rounded-full tracking-wider">
                        VIP
                      </span>
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                      <div>
                        {listing.category?.name ? (
                          <div className="text-[11px] text-terra-500 font-semibold mb-1">
                            {listing.category.name}
                            {listing.subCategory && ` · ${listing.subCategory.name}`}
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted font-semibold mb-1">업종 미지정</div>
                        )}
                        <h3 className="font-bold text-ink text-base md:text-lg tracking-tight mb-1.5 truncate">
                          {shortAddr}
                        </h3>
                        <div className="text-xs text-muted mb-2.5">
                          {listing.areaPyeong && `${listing.areaPyeong}평`}
                          {listing.currentFloor && ` · ${listing.currentFloor}층`}
                        </div>
                        {listing.themes && listing.themes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {listing.themes.slice(0, 3).map((theme) => (
                              <span
                                key={theme}
                                className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="pt-3 border-t border-dashed border-line-deep space-y-1">
                        <div className="flex justify-between text-xs text-muted">
                          <span>보증금</span>
                          <span>{listing.deposit.toLocaleString()}만</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted">
                          <span>월세</span>
                          <span>{listing.monthlyRent.toLocaleString()}만</span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-[10px] text-muted uppercase tracking-[0.1em]">권리금</span>
                          <span className="font-extrabold text-green-700 text-base">
                            {listing.premiumNone ? (
                              "무권리"
                            ) : (
                              <>
                                <span className="font-serif italic font-medium text-xl mr-0.5">
                                  {listing.premium.toLocaleString()}
                                </span>
                                만
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {otherListings.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {otherListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== 4. FEATURE BAND ===== */}
      <section className="bg-green-700 py-20 md:py-24 px-6 text-center relative overflow-hidden">
        <div aria-hidden className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-terra-500/10 blur-[100px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="font-extrabold text-cream text-3xl md:text-4xl tracking-tight leading-[1.2] mb-4">
            수수료 <span className="font-light text-terra-300 text-[1.1em]">0</span>
            <span className="font-light text-terra-300">원,</span>
            <br />
            그게 직거래입니다.
          </h2>
          <p className="text-cream/60 text-sm md:text-base max-w-lg mx-auto">
            권리샵은 중개인 대신 사장님과 예비창업자를 직접 연결합니다.
          </p>
        </div>
      </section>

      {/* ===== 5. 창업 리소스 3카드 ===== */}
      <section className="py-16 md:py-20 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="text-[11px] font-bold text-terra-500 tracking-[0.2em] uppercase mb-2 flex items-center gap-2">
              <span className="w-6 h-px bg-terra-500" />
              More Resources
            </div>
            <h2 className="font-extrabold text-green-700 tracking-tight text-2xl md:text-3xl">
              창업에 <span className="font-light text-terra-500">필요한 모든 것</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResourceCard
              num="01"
              href="/franchise"
              title="프랜차이즈"
              titleAccent="디렉토리"
              description="공정위 등록 브랜드 · 창업비·매출을 한눈에"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 21h18M5 21V7l8-4v18m6 0V11l-6-4" />
                </svg>
              }
            />
            <ResourceCard
              num="02"
              href="/partners"
              title="협력업체"
              titleAccent="찾기"
              description="인테리어·세무·마케팅까지, 창업의 모든 파트너"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                </svg>
              }
            />
            <ResourceCard
              num="03"
              href="/equipment"
              title="집기"
              titleAccent="장터"
              description="사장님이 직접 올린 중고 집기·인테리어"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              }
            />
          </div>
        </div>
      </section>
    </>
  );
}

function ResourceCard({
  num,
  href,
  title,
  titleAccent,
  description,
  icon,
}: {
  num: string;
  href: string;
  title: string;
  titleAccent: string;
  description: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden bg-cream border border-line rounded-3xl p-7 hover:-translate-y-1 hover:border-green-700 hover:shadow-[0_16px_40px_rgba(31,63,46,0.10)] transition-all"
    >
      <span className="absolute top-7 right-7 font-serif italic font-light text-4xl text-cream-elev leading-none">{num}</span>
      <div className="w-11 h-11 bg-cream-elev rounded-full flex items-center justify-center text-green-700 mb-4 group-hover:bg-green-700 group-hover:text-cream transition-colors">
        {icon}
      </div>
      <h3 className="font-extrabold text-green-700 text-lg tracking-tight mb-1.5">
        {title} <span className="font-light text-terra-500">{titleAccent}</span>
      </h3>
      <p className="text-sm text-muted leading-relaxed mb-5">{description}</p>
      <span className="flex items-center gap-1.5 text-sm font-bold text-green-700">자세히 보기 →</span>
    </Link>
  );
}
