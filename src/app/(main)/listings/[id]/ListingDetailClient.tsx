"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import JsonLd from "@/components/seo/JsonLd";
import TierBadge from "@/components/shared/TierBadge";
import SellerTrustBadge from "@/components/shared/SellerTrustBadge";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "@/lib/toast";

const ReviewSection = dynamic(() => import("@/components/listing/ReviewSection"), {
  loading: () => <div className="py-4 border-b border-gray-100"><div className="h-20 bg-gray-100 rounded animate-pulse" /></div>,
});

const KakaoMap = dynamic(() => import("@/components/map/KakaoMap"), {
  loading: () => <div className="h-[300px] md:h-[400px] bg-gray-100 rounded-xl animate-pulse" />,
});

const ShareButton = dynamic(() => import("@/components/listing/ShareButton"), {
  ssr: false,
});

const CommercialDistrictSection = dynamic(() => import("@/components/listing/CommercialDistrictSection"), {
  loading: () => <div className="py-4 border-b border-gray-100"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div>,
});

const CrossSellSection = dynamic(() => import("@/components/shared/CrossSellSection"), {
  ssr: false,
});

interface ListingDetail {
  id: string;
  status: string;
  addressRoad: string | null;
  addressJibun: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  deposit: number;
  monthlyRent: number;
  premium: number;
  premiumNone: boolean;
  premiumNegotiable: boolean;
  premiumBusiness: number | null;
  premiumBusinessDesc: string | null;
  premiumFacility: number | null;
  premiumFacilityDesc: string | null;
  premiumLocation: number | null;
  premiumLocationDesc: string | null;
  maintenanceFee: number | null;
  brandType: string;
  storeName: string | null;
  currentFloor: number | null;
  totalFloor: number | null;
  isBasement: boolean;
  areaPyeong: number | null;
  areaSqm: number | null;
  themes: string[];
  parkingTotal: number | null;
  parkingNone: boolean;
  monthlyRevenue: number | null;
  monthlyProfit: number | null;
  expenseMaterial: number | null;
  expenseLabor: number | null;
  expenseRent: number | null;
  expenseMaintenance: number | null;
  expenseUtility: number | null;
  expenseOther: number | null;
  profitDescription: string | null;
  familyWorkers: number | null;
  employeesFull: number | null;
  employeesPart: number | null;
  operationType: string;
  description: string | null;
  contactPublic: boolean;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  category: { id?: string; name: string; icon: string } | null;
  subCategory: { name: string } | null;
  images: { id: string; url: string; type: string }[];
  user: { id: string; name: string | null; image: string | null; phone: string | null; createdAt: string };
  _count: { favorites: number; chatRooms: number };
  featuredTier?: string;
  sellerTrust?: { avgRating: number; reviewCount: number };
  priceHistory?: { id: string; field: string; oldValue: number; newValue: number; createdAt: string }[];
}

interface AreaStats {
  avgDeposit: number;
  avgMonthlyRent: number;
  avgPremium: number;
  count: number;
  area: string;
}

interface RecentlyViewed {
  id: string;
  storeName: string;
  addressRoad: string;
  deposit: number;
  monthlyRent: number;
  premium: number;
  premiumNone: boolean;
  categoryName: string;
  categoryIcon: string;
  imageUrl: string;
  viewedAt: number;
}

const IMAGE_TABS = [
  { key: "ALL", label: "전체" },
  { key: "EXTERIOR", label: "외부" },
  { key: "INTERIOR", label: "내부" },
  { key: "KITCHEN", label: "주방" },
  { key: "OTHER", label: "기타" },
] as const;

type ImageTabKey = (typeof IMAGE_TABS)[number]["key"];

export default function ListingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [bumping, setBumping] = useState(false);
  const [imageTab, setImageTab] = useState<ImageTabKey>("ALL");
  const [areaStats, setAreaStats] = useState<AreaStats | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewed[]>([]);

  useEffect(() => {
    setError(false);
    fetch(`/api/listings/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.error) {
          router.push("/listings");
          return;
        }
        setListing(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [params.id, router]);

  // Fetch area stats
  const listingId = listing?.id;
  const listingAddressRoad = listing?.addressRoad;
  const listingCategoryId = listing?.category?.id;
  useEffect(() => {
    if (!listingId || !listingAddressRoad) return;
    const area = listingAddressRoad.match(/([\w가-힣]+[구군시])/)?.[1];
    if (!area) return;
    const qp = new URLSearchParams({ addressDong: area, excludeId: listingId });
    if (listingCategoryId) qp.set("categoryId", listingCategoryId);
    fetch(`/api/listings/area-stats?${qp}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setAreaStats(data); })
      .catch(() => {});
  }, [listingId, listingAddressRoad, listingCategoryId]);

  // Recently viewed: save current + load list
  useEffect(() => {
    if (!listing) return;
    try {
      const key = "recentlyViewedListings";
      const stored: RecentlyViewed[] = JSON.parse(localStorage.getItem(key) || "[]");
      const entry: RecentlyViewed = {
        id: listing.id,
        storeName: listing.storeName || listing.addressRoad || "매물",
        addressRoad: listing.addressRoad || "",
        deposit: listing.deposit,
        monthlyRent: listing.monthlyRent,
        premium: listing.premium,
        premiumNone: listing.premiumNone,
        categoryName: listing.category?.name || "",
        categoryIcon: listing.category?.icon || "",
        imageUrl: listing.images[0]?.url || "",
        viewedAt: Date.now(),
      };
      const filtered = stored.filter((s) => s.id !== listing.id);
      const updated = [entry, ...filtered].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(updated));
      // Show other listings (exclude current)
      setRecentlyViewed(filtered.slice(0, 10));
    } catch {}
  }, [listingId]);

  // Filtered images by tab
  const filteredImages = useMemo(() => {
    if (!listing) return [];
    if (imageTab === "ALL") return listing.images;
    return listing.images.filter((img) => img.type === imageTab);
  }, [listing, imageTab]);

  // Reset currentImage when tab changes
  useEffect(() => {
    setCurrentImage(0);
  }, [imageTab]);

  // Tab counts
  const imageCounts = useMemo(() => {
    if (!listing) return {};
    const counts: Record<string, number> = { ALL: listing.images.length };
    for (const img of listing.images) {
      counts[img.type] = (counts[img.type] || 0) + 1;
    }
    return counts;
  }, [listing]);

  async function handleFavorite() {
    if (!session) {
      router.push("/login");
      return;
    }
    const res = await fetch(`/api/listings/${params.id}/favorite`, { method: "POST" });
    const data = await res.json();
    setFavorited(data.favorited);
    if (listing) {
      setListing({
        ...listing,
        favoriteCount: listing.favoriteCount + (data.favorited ? 1 : -1),
      });
    }
  }

  async function handleBump() {
    if (!session) {
      router.push("/login");
      return;
    }

    setBumping(true);
    try {
      const res = await fetch(`/api/listings/${params.id}/bump`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "매물이 끌어올려졌습니다!");
        window.location.reload();
      } else {
        if (data.needsPurchase) {
          const goPricing = confirm(data.message + "\n\n가격 안내 페이지로 이동하시겠습니까?");
          if (goPricing) {
            router.push("/pricing");
          }
        } else {
          toast.error(data.error || "끌어올리기에 실패했습니다.");
        }
      }
    } catch {
      toast.error("끌어올리기 요청 중 오류가 발생했습니다.");
    } finally {
      setBumping(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="aspect-[16/9] bg-gray-200 rounded-xl" />
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">매물을 불러올 수 없습니다.</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(false);
            fetch(`/api/listings/${params.id}`)
              .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
              })
              .then((data) => {
                if (data.error) {
                  router.push("/listings");
                  return;
                }
                setListing(data);
                setLoading(false);
              })
              .catch(() => {
                setError(true);
                setLoading(false);
              });
          }}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!listing) return null;

  const fmt = (n: number) => n.toLocaleString();

  const jsonLdData = listing.latitude && listing.longitude ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": listing.storeName || listing.addressRoad || "매물",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": listing.addressRoad || "",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": listing.latitude,
      "longitude": listing.longitude,
    },
  } : null;

  // Premium breakdown data
  const hasPremiumBreakdown = !listing.premiumNone && (
    listing.premiumBusiness || listing.premiumFacility || listing.premiumLocation
  );
  const premiumTotal = (listing.premiumBusiness || 0) + (listing.premiumFacility || 0) + (listing.premiumLocation || 0);

  // Financial data
  const hasFinancialData = listing.monthlyRevenue ||
    listing.expenseMaterial || listing.expenseLabor || listing.expenseRent ||
    listing.expenseMaintenance || listing.expenseUtility || listing.expenseOther ||
    listing.monthlyProfit;

  const investmentTotal = listing.deposit + (listing.premiumNone ? 0 : listing.premium);

  // ROI calculation
  const hasROI = investmentTotal > 0 && listing.monthlyProfit && listing.monthlyProfit > 0;
  const roiMonths = hasROI ? investmentTotal / listing.monthlyProfit! : 0;

  // Price history
  const hasPriceHistory = listing.priceHistory && listing.priceHistory.length > 0;

  // Field label mapping
  const fieldLabels: Record<string, string> = {
    deposit: "보증금",
    monthlyRent: "월세",
    premium: "권리금",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <Breadcrumb items={[
        { label: "매물검색", href: "/listings" },
        { label: listing.category?.name || "매물" },
      ]} />

      {/* ===== 1. 사진 갤러리 (탭 분류) ===== */}
      {listing.images.length > 1 && (
        <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
          {IMAGE_TABS.map((tab) => {
            const count = imageCounts[tab.key] || 0;
            if (tab.key !== "ALL" && count === 0) return null;
            return (
              <button
                key={tab.key}
                onClick={() => setImageTab(tab.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  imageTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label} {count > 0 && <span className="ml-0.5 opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden mb-4 -mx-4 md:mx-0 md:rounded-xl rounded-none">
        {filteredImages.length > 0 ? (
          <>
            <Image
              src={filteredImages[currentImage]?.url || listing.images[0].url}
              alt={`매물 사진 ${currentImage + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
              priority={currentImage === 0}
            />
            {filteredImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((p) => (p > 0 ? p - 1 : filteredImages.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 bg-black/40 text-white rounded-full flex items-center justify-center active:bg-black/60 touch-manipulation"
                  aria-label="이전 사진"
                >
                  &lt;
                </button>
                <button
                  onClick={() => setCurrentImage((p) => (p < filteredImages.length - 1 ? p + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 bg-black/40 text-white rounded-full flex items-center justify-center active:bg-black/60 touch-manipulation"
                  aria-label="다음 사진"
                >
                  &gt;
                </button>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentImage + 1} / {filteredImages.length}
                </div>
              </>
            )}
          </>
        ) : filteredImages.length === 0 && imageTab !== "ALL" ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            해당 카테고리의 사진이 없습니다
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm md:text-lg">
            사진 없음
          </div>
        )}
      </div>

      {/* ===== 2. 테마 태그 + TierBadge ===== */}
      {listing.themes.length > 0 && (
        <div className="flex gap-2 mb-3">
          {listing.themes.map((t) => (
            <span key={t} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              {t}
            </span>
          ))}
        </div>
      )}

      {listing.featuredTier && listing.featuredTier !== "FREE" && (
        <div className="mb-3">
          <TierBadge tier={listing.featuredTier} />
        </div>
      )}

      {/* ===== 3. 카테고리/상호명/주소 ===== */}
      <div className="text-sm text-gray-500 mb-1">
        {listing.category?.icon} {listing.category?.name}
        {listing.subCategory && ` > ${listing.subCategory.name}`}
        {listing.brandType === "FRANCHISE" && (
          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">프랜차이즈</span>
        )}
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">
        {listing.storeName || listing.addressRoad || "매물 상세"}
      </h1>
      <p className="text-sm text-gray-500 mb-4">
        {listing.addressRoad}
        {listing.addressDetail && ` ${listing.addressDetail}`}
      </p>

      {/* ===== 4. 가격 요약 ===== */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4 sm:text-center">
          <div className="flex justify-between sm:block">
            <p className="text-xs text-gray-400 sm:mb-1">보증금</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{fmt(listing.deposit)}만</p>
          </div>
          <div className="flex justify-between sm:block">
            <p className="text-xs text-gray-400 sm:mb-1">월세</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{fmt(listing.monthlyRent)}만</p>
          </div>
          <div className="flex justify-between sm:block">
            <p className="text-xs text-gray-400 sm:mb-1">권리금</p>
            <p className="text-base sm:text-lg font-bold text-blue-600">
              {listing.premiumNone ? "무권리" : `${fmt(listing.premium)}만`}
              {listing.premiumNegotiable && <span className="text-xs ml-1">(협의)</span>}
            </p>
          </div>
        </div>
        {listing.maintenanceFee !== null && (
          <p className="text-xs text-gray-400 text-center mt-3 pt-3 border-t border-gray-200 sm:border-0 sm:pt-0">
            관리비 {fmt(listing.maintenanceFee)}만원
          </p>
        )}
      </div>

      {/* ===== 5. 권리금 해부하기 ===== */}
      {hasPremiumBreakdown && (
        <Section title="권리금 해부하기">
          <div className="space-y-4">
            {/* 비율 바 */}
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
              {listing.premiumBusiness != null && listing.premiumBusiness > 0 && premiumTotal > 0 && (
                <div
                  className="bg-blue-500 transition-all"
                  style={{ width: `${(listing.premiumBusiness / premiumTotal) * 100}%` }}
                  title={`영업권리금 ${((listing.premiumBusiness / premiumTotal) * 100).toFixed(1)}%`}
                />
              )}
              {listing.premiumFacility != null && listing.premiumFacility > 0 && premiumTotal > 0 && (
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${(listing.premiumFacility / premiumTotal) * 100}%` }}
                  title={`시설권리금 ${((listing.premiumFacility / premiumTotal) * 100).toFixed(1)}%`}
                />
              )}
              {listing.premiumLocation != null && listing.premiumLocation > 0 && premiumTotal > 0 && (
                <div
                  className="bg-amber-500 transition-all"
                  style={{ width: `${(listing.premiumLocation / premiumTotal) * 100}%` }}
                  title={`바닥권리금 ${((listing.premiumLocation / premiumTotal) * 100).toFixed(1)}%`}
                />
              )}
            </div>

            {/* 범례 */}
            <div className="space-y-3">
              <PremiumItem
                color="bg-blue-500"
                label="영업권리금"
                value={listing.premiumBusiness}
                total={premiumTotal}
                desc={listing.premiumBusinessDesc}
              />
              <PremiumItem
                color="bg-emerald-500"
                label="시설권리금"
                value={listing.premiumFacility}
                total={premiumTotal}
                desc={listing.premiumFacilityDesc}
              />
              <PremiumItem
                color="bg-amber-500"
                label="바닥권리금"
                value={listing.premiumLocation}
                total={premiumTotal}
                desc={listing.premiumLocationDesc}
              />
            </div>

            {/* 합계 */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-sm font-bold text-gray-900">합계</span>
              <span className="text-base font-bold text-blue-600">{fmt(premiumTotal)}만원</span>
            </div>
          </div>
        </Section>
      )}

      {/* ===== 6. 기본 정보 ===== */}
      <Section title="기본 정보">
        <InfoGrid>
          {listing.areaPyeong && <InfoItem label="면적" value={`${listing.areaPyeong}평 (${listing.areaSqm}m²)`} />}
          {listing.currentFloor && (
            <InfoItem label="층수" value={`${listing.isBasement ? "지하 " : ""}${listing.currentFloor}층 / ${listing.totalFloor}층`} />
          )}
          <InfoItem label="주차" value={listing.parkingNone ? "불가" : listing.parkingTotal ? `${listing.parkingTotal}대` : "-"} />
          <InfoItem label="운영형태" value={listing.brandType === "FRANCHISE" ? "프랜차이즈" : "개인"} />
        </InfoGrid>
      </Section>

      {/* ===== 7. 월간 재무현황 테이블 ===== */}
      {hasFinancialData && (
        <Section title="월간 재무현황">
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            {/* 투자금 & 매출 */}
            <div className="px-4 py-3 space-y-2">
              {investmentTotal > 0 && (
                <FinanceRow
                  label="투자금"
                  value={investmentTotal}
                  sub={`보증금 ${fmt(listing.deposit)} + 권리금 ${listing.premiumNone ? "0" : fmt(listing.premium)}`}
                  bold
                />
              )}
              {listing.monthlyRevenue != null && listing.monthlyRevenue > 0 && (
                <FinanceRow label="월 매출" value={listing.monthlyRevenue} bold />
              )}
            </div>

            {/* 지출 내역 */}
            {(listing.expenseMaterial || listing.expenseLabor || listing.expenseRent ||
              listing.expenseMaintenance || listing.expenseUtility || listing.expenseOther) && (
              <div className="border-t border-gray-200 px-4 py-3 space-y-2">
                <p className="text-xs text-gray-400 mb-1">지출 내역</p>
                {listing.expenseMaterial != null && listing.expenseMaterial > 0 && (
                  <FinanceRow label="재료비" value={listing.expenseMaterial} revenue={listing.monthlyRevenue} />
                )}
                {listing.expenseLabor != null && listing.expenseLabor > 0 && (
                  <FinanceRow label="인건비" value={listing.expenseLabor} revenue={listing.monthlyRevenue} />
                )}
                {listing.expenseRent != null && listing.expenseRent > 0 && (
                  <FinanceRow label="월세" value={listing.expenseRent} revenue={listing.monthlyRevenue} />
                )}
                {listing.expenseMaintenance != null && listing.expenseMaintenance > 0 && (
                  <FinanceRow label="관리비" value={listing.expenseMaintenance} revenue={listing.monthlyRevenue} />
                )}
                {listing.expenseUtility != null && listing.expenseUtility > 0 && (
                  <FinanceRow label="공과금" value={listing.expenseUtility} revenue={listing.monthlyRevenue} />
                )}
                {listing.expenseOther != null && listing.expenseOther > 0 && (
                  <FinanceRow label="기타" value={listing.expenseOther} revenue={listing.monthlyRevenue} />
                )}
              </div>
            )}

            {/* 순이익 */}
            {listing.monthlyProfit != null && listing.monthlyProfit > 0 && (
              <div className="border-t-2 border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-700">순이익</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-blue-700">{fmt(listing.monthlyProfit)}만</span>
                    {listing.monthlyRevenue != null && listing.monthlyRevenue > 0 && (
                      <span className="text-xs text-blue-500 ml-1">
                        ({((listing.monthlyProfit / listing.monthlyRevenue) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                {listing.profitDescription && (
                  <p className="text-xs text-gray-500 mt-1">{listing.profitDescription}</p>
                )}
              </div>
            )}

            {/* 인력구성 */}
            {(listing.operationType || listing.familyWorkers || listing.employeesFull || listing.employeesPart) && (
              <div className="border-t border-gray-200 px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">인력구성</p>
                <p className="text-sm text-gray-700">
                  {listing.operationType === "SOLO" && "혼자 운영"}
                  {listing.operationType === "FAMILY" && `가족/동업자${listing.familyWorkers ? ` ${listing.familyWorkers}명` : ""}`}
                  {listing.operationType === "EMPLOYEE" && (
                    <>
                      직원 고용
                      {listing.employeesFull != null && listing.employeesFull > 0 && ` (정직원 ${listing.employeesFull}명`}
                      {listing.employeesPart != null && listing.employeesPart > 0 && `${listing.employeesFull ? ", " : " ("}파트타임 ${listing.employeesPart}명`}
                      {(listing.employeesFull || listing.employeesPart) && ")"}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ===== 8. 투자금 회수 기간 ===== */}
      {hasROI && (
        <Section title="투자금 회수 예상">
          <div className={`rounded-xl p-4 ${
            roiMonths <= 12 ? "bg-green-50" : roiMonths <= 24 ? "bg-amber-50" : "bg-red-50"
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {roiMonths <= 12 ? "\uD83D\uDCC8" : roiMonths <= 24 ? "\u23F3" : "\u26A0\uFE0F"}
              </span>
              <span className={`text-lg font-bold ${
                roiMonths <= 12 ? "text-green-700" : roiMonths <= 24 ? "text-amber-700" : "text-red-700"
              }`}>
                약 {roiMonths.toFixed(1)}개월
              </span>
            </div>
            <p className="text-sm text-gray-600">
              투자금 {fmt(investmentTotal)}만 / 월순이익 {fmt(listing.monthlyProfit!)}만 = 약 {roiMonths.toFixed(1)}개월
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />12개월 이내</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />12~24개월</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />24개월 초과</span>
            </div>
          </div>
        </Section>
      )}

      {/* ===== 9. 지역 시세 비교 ===== */}
      {areaStats && (
        <Section title={`지역 시세 비교 (${areaStats.area} 내 ${areaStats.count}개 매물 기준)`}>
          {areaStats.count >= 3 ? (
            <div className="space-y-4">
              <CompareGauge label="보증금" mine={listing.deposit} avg={areaStats.avgDeposit} unit="만" />
              <CompareGauge label="월세" mine={listing.monthlyRent} avg={areaStats.avgMonthlyRent} unit="만" />
              {!listing.premiumNone && (
                <CompareGauge label="권리금" mine={listing.premium} avg={areaStats.avgPremium} unit="만" />
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              비교 데이터가 부족합니다 (동일 지역 매물 3개 미만)
            </p>
          )}
        </Section>
      )}

      {/* ===== 10. 매물 설명 ===== */}
      {listing.description && (
        <Section title="매물 설명">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
        </Section>
      )}

      {/* ===== 11. 가격 변동 이력 ===== */}
      {hasPriceHistory && (
        <Section title="가격 변동 이력">
          <div className="relative pl-6 space-y-4">
            {/* 타임라인 라인 */}
            <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-200" />
            {listing.priceHistory!.map((h) => {
              const diff = h.newValue - h.oldValue;
              const pct = h.oldValue > 0 ? ((diff / h.oldValue) * 100).toFixed(0) : "0";
              const isDown = diff < 0;
              return (
                <div key={h.id} className="relative">
                  <div className={`absolute left-[-19px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    isDown ? "bg-green-500" : "bg-red-500"
                  }`} />
                  <div className="text-xs text-gray-400 mb-0.5">
                    {new Date(h.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{fieldLabels[h.field] || h.field}</span>{" "}
                    {fmt(h.oldValue)}만 → {fmt(h.newValue)}만{" "}
                    <span className={`text-xs font-medium ${isDown ? "text-green-600" : "text-red-600"}`}>
                      ({isDown ? "▼" : "▲"}{Math.abs(Number(pct))}%)
                    </span>
                  </p>
                </div>
              );
            })}
            {/* 최초 등록 */}
            <div className="relative">
              <div className="absolute left-[-19px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-gray-400" />
              <div className="text-xs text-gray-400 mb-0.5">
                {new Date(listing.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
              </div>
              <p className="text-sm text-gray-500">최초 등록</p>
            </div>
          </div>
        </Section>
      )}

      {/* ===== 12. 판매자 정보 ===== */}
      <Section title="판매자">
        <div className="flex items-center gap-3">
          {listing.user.image ? (
            <Image src={listing.user.image} alt={`${listing.user.name || '판매자'} 프로필 사진`} width={40} height={40} className="rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
              {listing.user.name?.[0] || "U"}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/users/${listing.user.id}`} className="font-medium text-gray-900 hover:text-blue-600">{listing.user.name || "판매자"}</Link>
              {listing.sellerTrust && listing.sellerTrust.reviewCount > 0 && (
                <SellerTrustBadge avgRating={listing.sellerTrust.avgRating} reviewCount={listing.sellerTrust.reviewCount} />
              )}
            </div>
            {listing.contactPublic && listing.user.phone && (
              <p className="text-sm text-blue-600">{listing.user.phone}</p>
            )}
          </div>
        </div>
      </Section>

      {/* ===== 13. 위치 (카카오맵) ===== */}
      {listing.latitude && listing.longitude && (
        <Section title="위치">
          <div className="space-y-3">
            <KakaoMap latitude={listing.latitude} longitude={listing.longitude} level={3} className="h-[300px] md:h-[400px]" showInfoWindow={true} address={listing.addressRoad || ""} />
            <p className="text-sm text-gray-600">{listing.addressRoad}{listing.addressDetail && ` ${listing.addressDetail}`}</p>
          </div>
        </Section>
      )}

      {/* ===== 14. 상권분석 ===== */}
      {listing.latitude && listing.longitude && (
        <Section title="상권분석">
          <CommercialDistrictSection latitude={listing.latitude} longitude={listing.longitude} categoryId={listing.category?.id} listingId={listing.id} />
        </Section>
      )}

      {/* ===== 15. 광고 관리 (본인 매물) ===== */}
      {session?.user?.id === listing.user.id && (
        <Section title="광고 관리">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-700 mb-3">광고 상품으로 매물의 노출을 높이고 빠른 거래를 경험하세요</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={handleBump} disabled={bumping} className="flex-1 py-2.5 px-4 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {bumping ? "처리 중..." : "끌어올리기"}
              </button>
              <Link href={`/pricing?listingId=${listing.id}`} className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm">
                광고 상품 보기
              </Link>
            </div>
          </div>
        </Section>
      )}

      {/* ===== 16. 블라인드 리뷰 ===== */}
      <ReviewSection listingId={listing.id} sellerId={listing.user.id} />

      {/* ===== 17. CrossSellSection ===== */}
      <CrossSellSection type="listing" id={listing.id} />

      {/* ===== 18. 최근 본 매물 ===== */}
      {recentlyViewed.length > 0 && (
        <Section title="최근 본 매물">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
            {recentlyViewed.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className="shrink-0 w-40 bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.storeName} fill sizes="160px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      {item.categoryIcon || "사진 없음"}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 truncate">{item.storeName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{item.addressRoad}</p>
                  <p className="text-xs font-bold text-blue-600 mt-1">
                    {item.premiumNone ? "무권리" : `${item.premium.toLocaleString()}만`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ===== 19. 하단 고정바 (모바일: 가격요약 추가) ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 md:static md:border-0 md:p-0 md:mt-6">
        {/* 모바일 가격 요약 (md 이상에서 숨김) */}
        <div className="px-4 pt-2 pb-1 md:hidden">
          <p className="text-xs text-gray-700 text-center">
            <span className="font-medium">권리금 </span>
            <span className="font-bold text-blue-600">
              {listing.premiumNone ? "무권리" : `${fmt(listing.premium)}만`}
            </span>
            <span className="mx-1 text-gray-300">·</span>
            <span className="font-medium">보증금 </span>
            <span className="font-bold">{fmt(listing.deposit)}만</span>
            <span className="mx-1 text-gray-300">·</span>
            <span className="font-medium">월세 </span>
            <span className="font-bold">{fmt(listing.monthlyRent)}만</span>
          </p>
        </div>
        <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-3 px-4 py-2 md:px-0 md:py-0">
          <button
            onClick={handleFavorite}
            aria-label={favorited ? "관심매물 해제" : "관심매물 등록"}
            className={`min-w-[60px] px-3 md:px-4 py-3 rounded-xl border font-medium transition-colors text-sm md:text-base ${favorited ? "border-red-300 text-red-500 bg-red-50" : "border-gray-300 text-gray-600 hover:bg-gray-50 active:bg-gray-100"}`}
          >
            {favorited ? "♥" : "♡"} <span className="hidden sm:inline">{listing.favoriteCount}</span>
          </button>
          <ShareButton
            listingId={listing.id}
            title={listing.storeName || listing.addressRoad || "매물 상세"}
            imageUrl={listing.images.length > 0 ? listing.images[0].url : undefined}
          />
          <Link href={session ? `/chat?listingId=${listing.id}` : "/login"} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium text-center hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm md:text-base">
            채팅하기
          </Link>
        </div>
      </div>

      {/* ===== 20. 조회수/관심/등록일 ===== */}
      <div className="text-xs text-gray-400 text-center mt-4">
        조회 {listing.viewCount} · 관심 {listing.favoriteCount} · {new Date(listing.createdAt).toLocaleDateString("ko-KR")}
      </div>
    </div>
  );
}

/* ============================================
   Sub-components
   ============================================ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-gray-100">
      <h2 className="font-bold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex text-sm">
      <span className="w-20 sm:w-16 text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

function PremiumItem({ color, label, value, total, desc }: {
  color: string;
  label: string;
  value: number | null;
  total: number;
  desc: string | null;
}) {
  if (!value || value <= 0) return null;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div className="flex items-start gap-3">
      <div className={`w-3 h-3 rounded-full ${color} mt-1 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-900">
            {value.toLocaleString()}만 <span className="text-xs text-gray-400">({pct}%)</span>
          </span>
        </div>
        {desc && <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>}
      </div>
    </div>
  );
}

function FinanceRow({ label, value, revenue, sub, bold }: {
  label: string;
  value: number;
  revenue?: number | null;
  sub?: string;
  bold?: boolean;
}) {
  const pct = revenue && revenue > 0 ? ((value / revenue) * 100).toFixed(1) : null;
  return (
    <div>
      <div className="flex justify-between items-center">
        <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-600"}`}>{label}</span>
        <div className="text-right">
          <span className={`text-sm ${bold ? "font-bold text-gray-900" : "text-gray-700"}`}>
            {value.toLocaleString()}만
          </span>
          {pct && (
            <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
          )}
        </div>
      </div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function CompareGauge({ label, mine, avg, unit }: {
  label: string;
  mine: number;
  avg: number;
  unit: string;
}) {
  if (avg <= 0) return null;
  const diffPct = avg > 0 ? ((mine - avg) / avg) * 100 : 0;
  const isCheaper = diffPct < 0;
  const maxVal = Math.max(mine, avg) * 1.2 || 1;
  const myPos = Math.min((mine / maxVal) * 100, 100);
  const avgPos = Math.min((avg / maxVal) * 100, 100);

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-medium ${isCheaper ? "text-green-600" : "text-red-600"}`}>
          {diffPct > 0 ? "+" : ""}{diffPct.toFixed(0)}%
        </span>
      </div>
      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
        {/* Average marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
          style={{ left: `${avgPos}%` }}
        />
        {/* My bar */}
        <div
          className={`absolute top-1 bottom-1 left-0 rounded-full ${isCheaper ? "bg-green-400" : "bg-red-400"}`}
          style={{ width: `${myPos}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-500">
          이 매물 <span className="font-medium">{mine.toLocaleString()}{unit}</span>
        </span>
        <span className="text-[10px] text-gray-400">
          평균 {avg.toLocaleString()}{unit}
        </span>
      </div>
    </div>
  );
}
