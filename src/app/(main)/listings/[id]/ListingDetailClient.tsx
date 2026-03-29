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
import { ListingUpsellBanner } from "@/components/promotion/PromotionCTA";

const ReviewSection = dynamic(() => import("@/components/listing/ReviewSection"), {
  loading: () => <div className="py-4 border-b border-gray-100 dark:border-gray-700"><div className="h-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /></div>,
});

const KakaoMap = dynamic(() => import("@/components/map/KakaoMap"), {
  loading: () => <div className="h-[300px] md:h-[400px] bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />,
});

const ShareButton = dynamic(() => import("@/components/listing/ShareButton"), {
  ssr: false,
});

const CommercialDistrictSection = dynamic(() => import("@/components/listing/CommercialDistrictSection"), {
  loading: () => <div className="py-4 border-b border-gray-100 dark:border-gray-700"><div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" /></div>,
});

const RentalTrendSection = dynamic(() => import("@/components/listing/RentalTrendSection"), {
  loading: () => <div className="py-4 border-b border-gray-100 dark:border-gray-700"><div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" /></div>,
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
  regionCode?: string;
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
  user: { id: string; name: string | null; image: string | null; phone: string | null; createdAt: string; businessVerified?: boolean };
  _count: { favorites: number; chatRooms: number };
  featuredTier?: string;
  sellerTrust?: { avgRating: number; reviewCount: number };
  priceHistory?: { id: string; field: string; oldValue: number; newValue: number; createdAt: string }[];
  regionStats?: { avgViewCount: number; avgFavoriteCount: number; totalCount: number; region: string } | null;
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
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [bumpSubscription, setBumpSubscription] = useState<{
    id: string;
    frequency: string;
    nextBumpAt: string;
  } | null>(null);
  const [sellerReportStatus, setSellerReportStatus] = useState<"loading" | "purchased" | "not_purchased">("loading");
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

  // Fetch bump subscription status (for owner)
  useEffect(() => {
    if (!session?.user?.id || !listing || session.user.id !== listing.user.id) return;
    fetch("/api/bump-subscriptions")
      .then((r) => r.json())
      .then((data) => {
        if (data.subscriptions && data.subscriptions.length > 0) {
          const activeSub = data.subscriptions.find(
            (sub: any) => sub.listingId === listing.id && sub.status === "ACTIVE"
          );
          if (activeSub) {
            setBumpSubscription({
              id: activeSub.id,
              frequency: activeSub.frequency,
              nextBumpAt: activeSub.nextBumpAt,
            });
          }
        }
      })
      .catch(() => {});
  }, [session?.user?.id, listing]);

  // Fetch seller report status (for owner)
  useEffect(() => {
    if (!session?.user?.id || !listing || session.user.id !== listing.user.id) {
      setSellerReportStatus("not_purchased");
      return;
    }
    fetch(`/api/reports/seller-analysis?listingId=${listing.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSellerReportStatus(data.hasReport ? "purchased" : "not_purchased");
      })
      .catch(() => setSellerReportStatus("not_purchased"));
  }, [session?.user?.id, listing]);

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
    } catch (e) {
      console.error("[ListingDetail] Failed to save recently viewed:", e);
    }
  }, [listing?.id]);

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
        router.refresh();
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

  async function handleStatusChange(newStatus: string) {
    if (!session || !listing) return;

    const statusLabels: Record<string, string> = {
      ACTIVE: "판매중",
      RESERVED: "예약중",
      SOLD: "거래완료",
    };

    const label = statusLabels[newStatus] || newStatus;
    const confirmed = confirm(`매물 상태를 "${label}"로 변경하시겠습니까?`);
    if (!confirmed) return;

    setStatusUpdating(true);
    setShowStatusMenu(false);

    try {
      const res = await fetch(`/api/listings/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success("매물 상태가 변경되었습니다.");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "상태 변경에 실패했습니다.");
      }
    } catch {
      toast.error("상태 변경 요청 중 오류가 발생했습니다.");
    } finally {
      setStatusUpdating(false);
    }
  }

  function getAvailableStatusTransitions(currentStatus: string): { value: string; label: string; color: string }[] {
    switch (currentStatus) {
      case "ACTIVE":
        return [
          { value: "RESERVED", label: "예약중", color: "text-orange-700 dark:text-orange-400" },
          { value: "SOLD", label: "거래완료", color: "text-gray-700 dark:text-gray-300" },
        ];
      case "RESERVED":
        return [
          { value: "ACTIVE", label: "판매중", color: "text-green-700 dark:text-green-400" },
          { value: "SOLD", label: "거래완료", color: "text-gray-700 dark:text-gray-300" },
        ];
      case "SOLD":
        return [
          { value: "ACTIVE", label: "판매중", color: "text-green-700 dark:text-green-400" },
        ];
      case "DRAFT":
        return [
          { value: "ACTIVE", label: "매물 공개하기", color: "text-green-700 dark:text-green-400" },
        ];
      case "EXPIRED":
        return [
          { value: "ACTIVE", label: "재등록하기", color: "text-blue-700 dark:text-blue-400" },
        ];
      default:
        return [];
    }
  }

  function getStatusDisplay(status: string): { label: string; bgColor: string; textColor: string } {
    switch (status) {
      case "ACTIVE":
        return { label: "판매중", bgColor: "bg-green-100 dark:bg-green-900", textColor: "text-green-700 dark:text-green-400" };
      case "RESERVED":
        return { label: "예약중", bgColor: "bg-orange-100 dark:bg-orange-900", textColor: "text-orange-700 dark:text-orange-400" };
      case "SOLD":
        return { label: "거래완료", bgColor: "bg-gray-200 dark:bg-gray-700", textColor: "text-gray-500 dark:text-gray-400" };
      case "DRAFT":
        return { label: "임시저장", bgColor: "bg-yellow-100 dark:bg-yellow-900", textColor: "text-yellow-700 dark:text-yellow-400" };
      case "EXPIRED":
        return { label: "만료됨", bgColor: "bg-red-100 dark:bg-red-900", textColor: "text-red-700 dark:text-red-400" };
      default:
        return { label: status, bgColor: "bg-gray-100 dark:bg-gray-700", textColor: "text-gray-600 dark:text-gray-400" };
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">매물을 불러올 수 없습니다.</p>
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
  ) && ((listing.premiumBusiness || 0) + (listing.premiumFacility || 0) + (listing.premiumLocation || 0)) > 0;
  const premiumTotal = (listing.premiumBusiness || 0) + (listing.premiumFacility || 0) + (listing.premiumLocation || 0);

  // Financial data
  const hasFinancialData = listing.monthlyRevenue ||
    listing.expenseMaterial || listing.expenseLabor || listing.expenseRent ||
    listing.expenseMaintenance || listing.expenseUtility || listing.expenseOther ||
    listing.monthlyProfit;

  const investmentTotal = listing.deposit + (listing.premiumNone ? 0 : listing.premium);

  // Price history
  const hasPriceHistory = listing.priceHistory && listing.priceHistory.length > 0;

  // Field label mapping
  const fieldLabels: Record<string, string> = {
    deposit: "보증금",
    monthlyRent: "월세",
    premium: "권리금",
  };

  // Is owner?
  const isOwner = session?.user?.id === listing.user.id;
  // Is the listing in a non-standard state?
  const isDraft = listing.status === "DRAFT";
  const isExpired = listing.status === "EXPIRED";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6 dark:bg-gray-900">
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <Breadcrumb items={[
        { label: "매물검색", href: "/listings" },
        { label: listing.category?.name || "매물" },
      ]} />

      {/* ===== DRAFT/EXPIRED 상태 안내 배너 ===== */}
      {isOwner && isDraft && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700 rounded-xl">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">이 매물은 아직 공개되지 않은 임시저장 상태입니다.</p>
          <button
            onClick={() => handleStatusChange("ACTIVE")}
            disabled={statusUpdating}
            className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {statusUpdating ? "처리 중..." : "매물 공개하기"}
          </button>
        </div>
      )}
      {isOwner && isExpired && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 rounded-xl">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">이 매물은 기간이 만료되었습니다. 재등록하면 다시 노출됩니다.</p>
          <button
            onClick={() => handleStatusChange("ACTIVE")}
            disabled={statusUpdating}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {statusUpdating ? "처리 중..." : "재등록하기"}
          </button>
        </div>
      )}

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
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {tab.label} {count > 0 && <span className="ml-0.5 opacity-70">{count}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-4 -mx-4 md:mx-0 md:rounded-xl rounded-none">
        {filteredImages.length > 0 ? (
          <>
            <Image
              src={filteredImages[currentImage]?.url || listing.images[0]?.url || ""}
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
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
            해당 카테고리의 사진이 없습니다
          </div>
        ) : isOwner ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">사진을 등록하면 조회수가 높아집니다</p>
            <Link
              href="/sell/edit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              사진 추가하기
            </Link>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-sm md:text-lg">
            사진 없음
          </div>
        )}
      </div>

      {/* ===== 1-1. 사진 썸네일 바 (5장 이상) ===== */}
      {filteredImages.length >= 5 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-2 -mx-1 px-1">
          {filteredImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setCurrentImage(idx)}
              className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                currentImage === idx ? "border-blue-500" : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Image
                src={img.url}
                alt={`썸네일 ${idx + 1}`}
                width={64}
                height={48}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* ===== 2. 테마 태그 + TierBadge ===== */}
      {listing.themes.length > 0 && (
        <div className="flex gap-2 mb-3">
          {listing.themes.map((t) => (
            <span key={t} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
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
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        {listing.category?.icon} {listing.category?.name}
        {listing.subCategory && ` > ${listing.subCategory.name}`}
        {listing.brandType === "FRANCHISE" && (
          <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-400 text-xs rounded">프랜차이즈</span>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {listing.storeName || listing.addressRoad || "매물 상세"}
        </h1>
        {listing.status === "ACTIVE" && (
          <span className="shrink-0 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">판매중</span>
        )}
        {listing.status === "RESERVED" && (
          <span className="shrink-0 px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">예약중</span>
        )}
        {listing.status === "SOLD" && (
          <span className="shrink-0 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium rounded-full">거래완료</span>
        )}
        {listing.status === "DRAFT" && (
          <span className="shrink-0 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">임시저장</span>
        )}
        {listing.status === "EXPIRED" && (
          <span className="shrink-0 px-2 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">만료됨</span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        {listing.addressRoad}
        {listing.addressDetail && ` ${listing.addressDetail}`}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        등록 {(() => { const days = Math.floor((Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24)); return days === 0 ? "오늘" : `${days}일째`; })()}
        <span className="mx-1">·</span>조회 {listing.viewCount}
        <span className="mx-1">·</span>관심 {listing._count.favorites}
      </p>

      {/* ===== 4. 가격 요약 ===== */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4 sm:text-center">
          <div className="flex justify-between sm:block">
            <p className="text-xs text-gray-400 dark:text-gray-500 sm:mb-1">보증금</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{fmt(listing.deposit)}만</p>
          </div>
          <div className="flex justify-between sm:block">
            <p className="text-xs text-gray-400 dark:text-gray-500 sm:mb-1">월세</p>
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{fmt(listing.monthlyRent)}만</p>
          </div>
          <div className="flex justify-between sm:block">
            <p className="text-xs text-gray-400 dark:text-gray-500 sm:mb-1">권리금</p>
            <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
              {listing.premiumNone ? "무권리" : `${fmt(listing.premium)}만`}
              {listing.premiumNegotiable && <span className="text-xs ml-1">(협의)</span>}
            </p>
          </div>
        </div>
        {listing.maintenanceFee !== null && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 sm:border-0 sm:pt-0">
            관리비 {fmt(listing.maintenanceFee)}만원
          </p>
        )}
      </div>

      {/* ===== 4-1. 핵심 투자 지표 카드 ===== */}
      {(() => {
        const cards: { icon: string; label: string; value: string; color: string }[] = [];
        if (listing.monthlyRevenue && listing.monthlyRevenue > 0) {
          cards.push({ icon: "📊", label: "월매출", value: `${fmt(listing.monthlyRevenue)}만`, color: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300" });
        }
        if (listing.monthlyProfit && listing.monthlyRevenue && listing.monthlyRevenue > 0) {
          const profitRate = ((listing.monthlyProfit / listing.monthlyRevenue) * 100).toFixed(0);
          cards.push({ icon: "💰", label: "순이익률", value: `${profitRate}%`, color: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" });
        }
        if (investmentTotal > 0 && listing.monthlyProfit && listing.monthlyProfit > 0) {
          const months = (investmentTotal / listing.monthlyProfit).toFixed(0);
          cards.push({ icon: "⏱", label: "회수기간", value: `${months}개월`, color: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300" });
          const annualReturn = ((listing.monthlyProfit * 12) / investmentTotal * 100).toFixed(0);
          cards.push({ icon: "📈", label: "연수익률", value: `${annualReturn}%`, color: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300" });
        }
        if (cards.length === 0) return null;
        return (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {cards.map((c) => (
              <div key={c.label} className={`rounded-xl p-3 ${c.color}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{c.icon}</span>
                  <span className="text-xs font-medium opacity-80">{c.label}</span>
                </div>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ===== 5. 권리금 해부하기 ===== */}
      {hasPremiumBreakdown && (
        <Section title="권리금 해부하기">
          <div className="space-y-4">
            {/* 비율 바 */}
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
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
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-bold text-gray-900 dark:text-white">합계</span>
              <span className="text-base font-bold text-blue-600 dark:text-blue-400">{fmt(premiumTotal)}만원</span>
            </div>
          </div>
        </Section>
      )}

      {/* ===== 6. 기본 정보 ===== */}
      <Section title="기본 정보">
        <InfoGrid>
          {listing.areaPyeong && <InfoItem label="면적" value={`${listing.areaPyeong}평${listing.areaSqm ? ` (${listing.areaSqm}m²)` : ""}`} />}
          {listing.currentFloor && (
            <InfoItem label="층수" value={`${listing.isBasement ? "지하 " : ""}${listing.currentFloor}층 / ${listing.totalFloor}층`} />
          )}
          <InfoItem label="주차" value={listing.parkingNone ? "불가" : listing.parkingTotal ? `${listing.parkingTotal}대` : "-"} />
          <InfoItem label="운영형태" value={listing.brandType === "FRANCHISE" ? "프랜차이즈" : "개인"} />
        </InfoGrid>
      </Section>

      {/* ===== 7. 평균 매출정보 (도넛 차트) ===== */}
      {hasFinancialData && listing.monthlyRevenue != null && listing.monthlyRevenue > 0 && (() => {
        const rev = listing.monthlyRevenue!;
        const expenses = [
          { label: "재료비", value: listing.expenseMaterial || 0, color: "#9CA3AF" },
          { label: "인건비", value: listing.expenseLabor || 0, color: "#EF4444" },
          { label: "월세", value: listing.expenseRent || 0, color: "#22C55E" },
          { label: "관리비", value: listing.expenseMaintenance || 0, color: "#F59E0B" },
          { label: "공과금", value: listing.expenseUtility || 0, color: "#F97316" },
          { label: "기타경비", value: listing.expenseOther || 0, color: "#6366F1" },
        ].filter(e => e.value > 0);
        const totalExpense = expenses.reduce((s, e) => s + e.value, 0);
        const profit = listing.monthlyProfit || (rev - totalExpense);
        const profitPct = rev > 0 ? ((profit / rev) * 100).toFixed(0) : "0";
        const segments = [
          ...expenses.map(e => ({ ...e, pct: rev > 0 ? (e.value / rev) * 100 : 0 })),
          { label: "월수익", value: profit, color: "#3B82F6", pct: rev > 0 ? (profit / rev) * 100 : 0 },
        ].filter(s => s.pct > 0);

        // SVG 도넛 차트 데이터
        const radius = 80;
        const cx = 100;
        const cy = 100;
        const strokeWidth = 32;
        const circumference = 2 * Math.PI * radius;
        let cumulativePct = 0;

        return (
          <Section title="평균 매출정보">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">허위 기재 시 원아웃 제도로 영구 정지 당할 수 있습니다.</p>
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* 도넛 차트 */}
              <div className="relative flex-shrink-0">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  {/* 배경 원 */}
                  <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
                  {/* 세그먼트 */}
                  {segments.map((seg, i) => {
                    const dashLen = (seg.pct / 100) * circumference;
                    const dashOffset = -(cumulativePct / 100) * circumference;
                    cumulativePct += seg.pct;
                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                        strokeDashoffset={dashOffset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </svg>
                {/* 중앙 텍스트 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{fmt(rev)}만원</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">월 매출</span>
                </div>
              </div>

              {/* 항목별 상세 */}
              <div className="flex-1 w-full space-y-1">
                {segments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">{seg.label}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(seg.pct, 100)}%`, backgroundColor: seg.color }} />
                      </div>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200 w-20 text-right">{fmt(seg.value)}만</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right">{seg.pct.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 투자금 & 순이익 요약 */}
            <div className="mt-6 space-y-3">
              {investmentTotal > 0 && (
                <div className="flex justify-between items-center py-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">투자금</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-gray-900 dark:text-white">{fmt(investmentTotal)}만원</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(보증금 {fmt(listing.deposit)} + 권리금 {listing.premiumNone ? "0" : fmt(listing.premium)})</span>
                  </div>
                </div>
              )}

              {profit > 0 && (
                <div className="flex justify-between items-center py-3 border-t-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 rounded-lg px-4">
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-300">월 수익</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">+{fmt(profit)}만원 <span className="text-sm">{profitPct}%</span></span>
                </div>
              )}

              {listing.profitDescription && (
                <p className="text-xs text-gray-500 dark:text-gray-400 px-1">{listing.profitDescription}</p>
              )}
            </div>

            {/* 인력구성 */}
            {(listing.familyWorkers || listing.employeesFull || listing.employeesPart || listing.operationType !== "SOLO") && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">인력구성</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
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
          </Section>
        );
      })()}


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
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              비교 데이터가 부족합니다 (동일 지역 매물 3개 미만)
            </p>
          )}
        </Section>
      )}

      {/* ===== 10. 매물 설명 ===== */}
      {listing.description && (
        <Section title="매물 설명">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
        </Section>
      )}

      {/* ===== 11. 가격 변동 이력 ===== */}
      {hasPriceHistory && (
        <Section title="가격 변동 이력">
          <div className="relative pl-6 space-y-4">
            {/* 타임라인 라인 */}
            <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-gray-700" />
            {listing.priceHistory!.map((h) => {
              const diff = h.newValue - h.oldValue;
              const pct = h.oldValue > 0 ? ((diff / h.oldValue) * 100).toFixed(0) : "0";
              const isDown = diff < 0;
              return (
                <div key={h.id} className="relative">
                  <div className={`absolute left-[-19px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${
                    isDown ? "bg-green-500" : "bg-red-500"
                  }`} />
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                    {new Date(h.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{fieldLabels[h.field] || h.field}</span>{" "}
                    {fmt(h.oldValue)}만 → {fmt(h.newValue)}만{" "}
                    <span className={`text-xs font-medium ${isDown ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      ({isDown ? "▼" : "▲"}{Math.abs(Number(pct))}%)
                    </span>
                  </p>
                </div>
              );
            })}
            {/* 최초 등록 */}
            <div className="relative">
              <div className="absolute left-[-19px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 bg-gray-400 dark:bg-gray-500" />
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                {new Date(listing.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">최초 등록</p>
            </div>
          </div>
        </Section>
      )}

      {/* ===== 11-1. 지역 경쟁 분석 (소유자 전용) ===== */}
      {isOwner && listing.regionStats && (
        <Section title="지역 경쟁 분석">
          {listing.regionStats.totalCount >= 3 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                같은 지역 <span className="font-medium text-gray-900 dark:text-white">{listing.regionStats.region}</span>{" "}
                <span className="font-medium text-gray-900 dark:text-white">{listing.category?.name}</span> 매물{" "}
                <span className="font-medium text-blue-600 dark:text-blue-400">{listing.regionStats.totalCount}건</span> 평균 대비
              </p>
              <RegionalPerformanceItem
                label="조회수"
                mine={listing.viewCount}
                avg={listing.regionStats.avgViewCount}
              />
              <RegionalPerformanceItem
                label="관심"
                mine={listing._count.favorites}
                avg={listing.regionStats.avgFavoriteCount}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              비교 데이터 부족 (동일 지역·업종 매물 3건 미만)
            </p>
          )}
        </Section>
      )}

      {/* ===== 12. 판매자 정보 ===== */}
      <Section title="판매자">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            {listing.user.image ? (
              <Image src={listing.user.image} alt={`${listing.user.name || '판매자'} 프로필 사진`} width={48} height={48} className="rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg">
                {listing.user.name?.[0] || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/users/${listing.user.id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">{listing.user.name || "판매자"}</Link>
                {listing.user.businessVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    사업자 인증완료
                  </span>
                )}
                {listing.sellerTrust && listing.sellerTrust.reviewCount > 0 && (
                  <SellerTrustBadge avgRating={listing.sellerTrust.avgRating} reviewCount={listing.sellerTrust.reviewCount} />
                )}
              </div>
              {listing.contactPublic && listing.user.phone && (
                <a href={`tel:${listing.user.phone}`} className="text-sm text-blue-600 dark:text-blue-400 mt-1 hover:underline">{listing.user.phone}</a>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ===== 13. 위치 (카카오맵) ===== */}
      {listing.latitude && listing.longitude && (
        <Section title="위치">
          <div className="space-y-3">
            <KakaoMap latitude={listing.latitude} longitude={listing.longitude} level={3} className="h-[300px] md:h-[400px]" showInfoWindow={true} address={listing.addressRoad || ""} />
            <p className="text-sm text-gray-600 dark:text-gray-400">{listing.addressRoad}{listing.addressDetail && ` ${listing.addressDetail}`}</p>
          </div>
        </Section>
      )}

      {/* ===== 13-1. 매물 업셀 배너 (본인 매물일 때만, 유료 미구매) ===== */}
      {isOwner && !listing.featuredTier && (
        <div className="py-4">
          <ListingUpsellBanner />
        </div>
      )}

      {/* ===== 14. 상권분석 ===== */}
      {session && listing.latitude && listing.longitude && (
        <Section title="상권분석">
          <CommercialDistrictSection latitude={listing.latitude} longitude={listing.longitude} categoryId={listing.category?.id} categoryName={listing.category?.name} />
        </Section>
      )}

      {/* ===== 15. 지역 임대 시세 (한국부동산원 R-ONE) ===== */}
      {listing.addressJibun && (
        <Section title="">
          <RentalTrendSection
            regionCode={listing.regionCode || getRegionCodeFromAddress(listing.addressJibun)}
            categoryName={listing.category?.name}
            deposit={listing.deposit}
            monthlyRent={listing.monthlyRent}
            premium={listing.premium}
            premiumNone={listing.premiumNone}
          />
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
                className="shrink-0 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.storeName} fill sizes="160px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-xs">
                      {item.categoryIcon || "사진 없음"}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.storeName}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{item.addressRoad}</p>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {item.premiumNone ? "무권리" : `${item.premium.toLocaleString()}만`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* ===== 19. 하단 고정바 ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10 md:static md:border-0 md:p-0 md:mt-6">
        {isOwner ? (
          /* 소유자일 때: 매물 관리 바 (모바일 - 상태/수정/끌올 + 더보기 드롭다운) */
          <div className="max-w-3xl mx-auto px-4 py-3 relative">
            <div className="grid grid-cols-4 gap-2 md:flex md:items-center md:gap-2">
              {/* 상태 변경 드롭다운 */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={statusUpdating}
                  className={`w-full min-h-[44px] px-2 py-2 ${getStatusDisplay(listing.status).bgColor} ${getStatusDisplay(listing.status).textColor} rounded-xl font-medium hover:opacity-80 transition-opacity text-xs md:text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {statusUpdating ? "변경중..." : getStatusDisplay(listing.status).label}
                </button>

                {showStatusMenu && getAvailableStatusTransitions(listing.status).length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowStatusMenu(false)}
                    />
                    <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px] z-30">
                      {getAvailableStatusTransitions(listing.status).map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleStatusChange(status.value)}
                          className={`w-full text-left px-4 py-2 text-sm font-medium ${status.color} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Link
                href="/sell/edit"
                className={`min-h-[44px] flex items-center justify-center py-2 bg-gray-500 text-white rounded-xl font-medium text-center hover:bg-gray-600 active:bg-gray-700 transition-colors text-xs md:text-base ${listing.status === "SOLD" ? "opacity-50 pointer-events-none" : ""}`}
              >
                수정
              </Link>

              {bumpSubscription ? (
                <div className="min-h-[44px] flex flex-col items-center justify-center py-2 bg-green-50 dark:bg-green-950 border-2 border-green-400 dark:border-green-700 rounded-xl text-center">
                  <div className="text-[10px] md:text-xs font-bold text-green-700 dark:text-green-400">자동 끌올 중</div>
                  <div className="text-[10px] md:text-xs text-green-600 dark:text-green-500">
                    {bumpSubscription.frequency === "TWICE_WEEKLY" && "주 2회"}
                    {bumpSubscription.frequency === "WEEKDAY_DAILY" && "평일 매일"}
                    {bumpSubscription.frequency === "DAILY" && "매일 1회"}
                    {bumpSubscription.frequency === "TWICE_DAILY" && "매일 2회"}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleBump}
                  disabled={bumping || listing.status === "SOLD"}
                  className="min-h-[44px] py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
                >
                  {bumping ? "처리중..." : "끌올"}
                </button>
              )}

              {/* 더보기 드롭다운 (모바일) */}
              <div className="relative md:hidden">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-full min-h-[44px] px-2 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-xs flex items-center justify-center"
                >
                  ⋯
                </button>

                {showMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px] z-30">
                      <Link
                        href={`/pricing?listingId=${listing.id}`}
                        onClick={() => setShowMoreMenu(false)}
                        className="block w-full text-left px-4 py-2.5 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        광고 구매
                      </Link>
                      {sellerReportStatus === "purchased" ? (
                        <Link
                          href={`/reports/seller/${listing.id}`}
                          onClick={() => setShowMoreMenu(false)}
                          className="block w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          리포트 보기
                        </Link>
                      ) : sellerReportStatus === "not_purchased" ? (
                        <Link
                          href={`/pricing?listingId=${listing.id}&scope=seller-report`}
                          onClick={() => setShowMoreMenu(false)}
                          className="block w-full text-left px-4 py-2.5 text-sm font-medium text-purple-700 dark:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          시장분석
                        </Link>
                      ) : null}
                      {!bumpSubscription && (
                        <Link
                          href={`/pricing?listingId=${listing.id}#subscription`}
                          onClick={() => setShowMoreMenu(false)}
                          className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          정기 구독
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* 데스크톱용 버튼들 */}
              <Link
                href={`/pricing?listingId=${listing.id}`}
                className={`hidden md:flex min-h-[44px] items-center justify-center py-2 bg-blue-600 text-white rounded-xl font-medium text-center hover:bg-blue-700 active:bg-blue-800 transition-colors text-xs md:text-base ${listing.status === "SOLD" ? "opacity-50 pointer-events-none" : ""}`}
              >
                광고 구매
              </Link>
              {sellerReportStatus === "purchased" ? (
                <Link
                  href={`/reports/seller/${listing.id}`}
                  className="hidden md:flex min-h-[44px] items-center justify-center py-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-xl font-medium text-center hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors text-xs"
                >
                  리포트 보기
                </Link>
              ) : sellerReportStatus === "not_purchased" ? (
                <Link
                  href={`/pricing?listingId=${listing.id}&scope=seller-report`}
                  className={`hidden md:flex min-h-[44px] items-center justify-center py-2 bg-purple-50 dark:bg-purple-950 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-400 rounded-xl font-medium text-center hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors text-xs ${listing.status === "SOLD" ? "opacity-50 pointer-events-none" : ""}`}
                >
                  시장분석
                </Link>
              ) : null}
              {!bumpSubscription && (
                <Link
                  href={`/pricing?listingId=${listing.id}#subscription`}
                  className="hidden md:flex min-h-[44px] items-center justify-center px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium whitespace-nowrap"
                >
                  정기 구독
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* 일반 유저일 때: 채팅/관심 바 */
          <>
            <div className="px-4 pt-2 pb-1 md:hidden">
              <p className="text-xs text-gray-700 dark:text-gray-300 text-center">
                <span className="font-medium">권리금 </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {listing.premiumNone ? "무권리" : `${fmt(listing.premium)}만`}
                </span>
                <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span className="font-medium">보증금 </span>
                <span className="font-bold">{fmt(listing.deposit)}만</span>
                <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
                <span className="font-medium">월세 </span>
                <span className="font-bold">{fmt(listing.monthlyRent)}만</span>
              </p>
            </div>
            <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-3 px-4 py-2 md:px-0 md:py-0">
              <button
                onClick={handleFavorite}
                aria-label={favorited ? "관심매물 해제" : "관심매물 등록"}
                className={`min-w-[60px] px-3 md:px-4 py-3 rounded-xl border font-medium transition-colors text-sm md:text-base ${favorited ? "border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"}`}
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
          </>
        )}
      </div>

    </div>
  );
}

/* ============================================
   Sub-components
   ============================================ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-gray-100 dark:border-gray-700">
      <h2 className="font-bold text-gray-900 dark:text-white mb-3">{title}</h2>
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
      <span className="w-20 sm:w-16 text-gray-400 dark:text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-700 dark:text-gray-300">{value}</span>
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
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {value.toLocaleString()}만 <span className="text-xs text-gray-400 dark:text-gray-500">({pct}%)</span>
          </span>
        </div>
        {desc && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{desc}</p>}
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
        <span className={`text-sm ${bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>{label}</span>
        <div className="text-right">
          <span className={`text-sm ${bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
            {value.toLocaleString()}만
          </span>
          {pct && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">({pct}%)</span>
          )}
        </div>
      </div>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
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
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`text-xs font-medium ${isCheaper ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {diffPct > 0 ? "+" : ""}{diffPct.toFixed(0)}%
        </span>
      </div>
      <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* Average marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
          style={{ left: `${avgPos}%` }}
        />
        {/* My bar */}
        <div
          className={`absolute top-1 bottom-1 left-0 rounded-full ${isCheaper ? "bg-green-400" : "bg-red-400"}`}
          style={{ width: `${myPos}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          이 매물 <span className="font-medium">{mine.toLocaleString()}{unit}</span>
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          평균 {avg.toLocaleString()}{unit}
        </span>
      </div>
    </div>
  );
}

function RegionalPerformanceItem({ label, mine, avg }: {
  label: string;
  mine: number;
  avg: number;
}) {
  if (avg <= 0) return null;
  const diffPct = avg > 0 ? ((mine - avg) / avg) * 100 : 0;
  const isAboveAvg = diffPct > 0;
  const maxVal = Math.max(mine, avg) * 1.2 || 1;
  const myPos = Math.min((mine / maxVal) * 100, 100);
  const avgPos = Math.min((avg / maxVal) * 100, 100);

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`text-xs font-medium ${isAboveAvg ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {diffPct > 0 ? "▲" : "▼"} {Math.abs(diffPct).toFixed(0)}%
        </span>
      </div>
      <div className="relative h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        {/* Average marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
          style={{ left: `${avgPos}%` }}
        />
        {/* My bar */}
        <div
          className={`absolute top-1 bottom-1 left-0 rounded-full ${isAboveAvg ? "bg-green-400" : "bg-red-400"}`}
          style={{ width: `${myPos}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-700 dark:text-gray-300">
          내 매물 <span className="font-medium">{mine.toLocaleString()}회</span>
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          평균 {avg.toLocaleString()}회
        </span>
      </div>
    </div>
  );
}

// 주소에서 법정동코드 추출 (간이 매핑)
function getRegionCodeFromAddress(address: string): string {
  const guMap: Record<string, string> = {
    "강남구": "1168000000", "서초구": "1165000000", "송파구": "1171000000",
    "마포구": "1144000000", "영등포구": "1156000000", "종로구": "1111000000",
    "중구": "1114000000", "용산구": "1117000000", "성동구": "1120000000",
    "광진구": "1121500000", "동대문구": "1123000000", "중랑구": "1126000000",
    "성북구": "1129000000", "강북구": "1130500000", "도봉구": "1132000000",
    "노원구": "1135000000", "서대문구": "1141000000", "양천구": "1147000000",
    "강서구": "1150000000", "구로구": "1153000000", "금천구": "1154500000",
    "동작구": "1159000000", "관악구": "1162000000", "강동구": "1174000000",
    "은평구": "1138000000",
  };

  for (const [gu, code] of Object.entries(guMap)) {
    if (address.includes(gu)) return code;
  }
  return "1168000000"; // 기본값 강남구
}
