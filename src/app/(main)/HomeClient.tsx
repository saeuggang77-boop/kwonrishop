"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import NoticeBanner from "@/components/NoticeBanner";
import ListingCard from "@/components/listing/ListingCard";
import Image from "next/image";

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
}

interface FranchiseBrand {
  id: string;
  brandName: string;
  industry: string;
  totalStores: number | null;
  logo: string | null;
}

interface PartnerService {
  id: string;
  companyName: string;
  serviceType: string;
  serviceArea: string[];
  tier: string;
  images: { url: string }[];
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
  const [popularListings, setPopularListings] = useState<Listing[]>([]);
  const [franchiseBrands, setFranchiseBrands] = useState<FranchiseBrand[]>([]);
  const [partnerServices, setPartnerServices] = useState<PartnerService[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [latestRes, popularRes, franchiseRes, partnerRes] = await Promise.all([
        fetch("/api/listings?limit=8&sort=latest"),
        fetch("/api/listings?limit=4&sort=popular"),
        fetch("/api/franchise?limit=4"),
        fetch("/api/partners?limit=4"),
      ]);

      const [latestData, popularData, franchiseData, partnerData] = await Promise.all([
        latestRes.json(),
        popularRes.json(),
        franchiseRes.json(),
        partnerRes.json(),
      ]);

      setLatestListings(latestData.listings || []);
      setPopularListings(popularData.listings || []);
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

        {/* 최신 등록 매물 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">최신 등록 매물</h2>
            <Link href="/listings" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              더보기 →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {latestListings.slice(0, 8).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>

        {/* 인기 매물 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">인기 매물 (조회수 높은)</h2>
            <Link href="/listings?sort=popular" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              더보기 →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>

        {/* 추천 프랜차이즈 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">추천 프랜차이즈</h2>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {franchiseBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/franchise/${brand.id}`}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {brand.logo ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={brand.logo}
                          alt={brand.brandName}
                          fill
                          className="object-cover"
                          unoptimized
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
        </section>

        {/* 추천 협력업체 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">추천 협력업체</h2>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {partnerServices.map((partner) => (
                <Link
                  key={partner.id}
                  href={`/partners/${partner.id}`}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {partner.images[0] ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={partner.images[0].url}
                          alt={partner.companyName}
                          fill
                          className="object-cover"
                          unoptimized
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
        </section>

        {/* 이용 안내 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            이용 안내
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-2xl">
                🔍
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">1. 매물 검색</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                원하는 지역과 업종으로 매물을 검색하고<br />
                상세 정보를 확인하세요
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 text-2xl">
                💬
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">2. 상세 확인 & 채팅</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                매물 상세 정보를 확인하고<br />
                채팅으로 직접 문의하세요
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 text-2xl">
                ✓
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">3. 직거래 완료</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                중개수수료 없이 매도자와 직접 거래하고<br />
                안전하게 계약을 완료하세요
              </p>
            </div>
          </div>
        </section>

        {/* CTA 배너 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">지금 바로 매물을 등록하세요</h2>
            <p className="text-blue-100 dark:text-blue-200 mb-6">
              중개수수료 없이 직접 거래하고, 빠르게 매물을 판매할 수 있습니다
            </p>
            <Link
              href="/sell"
              className="inline-block px-8 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-white"
            >
              매물 등록하기
            </Link>
          </div>
        </section>

        {/* 서비스 특징 */}
        <section className="py-12 border-t border-gray-100 dark:border-gray-800">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-xl">
                0
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">중개수수료 0원</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                매도자와 매수자가 직접 거래하여 불필요한 수수료를 절약합니다
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 text-xl">
                ✓
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">사업자 인증</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                국세청 API로 인증된 실제 사업자만 매물을 등록할 수 있습니다
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 text-xl">
                ★
              </div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">블라인드 리뷰</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                거래 완료 후 익명 리뷰로 신뢰할 수 있는 매물 정보를 확인하세요
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
