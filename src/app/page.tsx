"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
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
  Home,
  User,
} from "lucide-react";
import { AuthNavItems } from "./(main)/auth-nav";
import { formatKRW } from "@/lib/utils/format";
import { REGIONS, BUSINESS_CATEGORY_LABELS } from "@/lib/utils/constants";

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
  address: string;
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

const REGION_TABS = ["서울", "경기", "그 외"];
const FRANCHISE_TABS = ["외식", "도소매", "서비스"];

const CATEGORY_ICONS = [
  { icon: Store, label: "점포 찾기", href: "/listings" },
  { icon: FileEdit, label: "점포 팔기", href: "/listings/new" },
  { icon: Building, label: "프랜차이즈", href: "/franchise" },
  { icon: Search, label: "점포찾기 의뢰", href: "/listings" },
  { icon: Paintbrush, label: "인테리어 의뢰", href: "#" },
  { icon: Trash2, label: "철거 의뢰", href: "#" },
  { icon: Sparkles, label: "청소 의뢰", href: "#" },
  { icon: Signpost, label: "간판 의뢰", href: "#" },
];

const regionKeys = Object.keys(REGIONS);

export default function HomePage() {
  const [regionTab, setRegionTab] = useState("서울");
  const [franchiseTab, setFranchiseTab] = useState("외식");
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [franchises, setFranchises] = useState<FranchiseCard[]>([]);
  const [posts, setPosts] = useState<BoardPostCard[]>([]);

  // Location search state
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const districtOptions = selectedCity ? REGIONS[selectedCity] ?? [] : [];

  useEffect(() => {
    fetch("/api/bbs")
      .then((res) => res.json())
      .then((json) => setPosts(json.data?.slice(0, 5) ?? []))
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    const regionParam = regionTab === "그 외" ? "" : regionTab;
    fetch(`/api/listings?query=${regionParam}&limit=6`)
      .then((res) => res.json())
      .then((json) =>
        setListings(
          (json.data ?? []).map((l: Record<string, unknown>) => ({
            ...l,
            price: String(l.price ?? "0"),
            monthlyRent: l.monthlyRent ? String(l.monthlyRent) : null,
            premiumFee: l.premiumFee ? String(l.premiumFee) : null,
            monthlyRevenue: l.monthlyRevenue ? String(l.monthlyRevenue) : null,
            monthlyProfit: l.monthlyProfit ? String(l.monthlyProfit) : null,
          }))
        )
      )
      .catch(() => setListings([]));
  }, [regionTab]);

  useEffect(() => {
    fetch(`/api/franchise?category=${franchiseTab}`)
      .then((res) => res.json())
      .then((json) => setFranchises(json.data?.slice(0, 4) ?? []))
      .catch(() => setFranchises([]));
  }, [franchiseTab]);

  function handleLocationSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity) params.set("city", selectedCity);
    if (selectedDistrict) params.set("district", selectedDistrict);
    window.location.href = `/listings?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/krw_shop_logo_symbol_transparent.png"
              alt="권리샵"
              width={36}
              height={36}
              priority
            />
            <span className="font-heading text-xl font-bold text-navy">
              권리샵
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/listings"
              className="text-sm font-medium text-gray-600 hover:text-navy"
            >
              점포 찾기
            </Link>
            <Link
              href="/listings/new"
              className="text-sm font-medium text-gray-600 hover:text-navy"
            >
              점포 팔기
            </Link>
            <Link
              href="/franchise"
              className="text-sm font-medium text-gray-600 hover:text-navy"
            >
              프랜차이즈
            </Link>
            <Link
              href="/bbs"
              className="text-sm font-medium text-gray-600 hover:text-navy"
            >
              이용가이드
            </Link>
          </nav>
          <div className="flex items-center">
            <AuthNavItems />
          </div>
        </div>
      </header>

      {/* Section 1: Hero Banner */}
      <section className="bg-gradient-to-b from-navy to-[#1A5A7A] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="font-heading text-3xl font-bold leading-tight md:text-5xl">
            내 점포, 여기서 찾자!
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-300">
            전국 상가·점포 매물 한눈에
          </p>

          {/* Location Search Bar */}
          <form
            onSubmit={handleLocationSearch}
            className="mx-auto mt-8 max-w-2xl"
          >
            <div className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-lg sm:flex-row sm:items-center sm:gap-3 sm:p-4">
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedDistrict("");
                }}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-mint"
              >
                <option value="">시/도 선택</option>
                {regionKeys.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedCity}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-mint disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">구/군 선택</option>
                {districtOptions.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-white hover:bg-mint-dark"
              >
                매물검색
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Section 2: Category Icons */}
      <section className="border-b border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-4 gap-4 md:grid-cols-8">
            {CATEGORY_ICONS.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="flex flex-col items-center gap-2 rounded-lg py-3 text-gray-600 transition hover:bg-gray-50 hover:text-mint"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/10">
                  <cat.icon className="h-6 w-6 text-mint" />
                </div>
                <span className="text-xs font-medium">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: 오늘의 추천 매물 */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-navy">
              오늘의 추천 매물
            </h2>
            <Link
              href="/listings"
              className="flex items-center text-sm text-gray-500 hover:text-mint"
            >
              전체보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Region Tabs */}
          <div className="mt-4 flex gap-2">
            {REGION_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setRegionTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                  regionTab === tab
                    ? "bg-navy text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Listing Cards */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.length === 0 ? (
              <p className="col-span-3 py-12 text-center text-gray-400">
                매물이 없습니다
              </p>
            ) : (
              listings.map((item) => (
                <Link
                  key={item.id}
                  href={`/listings/${item.id}`}
                  className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="inline-block rounded-full bg-mint/10 px-2.5 py-0.5 text-xs font-medium text-mint">
                      {BUSINESS_CATEGORY_LABELS[item.businessCategory] ??
                        item.businessCategory}
                    </span>
                    {item.areaPyeong && (
                      <span className="text-xs text-gray-400">
                        {item.areaPyeong}평
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 line-clamp-1 text-base font-bold text-navy">
                    {item.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {item.address}
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">보증금</span>
                      <span className="font-bold text-navy">
                        {formatKRW(Number(item.price))}
                      </span>
                    </div>
                    {item.monthlyRent && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">월세</span>
                        <span className="font-bold text-navy">
                          {formatKRW(Number(item.monthlyRent))}
                        </span>
                      </div>
                    )}
                    {item.premiumFee && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">권리금</span>
                        <span className="font-bold text-orange-600">
                          {formatKRW(Number(item.premiumFee))}
                        </span>
                      </div>
                    )}
                    {item.monthlyRevenue && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">월매출</span>
                        <span className="font-medium text-mint">
                          {formatKRW(Number(item.monthlyRevenue))}
                        </span>
                      </div>
                    )}
                    {item.monthlyProfit && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">월수익</span>
                        <span className="font-medium text-green-600">
                          {formatKRW(Number(item.monthlyProfit))}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Section 4: 추천 프랜차이즈 */}
      <section className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-navy">
              추천 프랜차이즈
            </h2>
            <Link
              href="/franchise"
              className="flex items-center text-sm text-gray-500 hover:text-mint"
            >
              전체보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Franchise Tabs */}
          <div className="mt-4 flex gap-2">
            {FRANCHISE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setFranchiseTab(tab)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                  franchiseTab === tab
                    ? "bg-mint text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Franchise Cards */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {franchises.length === 0 ? (
              <p className="col-span-4 py-12 text-center text-gray-400">
                프랜차이즈 정보가 없습니다
              </p>
            ) : (
              franchises.map((brand) => (
                <div
                  key={brand.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-mint">
                        {brand.subcategory}
                      </span>
                      <h3 className="mt-1 text-base font-bold text-navy">
                        {brand.brandName}
                      </h3>
                    </div>
                    {brand.isPromoting && (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-600">
                        프로모션
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {brand.monthlyAvgSales && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">월 평균매출</span>
                        <span className="ml-auto font-bold text-navy">
                          {formatKRW(Number(brand.monthlyAvgSales))}
                        </span>
                      </div>
                    )}
                    {brand.startupCost && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">창업비용</span>
                        <span className="ml-auto font-bold text-navy">
                          {formatKRW(Number(brand.startupCost))}
                        </span>
                      </div>
                    )}
                    {brand.storeCount != null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Store className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">가맹점</span>
                        <span className="ml-auto font-bold text-navy">
                          {brand.storeCount.toLocaleString()}개
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Section 5: 창업정보 */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-navy">
              창업정보
            </h2>
            <Link
              href="/bbs"
              className="flex items-center text-sm text-gray-500 hover:text-mint"
            >
              전체보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
            {posts.length === 0 ? (
              <p className="py-8 text-center text-gray-400">
                게시글이 없습니다
              </p>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-800">{post.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Section 6: CTA */}
      <section className="bg-navy py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-2xl font-bold text-white">
            내 점포, 지금 등록하세요
          </h2>
          <p className="mt-3 text-gray-300">
            무료로 점포를 등록하고 빠르게 양도·양수하세요.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/listings/new"
              className="rounded-lg bg-mint px-8 py-3 font-medium text-white hover:bg-mint-dark"
            >
              점포 등록하기
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-white/30 px-8 py-3 font-medium text-white hover:bg-white/10"
            >
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
              <Image
                src="/logos/krw_shop_logo_symbol_transparent.png"
                alt="권리샵"
                width={28}
                height={28}
              />
              <span className="font-heading text-sm font-bold text-navy">
                권리샵
              </span>
            </div>
            <nav className="flex gap-6 text-sm text-gray-500">
              <Link href="/legal/terms" className="hover:text-navy">
                이용약관
              </Link>
              <Link href="/legal/privacy" className="hover:text-navy">
                개인정보처리방침
              </Link>
              <Link href="/legal/disclaimer" className="hover:text-navy">
                면책조항
              </Link>
            </nav>
            <p className="text-xs text-gray-400">
              &copy; 2026 권리샵. All rights reserved.
            </p>
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            본 서비스에서 제공하는 정보는 참고용이며, 플랫폼은 매물의 정확성을
            보증하지 않습니다.
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white md:hidden">
        <Link
          href="/"
          className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-mint"
        >
          <Home className="h-5 w-5" /> 홈
        </Link>
        <Link
          href="/listings"
          className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500"
        >
          <Search className="h-5 w-5" /> 점포찾기
        </Link>
        <Link
          href="/listings/new"
          className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500"
        >
          <FileEdit className="h-5 w-5" /> 점포팔기
        </Link>
        <Link
          href="/franchise"
          className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500"
        >
          <Building className="h-5 w-5" /> 프랜차이즈
        </Link>
        <Link
          href="/dashboard"
          className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500"
        >
          <User className="h-5 w-5" /> 내정보
        </Link>
      </nav>
    </div>
  );
}
