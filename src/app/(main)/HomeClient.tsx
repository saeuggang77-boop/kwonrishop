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

export default function HomeClient() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [latestListings, setLatestListings] = useState<Listing[]>([]);
  const [franchiseBrands, setFranchiseBrands] = useState<FranchiseBrand[]>([]);
  const [partnerServices, setPartnerServices] = useState<PartnerService[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [latestRes, franchiseRes, partnerRes] = await Promise.all([
        fetch("/api/listings?limit=20&sort=latest"),
        fetch("/api/franchise?featured=true&limit=10"),
        fetch("/api/partners?featured=true&limit=10"),
      ]);

      const [latestData, franchiseData, partnerData] = await Promise.all([
        latestRes.json(),
        franchiseRes.json(),
        partnerRes.json(),
      ]);

      setLatestListings(latestData.listings || []);
      setFranchiseBrands(franchiseData.brands || []);
      setPartnerServices(partnerData.partners || []);
    } catch (error) {
      console.error("Failed to fetch homepage data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // pathname이 변경될 때마다 (다른 페이지에서 돌아올 때) 항상 새로 fetch
  useEffect(() => {
    fetchData();
  }, [fetchData, pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      window.location.href = `/listings?keyword=${encodeURIComponent(searchKeyword)}`;
    }
  };

  return (
    <>
      <NoticeBanner />
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 히어로 */}
        <section className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            상가직거래, <span className="text-blue-600">권리샵</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            중개수수료 없이 권리금 직거래.<br />
            매물등록부터 거래완료까지 안전하게.
          </p>

          {/* 검색바 */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="원하는 지역이나 업종을 검색하세요"
                className="w-full px-6 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-label="매물 검색"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                검색
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/listings"
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              매물 검색하기
            </Link>
            <Link
              href="/sell"
              className="px-8 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              내 매물 등록하기
            </Link>
          </div>
        </section>

        {/* 카테고리 */}
        <section className="py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            업종별 매물 찾기
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {[
              { name: "외식업", icon: "🍳", link: `/listings?keyword=${encodeURIComponent("외식업")}` },
              { name: "서비스업", icon: "✂️", link: `/listings?keyword=${encodeURIComponent("서비스업")}` },
              { name: "도/소매업", icon: "🏪", link: `/listings?keyword=${encodeURIComponent("도/소매업")}` },
              { name: "예술/스포츠/시설업", icon: "🎮", link: `/listings?keyword=${encodeURIComponent("예술/스포츠/시설업")}` },
              { name: "교육/학원업", icon: "📚", link: `/listings?keyword=${encodeURIComponent("교육/학원업")}` },
              { name: "숙박업", icon: "🏨", link: `/listings?keyword=${encodeURIComponent("숙박업")}` },
              { name: "협력업체", icon: "🔧", link: "/partners" },
              { name: "기타", icon: "💬", link: `/listings?keyword=${encodeURIComponent("기타")}` },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={cat.link}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="text-3xl" aria-hidden="true">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* VIP 매물 - 2열 가로형 카드 */}
        {!loading && latestListings.filter((l) => l.featuredTier === "VIP").length > 0 && (
          <section className="py-12 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                <span className="text-yellow-500">VIP</span> 매물
              </h2>
              <Link href="/listings" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                더보기 →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestListings.filter((l) => l.featuredTier === "VIP").map((listing) => {
                const addr = listing.addressRoad || listing.addressJibun || "주소 미입력";
                const shortAddr = addr.split(" ").slice(0, 3).join(" ");
                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="block border-2 border-yellow-400 dark:border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="md:flex">
                      {/* 이미지 영역 */}
                      <div className="relative md:w-2/5 aspect-[4/3] md:aspect-auto bg-gray-100 dark:bg-gray-700">
                        {listing.images[0] ? (
                          <Image
                            src={listing.images[0].url}
                            alt={`${listing.storeName || addr} 매물 사진`}
                            fill
                            sizes="(max-width: 768px) 100vw, 40vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[200px] flex items-center justify-center text-gray-300 dark:text-gray-600">
                            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                        {listing.themes.length > 0 && (
                          <div className="absolute top-3 left-3 flex gap-1">
                            {listing.themes.slice(0, 2).map((theme) => (
                              <span key={theme} className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md shadow-sm">{theme}</span>
                            ))}
                          </div>
                        )}
                        <span className="absolute top-3 right-3 px-2.5 py-1 bg-yellow-500 text-white text-xs font-bold rounded-md shadow-sm">VIP</span>
                      </div>
                      {/* 정보 영역 */}
                      <div className="p-5 md:w-3/5 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-2">
                          {listing.category && <span>{listing.category.icon} {listing.category.name}</span>}
                          {listing.subCategory && <><span>·</span><span>{listing.subCategory.name}</span></>}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{shortAddr}</h3>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">보증금</p>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{listing.deposit.toLocaleString()}만</p>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">월세</p>
                            <p className="font-bold text-gray-900 dark:text-gray-100">{listing.monthlyRent.toLocaleString()}만</p>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2.5 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">권리금</p>
                            <p className="font-bold text-blue-600 dark:text-blue-400">
                              {listing.premiumNone ? "무권리" : `${listing.premium.toLocaleString()}만`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          {listing.areaPyeong && <span>{listing.areaPyeong}평</span>}
                          {listing.currentFloor && <><span>·</span><span>{listing.currentFloor}층</span></>}
                          <span>·</span>
                          <span>조회 {listing.viewCount}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 프리미엄 매물 */}
        {!loading && latestListings.filter((l) => l.featuredTier === "PREMIUM").length > 0 && (
          <section className="py-12 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                <span className="text-purple-600">프리미엄</span> 매물
              </h2>
              <Link href="/listings" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                더보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestListings.filter((l) => l.featuredTier === "PREMIUM").map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* 베이직 매물 */}
        {!loading && latestListings.filter((l) => l.featuredTier === "BASIC").length > 0 && (
          <section className="py-12 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                <span className="text-blue-600">베이직</span> 매물
              </h2>
              <Link href="/listings" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                더보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestListings.filter((l) => l.featuredTier === "BASIC").map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* 프랜차이즈 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">프랜차이즈</h2>
            <Link href="/franchise" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              더보기 →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* 골드 브랜드 - 2열 대형 카드 */}
              {franchiseBrands.filter((b) => b.tier === "GOLD").length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {franchiseBrands.filter((b) => b.tier === "GOLD").map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/franchise/${brand.id}`}
                      className="p-5 bg-white dark:bg-gray-800 border-2 border-yellow-400 dark:border-yellow-500 rounded-xl hover:shadow-md transition-shadow relative"
                    >
                      <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-md">
                        GOLD
                      </div>
                      <div className="flex items-start gap-4 mb-3">
                        {brand.logo ? (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                            <Image
                              src={brand.logo}
                              alt={brand.brandName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 flex items-center justify-center font-bold text-xl flex-shrink-0">
                            {brand.brandName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{brand.brandName}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{brand.industry}</p>
                          {brand.totalStores && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">매장 {brand.totalStores.toLocaleString()}개</p>
                          )}
                        </div>
                      </div>
                      {brand.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
                          {brand.description}
                        </p>
                      )}
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {brand.franchiseFee && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">창업비용</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {(brand.franchiseFee / 10000).toLocaleString()}만원
                            </p>
                          </div>
                        )}
                        {brand.avgRevenue && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">평균매출</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {(brand.avgRevenue / 10000).toLocaleString()}만원
                            </p>
                          </div>
                        )}
                        {brand.totalStores && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">매장수</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {brand.totalStores.toLocaleString()}개
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* 실버/브론즈 브랜드 - 4열 소형 카드 */}
              {franchiseBrands.filter((b) => b.tier === "SILVER" || b.tier === "BRONZE").length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {franchiseBrands.filter((b) => b.tier === "SILVER" || b.tier === "BRONZE").map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/franchise/${brand.id}`}
                      className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow relative"
                    >
                      <div className={`absolute top-3 right-3 px-2 py-0.5 text-white text-xs font-bold rounded ${
                        brand.tier === "SILVER" ? "bg-gray-400" : "bg-amber-700"
                      }`}>
                        {brand.tier === "SILVER" ? "SILVER" : "BRONZE"}
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        {brand.logo ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={brand.logo}
                              alt={brand.brandName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-lg">
                            {brand.brandName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{brand.brandName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{brand.industry}</p>
                        </div>
                      </div>
                      {brand.totalStores && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">매장 {brand.totalStores.toLocaleString()}개</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* 협력업체 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">협력업체</h2>
            <Link href="/partners" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              더보기 →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-32 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* VIP 파트너 - 2열 대형 카드 */}
              {partnerServices.filter((p) => p.tier === "VIP").length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {partnerServices.filter((p) => p.tier === "VIP").map((partner) => (
                    <Link
                      key={partner.id}
                      href={`/partners/${partner.id}`}
                      className="p-5 bg-white dark:bg-gray-800 border-2 border-yellow-400 dark:border-yellow-500 rounded-xl hover:shadow-md transition-shadow relative"
                    >
                      <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-md">
                        VIP
                      </div>
                      <div className="flex items-start gap-4 mb-3">
                        {partner.images[0] ? (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                            <Image
                              src={partner.images[0].url}
                              alt={partner.companyName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 flex items-center justify-center font-bold text-xl flex-shrink-0">
                            {partner.companyName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{partner.companyName}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                            {SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}
                          </p>
                          {partner.serviceArea.length > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {partner.serviceArea.slice(0, 3).join(", ")}
                              {partner.serviceArea.length > 3 && ` 외 ${partner.serviceArea.length - 3}곳`}
                            </p>
                          )}
                        </div>
                      </div>
                      {partner.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {partner.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}

              {/* 프리미엄/베이직 파트너 - 4열 소형 카드 */}
              {partnerServices.filter((p) => p.tier === "PREMIUM" || p.tier === "BASIC").length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {partnerServices.filter((p) => p.tier === "PREMIUM" || p.tier === "BASIC").map((partner) => (
                    <Link
                      key={partner.id}
                      href={`/partners/${partner.id}`}
                      className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow relative"
                    >
                      <div className={`absolute top-3 right-3 px-2 py-0.5 text-white text-xs font-bold rounded ${
                        partner.tier === "PREMIUM" ? "bg-gray-500" : "bg-blue-500"
                      }`}>
                        {partner.tier === "PREMIUM" ? "PREMIUM" : "BASIC"}
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        {partner.images[0] ? (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={partner.images[0].url}
                              alt={partner.companyName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 flex items-center justify-center font-bold text-lg">
                            {partner.companyName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{partner.companyName}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}
                          </p>
                        </div>
                      </div>
                      {partner.serviceArea.length > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {partner.serviceArea.slice(0, 2).join(", ")}
                          {partner.serviceArea.length > 2 && ` 외 ${partner.serviceArea.length - 2}곳`}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>

      </div>

      {/* 홈 서비스 섹션 */}
      <HomeServiceSection />
    </>
  );
}
