"use client";

import { useEffect, useState } from "react";
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
  operationType: string;
  description: string | null;
  contactPublic: boolean;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  category: { name: string; icon: string } | null;
  subCategory: { name: string } | null;
  images: { id: string; url: string; type: string }[];
  user: { id: string; name: string | null; image: string | null; phone: string | null; createdAt: string };
  _count: { favorites: number; chatRooms: number };
  featuredTier?: string;
  sellerTrust?: { avgRating: number; reviewCount: number };
}

export default function ListingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [favorited, setFavorited] = useState(false);
  const [bumping, setBumping] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/listings");
          return;
        }
        setListing(data);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, [params.id, router]);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <Breadcrumb items={[
        { label: "매물검색", href: "/listings" },
        { label: listing.category?.name || "매물" },
      ]} />
      {/* 이미지 갤러리 */}
      <div className="relative aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden mb-4 -mx-4 md:mx-0 md:rounded-xl rounded-none">
        {listing.images.length > 0 ? (
          <>
            <Image
              src={listing.images[currentImage].url}
              alt={`매물 사진 ${currentImage + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
              priority={currentImage === 0}
            />
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImage((p) => (p > 0 ? p - 1 : listing.images.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 bg-black/40 text-white rounded-full flex items-center justify-center active:bg-black/60 touch-manipulation"
                  aria-label="이전 사진"
                >
                  &lt;
                </button>
                <button
                  onClick={() => setCurrentImage((p) => (p < listing.images.length - 1 ? p + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 bg-black/40 text-white rounded-full flex items-center justify-center active:bg-black/60 touch-manipulation"
                  aria-label="다음 사진"
                >
                  &gt;
                </button>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentImage + 1} / {listing.images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm md:text-lg">
            사진 없음
          </div>
        )}
      </div>

      {/* 테마 태그 */}
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

      {(listing.monthlyRevenue || listing.monthlyProfit) && (
        <Section title="수익 정보">
          <InfoGrid>
            {listing.monthlyRevenue && <InfoItem label="월매출" value={`${fmt(listing.monthlyRevenue)}만원`} />}
            {listing.monthlyProfit && <InfoItem label="월순이익" value={`${fmt(listing.monthlyProfit)}만원`} />}
            <InfoItem label="운영" value={listing.operationType === "SOLO" ? "혼자" : listing.operationType === "FAMILY" ? "가족/동업" : "직원 고용"} />
          </InfoGrid>
        </Section>
      )}

      {listing.description && (
        <Section title="매물 설명">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
        </Section>
      )}

      <Section title="판매자">
        <div className="flex items-center gap-3">
          {listing.user.image ? (
            <Image src={listing.user.image} alt="" width={40} height={40} className="rounded-full" />
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

      {listing.latitude && listing.longitude && (
        <Section title="위치">
          <div className="space-y-3">
            <KakaoMap latitude={listing.latitude} longitude={listing.longitude} level={3} className="h-[300px] md:h-[400px]" showInfoWindow={true} address={listing.addressRoad || ""} />
            <p className="text-sm text-gray-600">{listing.addressRoad}{listing.addressDetail && ` ${listing.addressDetail}`}</p>
          </div>
        </Section>
      )}

      {listing.latitude && listing.longitude && (
        <Section title="상권분석">
          <CommercialDistrictSection latitude={listing.latitude} longitude={listing.longitude} categoryId={listing.category?.name} listingId={listing.id} />
        </Section>
      )}

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

      <ReviewSection listingId={listing.id} sellerId={listing.user.id} />
      <CrossSellSection type="listing" id={listing.id} />

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10 md:static md:border-0 md:p-0 md:mt-6">
        <div className="max-w-3xl mx-auto flex items-center gap-2 md:gap-3">
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

      <div className="text-xs text-gray-400 text-center mt-4">
        조회 {listing.viewCount} · 관심 {listing.favoriteCount} · {new Date(listing.createdAt).toLocaleDateString("ko-KR")}
      </div>
    </div>
  );
}

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
