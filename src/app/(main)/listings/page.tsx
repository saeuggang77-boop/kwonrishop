"use client";

import React, { useEffect, useState, useCallback, useMemo, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ListingCard from "@/components/listing/ListingCard";
import ListingMapView from "@/components/map/ListingMapView";
import PremiumCarousel from "@/components/shared/PremiumCarousel";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import { ListingInfeedPromo, RegisterPromoBanner } from "@/components/promotion/PromotionCTA";

import FilterChipBar, { ChipKey, ChipState, ChipRefs } from "@/components/filters/FilterChipBar";
import ActiveFilterChips, { ActiveFilterChip } from "@/components/filters/ActiveFilterChips";
import RegionSheet from "@/components/filters/RegionSheet";
import IndustrySheet from "@/components/filters/IndustrySheet";
import ThemeSheet from "@/components/filters/ThemeSheet";
import PriceSheet, { PriceState } from "@/components/filters/PriceSheet";
import FloorSheet, { FLOOR_OPTIONS } from "@/components/filters/FloorSheet";
import AreaSheet, { AreaState } from "@/components/filters/AreaSheet";
import ParkingSheet from "@/components/filters/ParkingSheet";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  subCategories: { id: string; name: string }[];
}

interface ListingItem {
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
  bumpedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  category: { name: string; icon: string | null } | null;
  subCategory: { name: string } | null;
  images: { url: string }[];
  featuredTier?: string;
}

interface FeaturedListingItem extends ListingItem {
  featuredTier?: string;
}

// 슬라이더 상한
const PREMIUM_MAX = 30000;
const DEPOSIT_MAX = 30000;
const RENT_MAX = 1000;
const AREA_MAX = 100;

// 정수 보정 helper
function intParam(sp: URLSearchParams, key: string, fallback: number): number {
  const v = sp.get(key);
  if (!v) return fallback;
  const n = parseInt(v);
  return Number.isFinite(n) ? n : fallback;
}

// 만원 단위 사람이 읽기 좋은 라벨
function formatMan(value: number): string {
  if (value === 0) return "0";
  if (value >= 10000) {
    const eok = value / 10000;
    return `${eok % 1 === 0 ? eok : eok.toFixed(1)}억`;
  }
  return `${value.toLocaleString()}만`;
}

function formatPyeong(value: number): string {
  return `${value}평`;
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [featuredListings, setFeaturedListings] = useState<FeaturedListingItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1") || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [subCategoryId, setSubCategoryId] = useState(searchParams.get("subCategoryId") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "latest");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [gridMode, setGridMode] = useState<"grid" | "list">("grid");

  // 신규 분리된 지역 필터
  const [sido, setSido] = useState(searchParams.get("sido") || "");
  const [sigungu, setSigungu] = useState(searchParams.get("sigungu") || "");

  // 가격 필터 (숫자 슬라이더 기반 — URL 동기화 시 string)
  const [premiumMin, setPremiumMin] = useState<number>(intParam(searchParams, "premiumMin", 0));
  const [premiumMax, setPremiumMax] = useState<number>(intParam(searchParams, "premiumMax", PREMIUM_MAX));
  const [depositMin, setDepositMin] = useState<number>(intParam(searchParams, "depositMin", 0));
  const [depositMax, setDepositMax] = useState<number>(intParam(searchParams, "depositMax", DEPOSIT_MAX));
  const [rentMin, setRentMin] = useState<number>(intParam(searchParams, "rentMin", 0));
  const [rentMax, setRentMax] = useState<number>(intParam(searchParams, "rentMax", RENT_MAX));
  const [premiumNone, setPremiumNone] = useState<boolean>(searchParams.get("premiumNone") === "true");
  const [premiumNegotiable, setPremiumNegotiable] = useState<boolean>(searchParams.get("premiumNegotiable") === "true");

  // 면적
  const [areaMin, setAreaMin] = useState<number>(intParam(searchParams, "areaMin", 0));
  const [areaMax, setAreaMax] = useState<number>(intParam(searchParams, "areaMax", AREA_MAX));

  // 테마
  const [selectedThemes, setSelectedThemes] = useState<string[]>(searchParams.get("themes")?.split(",").filter(Boolean) || []);

  // 층수, 주차, 매출증빙 (신규)
  const [currentFloor, setCurrentFloor] = useState<string[]>(
    searchParams.get("currentFloor")?.split(",").filter(Boolean) || []
  );
  const [parking, setParking] = useState<string>(searchParams.get("parking") || "");
  const [hasRevenueDoc, setHasRevenueDoc] = useState<boolean>(searchParams.get("hasRevenueDoc") === "true");

  // 시트 오픈 상태
  const [openSheet, setOpenSheet] = useState<ChipKey | null>(null);

  // PC 인라인 popover 앵커 ref (각 칩)
  const regionChipRef = useRef<HTMLButtonElement>(null);
  const industryChipRef = useRef<HTMLButtonElement>(null);
  const revenueDocChipRef = useRef<HTMLButtonElement>(null);
  const themeChipRef = useRef<HTMLButtonElement>(null);
  const priceChipRef = useRef<HTMLButtonElement>(null);
  const floorChipRef = useRef<HTMLButtonElement>(null);
  const areaChipRef = useRef<HTMLButtonElement>(null);
  const parkingChipRef = useRef<HTMLButtonElement>(null);
  const chipRefs: ChipRefs = {
    region: regionChipRef,
    industry: industryChipRef,
    revenueDoc: revenueDocChipRef,
    theme: themeChipRef,
    price: priceChipRef,
    floor: floorChipRef,
    area: areaChipRef,
    parking: parkingChipRef,
  };

  const debouncedKeyword = useDebounce(keyword, 300);

  // 활성 여부 helpers
  const regionActive = !!(sido || sigungu);
  const industryActive = !!(categoryId || subCategoryId);
  const themeActive = selectedThemes.length > 0;
  const priceActive =
    premiumMin > 0 || premiumMax < PREMIUM_MAX ||
    depositMin > 0 || depositMax < DEPOSIT_MAX ||
    rentMin > 0 || rentMax < RENT_MAX ||
    premiumNone || premiumNegotiable;
  const floorActive = currentFloor.length > 0;
  const areaActive = areaMin > 0 || areaMax < AREA_MAX;
  const parkingActive = !!parking;

  const chipState: ChipState = {
    region: regionActive,
    industry: industryActive,
    revenueDoc: hasRevenueDoc,
    theme: themeActive,
    price: priceActive,
    floor: floorActive,
    area: areaActive,
    parking: parkingActive,
  };

  const hasAnyActive = Object.values(chipState).some(Boolean);

  // 지도 필터 파라미터
  const mapFilterParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (categoryId) p.categoryId = categoryId;
    if (subCategoryId) p.subCategoryId = subCategoryId;
    if (debouncedKeyword) p.keyword = debouncedKeyword;
    if (sort) p.sort = sort;
    if (sido) p.sido = sido;
    if (sigungu) p.sigungu = sigungu;
    if (premiumMin > 0) p.premiumMin = String(premiumMin);
    if (premiumMax < PREMIUM_MAX) p.premiumMax = String(premiumMax);
    if (depositMin > 0) p.depositMin = String(depositMin);
    if (depositMax < DEPOSIT_MAX) p.depositMax = String(depositMax);
    if (rentMin > 0) p.rentMin = String(rentMin);
    if (rentMax < RENT_MAX) p.rentMax = String(rentMax);
    if (premiumNone) p.premiumNone = "true";
    if (premiumNegotiable) p.premiumNegotiable = "true";
    if (areaMin > 0) p.areaMin = String(areaMin);
    if (areaMax < AREA_MAX) p.areaMax = String(areaMax);
    if (selectedThemes.length > 0) p.themes = selectedThemes.join(",");
    if (currentFloor.length > 0) p.currentFloor = currentFloor.join(",");
    if (parking) p.parking = parking;
    if (hasRevenueDoc) p.hasRevenueDoc = "true";
    return p;
  }, [
    categoryId, subCategoryId, debouncedKeyword, sort,
    sido, sigungu,
    premiumMin, premiumMax, depositMin, depositMax, rentMin, rentMax,
    premiumNone, premiumNegotiable,
    areaMin, areaMax, selectedThemes,
    currentFloor, parking, hasRevenueDoc,
  ]);

  const fetchListings = useCallback(async (append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }

    const params = new URLSearchParams();
    if (!isMobile || page === 1) {
      params.set("page", String(page));
    }
    if (categoryId) params.set("categoryId", categoryId);
    if (subCategoryId) params.set("subCategoryId", subCategoryId);
    if (debouncedKeyword) params.set("keyword", debouncedKeyword);
    params.set("sort", sort);

    if (sido) params.set("sido", sido);
    if (sigungu) params.set("sigungu", sigungu);
    if (premiumMin > 0) params.set("premiumMin", String(premiumMin));
    if (premiumMax < PREMIUM_MAX) params.set("premiumMax", String(premiumMax));
    if (depositMin > 0) params.set("depositMin", String(depositMin));
    if (depositMax < DEPOSIT_MAX) params.set("depositMax", String(depositMax));
    if (rentMin > 0) params.set("rentMin", String(rentMin));
    if (rentMax < RENT_MAX) params.set("rentMax", String(rentMax));
    if (premiumNone) params.set("premiumNone", "true");
    if (premiumNegotiable) params.set("premiumNegotiable", "true");
    if (areaMin > 0) params.set("areaMin", String(areaMin));
    if (areaMax < AREA_MAX) params.set("areaMax", String(areaMax));
    if (selectedThemes.length > 0) params.set("themes", selectedThemes.join(","));
    if (currentFloor.length > 0) params.set("currentFloor", currentFloor.join(","));
    if (parking) params.set("parking", parking);
    if (hasRevenueDoc) params.set("hasRevenueDoc", "true");

    router.replace(`/listings?${params.toString()}`, { scroll: false });

    const res = await fetch(`/api/listings?${params}`);
    const data = await res.json();

    if (append) {
      setListings(prev => [...prev, ...(data.listings || [])]);
    } else {
      setListings(data.listings || []);
    }

    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
    setIsLoadingMore(false);
  }, [
    page, categoryId, subCategoryId, debouncedKeyword, sort,
    sido, sigungu,
    premiumMin, premiumMax, depositMin, depositMax, rentMin, rentMax,
    premiumNone, premiumNegotiable,
    areaMin, areaMax, selectedThemes,
    currentFloor, parking, hasRevenueDoc,
    router, isMobile,
  ]);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 무한 스크롤 (모바일 전용)
  useEffect(() => {
    if (!isMobile || viewMode !== "list") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !isLoadingMore && page < totalPages) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isMobile, viewMode, loading, isLoadingMore, page, totalPages]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    fetch("/api/listings?featured=true")
      .then((r) => r.json())
      .then((data) => setFeaturedListings(data.listings || []));
  }, []);

  useEffect(() => {
    const shouldAppend = isMobile && page > 1;
    fetchListings(shouldAppend);
  }, [fetchListings, isMobile, page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchListings();
  }

  function handleCategoryClick(id: string) {
    setCategoryId(categoryId === id ? "" : id);
    setSubCategoryId("");
    setListings([]);
    setPage(1);
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleResetAll = useCallback(() => {
    setSido("");
    setSigungu("");
    setCategoryId("");
    setSubCategoryId("");
    setHasRevenueDoc(false);
    setSelectedThemes([]);
    setPremiumMin(0);
    setPremiumMax(PREMIUM_MAX);
    setDepositMin(0);
    setDepositMax(DEPOSIT_MAX);
    setRentMin(0);
    setRentMax(RENT_MAX);
    setPremiumNone(false);
    setPremiumNegotiable(false);
    setCurrentFloor([]);
    setAreaMin(0);
    setAreaMax(AREA_MAX);
    setParking("");
    setListings([]);
    setPage(1);
  }, []);

  // 칩 클릭 → 시트 오픈 (매출증빙은 즉시 토글)
  const handleChipClick = (key: ChipKey) => {
    setOpenSheet(key);
  };

  const handleToggleRevenueDoc = () => {
    setHasRevenueDoc((prev) => !prev);
    setListings([]);
    setPage(1);
  };

  // 필터 적용 후 매물 리스트/페이지 리셋 (시트는 닫지 않음 — 외부 클릭/ESC/검색 버튼으로만 닫힘)
  const closeSheetAndRefetch = () => {
    setListings([]);
    setPage(1);
  };

  // 활성 필터 칩 행 데이터 빌드
  const activeChips: ActiveFilterChip[] = useMemo(() => {
    const chips: ActiveFilterChip[] = [];

    // 지역
    if (sido && sigungu) {
      chips.push({ key: "region", label: `${sido} ${sigungu}` });
    } else if (sido) {
      chips.push({ key: "region", label: sido });
    } else if (sigungu) {
      chips.push({ key: "region", label: sigungu });
    }

    // 업종
    if (categoryId) {
      const cat = categories.find((c) => c.id === categoryId);
      const sub = cat?.subCategories.find((s) => s.id === subCategoryId);
      if (cat && sub) {
        chips.push({ key: "industry", label: `${cat.name} / ${sub.name}` });
      } else if (cat) {
        chips.push({ key: "industry", label: cat.name });
      }
    }

    // 매출증빙
    if (hasRevenueDoc) {
      chips.push({ key: "revenueDoc", label: "매출증빙" });
    }

    // 테마
    selectedThemes.forEach((theme) => {
      chips.push({ key: `theme:${theme}`, label: theme });
    });

    // 가격: 권리금
    if (premiumMin > 0 || premiumMax < PREMIUM_MAX) {
      const minLabel = premiumMin > 0 ? formatMan(premiumMin) : "";
      const maxLabel = premiumMax < PREMIUM_MAX ? formatMan(premiumMax) : "";
      let label = "권리금 ";
      if (minLabel && maxLabel) label += `${minLabel}~${maxLabel}`;
      else if (minLabel) label += `${minLabel}+`;
      else if (maxLabel) label += `~${maxLabel}`;
      chips.push({ key: "price:premium", label });
    }
    if (premiumNone) chips.push({ key: "price:premiumNone", label: "무권리만" });
    if (premiumNegotiable) chips.push({ key: "price:premiumNegotiable", label: "권리금 협의 포함" });

    // 가격: 보증금
    if (depositMin > 0 || depositMax < DEPOSIT_MAX) {
      const minLabel = depositMin > 0 ? formatMan(depositMin) : "";
      const maxLabel = depositMax < DEPOSIT_MAX ? formatMan(depositMax) : "";
      let label = "보증금 ";
      if (minLabel && maxLabel) label += `${minLabel}~${maxLabel}`;
      else if (minLabel) label += `${minLabel}+`;
      else if (maxLabel) label += `~${maxLabel}`;
      chips.push({ key: "price:deposit", label });
    }

    // 가격: 월세
    if (rentMin > 0 || rentMax < RENT_MAX) {
      const minLabel = rentMin > 0 ? formatMan(rentMin) : "";
      const maxLabel = rentMax < RENT_MAX ? formatMan(rentMax) : "";
      let label = "월세 ";
      if (minLabel && maxLabel) label += `${minLabel}~${maxLabel}`;
      else if (minLabel) label += `${minLabel}+`;
      else if (maxLabel) label += `~${maxLabel}`;
      chips.push({ key: "price:rent", label });
    }

    // 층수
    currentFloor.forEach((f) => {
      const opt = FLOOR_OPTIONS.find((o) => o.value === f);
      if (opt) chips.push({ key: `floor:${f}`, label: opt.label });
    });

    // 면적
    if (areaMin > 0 || areaMax < AREA_MAX) {
      const minLabel = areaMin > 0 ? formatPyeong(areaMin) : "";
      const maxLabel = areaMax < AREA_MAX ? formatPyeong(areaMax) : "";
      let label = "";
      if (minLabel && maxLabel) label = `${minLabel}~${maxLabel}`;
      else if (minLabel) label = `${minLabel}+`;
      else if (maxLabel) label = `~${maxLabel}`;
      chips.push({ key: "area", label });
    }

    // 주차
    if (parking === "yes") chips.push({ key: "parking", label: "주차 가능" });
    else if (parking === "no") chips.push({ key: "parking", label: "주차 불가" });

    return chips;
  }, [
    sido, sigungu, categoryId, subCategoryId, categories,
    hasRevenueDoc, selectedThemes,
    premiumMin, premiumMax, premiumNone, premiumNegotiable,
    depositMin, depositMax, rentMin, rentMax,
    currentFloor, areaMin, areaMax, parking,
  ]);

  const handleRemoveActiveChip = (key: string) => {
    if (key === "region") {
      setSido("");
      setSigungu("");
    } else if (key === "industry") {
      setCategoryId("");
      setSubCategoryId("");
    } else if (key === "revenueDoc") {
      setHasRevenueDoc(false);
    } else if (key.startsWith("theme:")) {
      const t = key.slice("theme:".length);
      setSelectedThemes((prev) => prev.filter((x) => x !== t));
    } else if (key === "price:premium") {
      setPremiumMin(0);
      setPremiumMax(PREMIUM_MAX);
    } else if (key === "price:premiumNone") {
      setPremiumNone(false);
    } else if (key === "price:premiumNegotiable") {
      setPremiumNegotiable(false);
    } else if (key === "price:deposit") {
      setDepositMin(0);
      setDepositMax(DEPOSIT_MAX);
    } else if (key === "price:rent") {
      setRentMin(0);
      setRentMax(RENT_MAX);
    } else if (key.startsWith("floor:")) {
      const f = key.slice("floor:".length);
      setCurrentFloor((prev) => prev.filter((x) => x !== f));
    } else if (key === "area") {
      setAreaMin(0);
      setAreaMax(AREA_MAX);
    } else if (key === "parking") {
      setParking("");
    }
    setListings([]);
    setPage(1);
  };

  const commonThemes = ["무권리", "급매", "신규", "역세권", "코너", "1층"];

  return (
    <div>
      {/* 히어로 */}
      <div className="bg-green-700 px-6 pb-20 pt-14 text-center relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-terra-500/10 blur-3xl" />
        <div className="relative">
          <div className="text-xs font-semibold text-terra-300 tracking-[0.2em] uppercase mb-3">Listings</div>
          <h1 className="font-extrabold text-cream text-3xl md:text-5xl tracking-tight mb-3 leading-tight">
            내 다음 <span className="font-light text-terra-300">가게 찾기</span>
          </h1>
          <p className="text-sm text-cream/60">전국 상가 매물을 한눈에 비교하세요</p>
        </div>
      </div>

      {/* 플로팅 검색바 */}
      <div className="mx-auto max-w-2xl px-4 -mt-7 relative z-10">
        <form onSubmit={handleSearch} className="flex gap-2 bg-cream rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.15)] p-1.5 pl-5">
          <input
            type="text"
            placeholder="지역, 업종, 상호명 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-2 py-3 bg-transparent border-none outline-none text-ink placeholder:text-muted"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-green-700 text-cream rounded-full font-semibold hover:bg-green-800 transition-colors shrink-0"
          >
            검색
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 빠른필터 칩 바 (cream-elev 컨테이너로 묶음) */}
        <FilterChipBar
          active={chipState}
          hasAnyActive={hasAnyActive}
          onChipClick={handleChipClick}
          onToggleRevenueDoc={handleToggleRevenueDoc}
          onReset={handleResetAll}
          chipRefs={chipRefs}
          openChip={openSheet}
        />

        {/* 활성 필터 칩 행 */}
        <ActiveFilterChips chips={activeChips} onRemove={handleRemoveActiveChip} />

        <div className="mb-4" />

        {/* 프리미엄 매물 캐러셀 */}
        <PremiumCarousel
          title="프리미엄 매물"
          subtitle="유료 광고 매물을 먼저 확인하세요"
          count={featuredListings.length}
        >
          {featuredListings.map((listing) => {
            const tierColors: Record<string, string> = {
              VIP: "border-green-600 shadow-[0_4px_16px_rgba(27,73,101,0.15)] hover:shadow-[0_8px_28px_rgba(27,73,101,0.25)]",
              PREMIUM: "border-green-300 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)]",
              BASIC: "border-gray-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
            };
            const tierBadgeStyles: Record<string, { className: string; showStar: boolean }> = {
              VIP: { className: "px-3 py-1.5 text-xs bg-green-700 text-white shadow-[0_2px_8px_rgba(27,73,101,0.3)]", showStar: true },
              PREMIUM: { className: "px-2.5 py-1 text-xs bg-green-700/85 text-white backdrop-blur-sm", showStar: false },
              BASIC: { className: "px-2 py-0.5 text-xs bg-white/85 text-gray-500 backdrop-blur-sm", showStar: false },
            };
            const tier = listing.featuredTier || "BASIC";
            const address = listing.addressRoad || listing.addressJibun || "주소 미입력";
            const shortAddress = address.split(" ").slice(0, 3).join(" ");
            const images = listing.images;

            return (
              <div
                key={listing.id}
                onClick={() => router.push(`/listings/${listing.id}`)}
                className={`min-w-[240px] w-[calc(25%-12px)] snap-start rounded-xl border-2 bg-white ${tierColors[tier] || tierColors.BASIC} overflow-hidden cursor-pointer transition-all duration-300 shrink-0`}
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {images?.[0] ? (
                    <Image src={images[0].url} alt={`${listing.storeName || listing.addressRoad || "매물"} 사진`} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {(() => {
                    const badge = tierBadgeStyles[tier] || tierBadgeStyles.BASIC;
                    return (
                      <span className={`absolute top-2 left-2 inline-flex items-center gap-1 font-bold rounded ${badge.className}`}>
                        {badge.showStar && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        )}
                        {tier}
                      </span>
                    );
                  })()}
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-600 truncate mb-1">{listing.storeName || shortAddress}</p>
                  <p className="text-sm">
                    <span className="text-gray-500">보증금/월세 </span>
                    <span className="font-semibold text-gray-900">
                      {listing.deposit.toLocaleString()} / {listing.monthlyRent.toLocaleString()}만
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">권리금 </span>
                    <span className="font-bold text-green-700">
                      {listing.premiumNone
                        ? "무권리"
                        : `${listing.premium.toLocaleString()}만`}
                    </span>
                  </p>
                  <div className="flex gap-2 mt-1 text-xs text-gray-400">
                    {listing.areaPyeong ? <span>{listing.areaPyeong}평</span> : null}
                    {listing.currentFloor ? <span>{listing.currentFloor}층</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </PremiumCarousel>

        {/* 보기 모드 전환 + 정렬 + 결과수 */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              총 <span className="font-medium text-gray-900">{total.toLocaleString()}</span>건
            </p>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                aria-label="목록으로 보기"
                aria-pressed={viewMode === "list"}
              >
                목록
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  viewMode === "map"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                aria-label="지도로 보기"
                aria-pressed={viewMode === "map"}
              >
                지도
              </button>
            </div>
            {viewMode === "list" && (
              <div className="md:hidden flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setGridMode("grid")}
                  className={`p-1.5 rounded transition-colors ${
                    gridMode === "grid"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-label="그리드 보기"
                  aria-pressed={gridMode === "grid"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setGridMode("list")}
                  className={`p-1.5 rounded transition-colors ${
                    gridMode === "list"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  aria-label="리스트 보기"
                  aria-pressed={gridMode === "list"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
            <option value="premium_asc">권리금 낮은순</option>
            <option value="premium_desc">권리금 높은순</option>
          </select>
        </div>

        {/* 목록 또는 지도 */}
        {viewMode === "map" ? (
          loading ? (
            <div className="w-full h-[500px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
              <p className="text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : (
            <ListingMapView
              listings={listings as Array<{
                id: string;
                latitude: number | null;
                longitude: number | null;
                storeName: string | null;
                addressRoad: string | null;
                premium: number;
                deposit: number;
                monthlyRent: number;
                category: { name: string; icon: string } | null;
              }>}
              filterParams={mapFilterParams}
            />
          )
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 bg-cream rounded-2xl border border-line overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4 border-b border-line animate-pulse">
                <div className="flex-shrink-0 w-[100px] h-[100px] md:w-[130px] md:h-[130px] bg-gray-200 rounded-2xl" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="flex justify-center mb-6">
              <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-500 mb-6">검색 조건을 변경하거나 아래 인기 키워드를 선택해보세요</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {commonThemes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    setSelectedThemes([theme]);
                    setPage(1);
                  }}
                  className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={gridMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 bg-cream rounded-2xl border border-line overflow-hidden" : "flex flex-col"}>
            {listings.map((listing, index) => (
              <React.Fragment key={listing.id}>
                {index === 5 && gridMode === "grid" && (
                  <div className="md:col-span-2 px-5 py-4 border-b border-line">
                    <ListingInfeedPromo />
                  </div>
                )}
                <ListingCard
                  listing={listing}
                />
              </React.Fragment>
            ))}
          </div>
        )}

        {/* 무한 스크롤 센티널 (모바일 전용) */}
        {isMobile && viewMode === "list" && !loading && (
          <div ref={sentinelRef} className="md:hidden py-8">
            {isLoadingMore && (
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-sm text-gray-500">매물 불러오는 중...</p>
              </div>
            )}
            {!isLoadingMore && page >= totalPages && listings.length > 0 && (
              <p className="text-center text-sm text-gray-500">모든 매물을 불러왔습니다</p>
            )}
          </div>
        )}

        {/* 페이지네이션 (데스크톱 전용) */}
        {totalPages > 1 && (() => {
          const windowSize = 5;
          let start = Math.max(1, page - Math.floor(windowSize / 2));
          const end = Math.min(totalPages, start + windowSize - 1);
          if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
          const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

          return (
            <div className="hidden md:flex justify-center items-center gap-1.5 mt-8">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="첫 페이지"
              >
                &laquo;
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="이전 페이지"
              >
                &lsaquo;
              </button>
              {pages.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-green-700 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-label={`${p}페이지`}
                  aria-current={page === p ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="마지막 페이지"
              >
                &raquo;
              </button>
            </div>
          );
        })()}

        {/* 하단 등록 유도 배너 */}
        <div className="mt-10">
          <RegisterPromoBanner type="listing" />
        </div>
      </div>

      {/* 시트 (조건부 렌더링) */}
      <RegionSheet
        open={openSheet === "region"}
        onClose={() => setOpenSheet(null)}
        initialSido={sido}
        initialSigungu={sigungu}
        onApply={({ sido: nextSido, sigungu: nextSigungu }) => {
          setSido(nextSido);
          setSigungu(nextSigungu);
          closeSheetAndRefetch();
        }}
        anchorRef={regionChipRef}
        popoverWidth={360}
      />

      <IndustrySheet
        open={openSheet === "industry"}
        onClose={() => setOpenSheet(null)}
        categories={categories}
        initialCategoryId={categoryId}
        initialSubCategoryId={subCategoryId}
        onApply={({ categoryId: nextCat, subCategoryId: nextSub }) => {
          setCategoryId(nextCat);
          setSubCategoryId(nextSub);
          closeSheetAndRefetch();
        }}
        anchorRef={industryChipRef}
        popoverWidth={720}
      />

      <ThemeSheet
        open={openSheet === "theme"}
        onClose={() => setOpenSheet(null)}
        initialThemes={selectedThemes}
        onApply={(next) => {
          setSelectedThemes(next);
          closeSheetAndRefetch();
        }}
        anchorRef={themeChipRef}
        popoverWidth={480}
      />

      <PriceSheet
        open={openSheet === "price"}
        onClose={() => setOpenSheet(null)}
        initial={{
          premiumMin,
          premiumMax,
          premiumNone,
          premiumNegotiable,
          depositMin,
          depositMax,
          rentMin,
          rentMax,
        } as PriceState}
        onApply={(next) => {
          setPremiumMin(next.premiumMin);
          setPremiumMax(next.premiumMax);
          setPremiumNone(next.premiumNone);
          setPremiumNegotiable(next.premiumNegotiable);
          setDepositMin(next.depositMin);
          setDepositMax(next.depositMax);
          setRentMin(next.rentMin);
          setRentMax(next.rentMax);
          closeSheetAndRefetch();
        }}
        anchorRef={priceChipRef}
        popoverWidth={520}
      />

      <FloorSheet
        open={openSheet === "floor"}
        onClose={() => setOpenSheet(null)}
        initial={currentFloor}
        onApply={(next) => {
          setCurrentFloor(next);
          closeSheetAndRefetch();
        }}
        anchorRef={floorChipRef}
        popoverWidth={480}
      />

      <AreaSheet
        open={openSheet === "area"}
        onClose={() => setOpenSheet(null)}
        initial={{ areaMin, areaMax } as AreaState}
        onApply={(next) => {
          setAreaMin(next.areaMin);
          setAreaMax(next.areaMax);
          closeSheetAndRefetch();
        }}
        anchorRef={areaChipRef}
        popoverWidth={480}
      />

      <ParkingSheet
        open={openSheet === "parking"}
        onClose={() => setOpenSheet(null)}
        initial={parking}
        onApply={(next) => {
          setParking(next);
          closeSheetAndRefetch();
        }}
        anchorRef={parkingChipRef}
        popoverWidth={320}
      />
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense>
      <ListingsContent />
    </Suspense>
  );
}
