import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Calendar, Eye,
  TrendingUp, Calculator,
  ArrowRight, ChevronRight,
} from "lucide-react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SafetyBadge } from "@/components/listings/safety-badge";
import { ContactSection } from "@/components/listings/contact-section";
import { formatKRW, formatDateKR, formatNumber } from "@/lib/utils/format";
import {
  BUSINESS_CATEGORY_LABELS,
  BUSINESS_CATEGORY_GROUPS,
  STORE_TYPE_LABELS,
  LISTING_STATUS_LABELS,
} from "@/lib/utils/constants";
import { VIEWER_PLANS } from "@/lib/utils/subscription";
import { m2ToPyeong } from "@/lib/utils/area";
import { ImageGallery } from "./image-gallery";
import { ShareButtons } from "./share-buttons";
import { CompareSection } from "./compare-section";
import { DetailTabs } from "./detail-tabs";
import { CostPieChart, RevenueGradeMessage } from "./revenue-charts";
import { MarketBarChart } from "./market-charts";
import { LikeButton } from "@/components/listings/like-button";
import { CommentSectionWrapper } from "@/components/listings/comment-section-wrapper";
import { DiagnosisCard } from "@/components/listings/diagnosis-card";
import { DiagnosisPurchaseButton } from "@/components/listings/diagnosis-purchase-button";
import { DiagnosisSummaryCard } from "@/components/listings/diagnosis-summary-card";
import { auth } from "@/lib/auth";
import { ListingLocationSectionSafe as ListingLocationSection } from "./listing-location-section";
import { PremiumOfferSection } from "./premium-offer-section";

/** Recursively convert all BigInt values to Number to prevent RSC serialization errors */
function toSerializable<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(toSerializable) as unknown as T;
  if (obj instanceof Date) return obj;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = toSerializable(value);
    }
    return result as T;
  }
  return obj;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true, city: true, district: true, businessCategory: true },
  });
  if (!listing) return { title: "매물을 찾을 수 없습니다" };
  const category = BUSINESS_CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory;
  return {
    title: `${listing.title} - ${listing.city} ${listing.district}`,
    description: `${listing.city} ${listing.district} ${category} 매물 상세정보 - 권리샵`,
  };
}

// Cached function for public listing data (60 second cache)
const getListingPublicData = unstable_cache(
  async (listingId: string) => {
    const listingData = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listingData || listingData.status === "DELETED") return null;

    // 같은 대분류(categoryGroup) 업종 목록
    const categoryGroupCats = (Object.values(BUSINESS_CATEGORY_GROUPS).find(
      (cats) => cats.includes(listingData.businessCategory),
    ) ?? [listingData.businessCategory]) as typeof listingData.businessCategory[];

    const [images, seller, marketPriceRaw, recommendedExperts, districtListingsRaw, categoryListingsRaw, diagnosisReportRaw] =
      await Promise.all([
        prisma.listingImage.findMany({
          where: { listingId },
          orderBy: { sortOrder: "asc" },
        }),
        prisma.user.findUnique({
          where: { id: listingData.sellerId },
          select: { id: true, name: true, image: true, isTrustedSeller: true },
        }),
        prisma.marketPrice.findFirst({
          where: {
            subRegion: listingData.district,
            businessType: listingData.businessCategory,
          },
        }),
        prisma.expert.findMany({
          where: { isActive: true, region: listingData.city },
          select: {
            id: true,
            name: true,
            title: true,
            rating: true,
            category: true,
            isVerified: true,
          },
          orderBy: [
            { isVerified: "desc" },
            { rating: "desc" },
            { consultCount: "desc" },
          ],
          take: 3,
        }),
        // 이 지역 유사 매물: 같은 시 전체 (같은 구 우선, 프리미엄/추천 우선)
        prisma.listing.findMany({
          where: {
            id: { not: listingId },
            status: "ACTIVE",
            city: listingData.city,
          },
          select: {
            id: true,
            title: true,
            businessCategory: true,
            city: true,
            district: true,
            price: true,
            premiumFee: true,
            monthlyRent: true,
            safetyGrade: true,
            premiumRank: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, thumbnailUrl: true } },
          },
          orderBy: [{ premiumRank: "desc" }, { viewCount: "desc" }],
          take: 20,
        }),
        // 같은 업종 추천 매물: 같은 대분류 전체 (같은 소분류 우선, 프리미엄/추천 우선)
        prisma.listing.findMany({
          where: {
            id: { not: listingId },
            status: "ACTIVE",
            businessCategory: { in: categoryGroupCats },
          },
          select: {
            id: true,
            title: true,
            businessCategory: true,
            city: true,
            district: true,
            price: true,
            premiumFee: true,
            monthlyRent: true,
            safetyGrade: true,
            premiumRank: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, thumbnailUrl: true } },
          },
          orderBy: [{ premiumRank: "desc" }, { viewCount: "desc" }],
          take: 20,
        }),
        prisma.diagnosisReport.findUnique({
          where: { listingId },
        }),
      ]);

    // Convert BigInt fields to Number INSIDE the cache callback
    // so that unstable_cache can JSON.stringify the return value
    return toSerializable({ listingData, images, seller, marketPriceRaw, recommendedExperts, districtListingsRaw, categoryListingsRaw, diagnosisReportRaw });
  },
  ["listing-detail"],
  { revalidate: 60, tags: ["listing"] }
);

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  let session: { user?: { id?: string } } | null = null;
  try {
    session = await auth();
  } catch (e) {
    console.error("[listing-detail] auth() failed:", e);
  }

  // Fetch cached public data
  const publicData = await getListingPublicData(id);
  if (!publicData) notFound();

  const { listingData, images, seller, marketPriceRaw, recommendedExperts, districtListingsRaw, categoryListingsRaw, diagnosisReportRaw } = publicData;

  // User-specific queries (NOT cached, run in parallel)
  const userId = session?.user?.id;
  const [userLikeRecord, userSubscription, userSinglePurchase] = await Promise.all([
    userId
      ? prisma.listingLike.findUnique({
          where: { listingId_userId: { listingId: id, userId } },
        })
      : Promise.resolve(null),
    userId
      ? prisma.subscription.findUnique({ where: { userId } })
      : Promise.resolve(null),
    userId
      ? prisma.singlePurchase.findFirst({
          where: { userId, listingId: id, expiresAt: { gt: new Date() } },
        })
      : Promise.resolve(null),
  ]);

  const userLiked = !!userLikeRecord;

  // Inline access check logic (avoids calling canViewRevenueData and its duplicate listing query)
  const hasRevenueAccess = (() => {
    if (!userId) return false;
    // Owner always has access
    if (listingData.sellerId === userId) return true;
    // Active subscription (PRO/PREMIUM)
    if (
      userSubscription &&
      userSubscription.status === "ACTIVE" &&
      (userSubscription.tier === "PRO" || userSubscription.tier === "PREMIUM") &&
      (!userSubscription.currentPeriodEnd || userSubscription.currentPeriodEnd > new Date())
    ) return true;
    // Trial subscription
    if (
      userSubscription &&
      userSubscription.status === "TRIAL" &&
      userSubscription.currentPeriodEnd &&
      userSubscription.currentPeriodEnd > new Date()
    ) return true;
    // Single purchase
    if (userSinglePurchase) return true;
    return false;
  })();

  // Convert all BigInt fields to Number (Prisma returns BigInt, RSC can't serialize it)
  const marketPrice = toSerializable(marketPriceRaw);
  const districtListings = toSerializable(districtListingsRaw);
  const categoryListings = toSerializable(categoryListingsRaw);

  // Priority-sorted display arrays (max 4 each)
  const districtDisplay = (() => {
    const getPriority = (l: (typeof districtListings)[number]) => {
      const sameDistrict = l.district === listingData.district;
      const isPremium = (l.premiumRank ?? 0) >= 2;
      if (sameDistrict && isPremium) return 0;
      if (sameDistrict) return 1;
      if (isPremium) return 2;
      return 3;
    };
    return [...districtListings].sort((a, b) => getPriority(a) - getPriority(b)).slice(0, 4);
  })();

  const categoryDisplay = (() => {
    const getPriority = (l: (typeof categoryListings)[number]) => {
      const sameCat = l.businessCategory === listingData.businessCategory;
      const isPremium = (l.premiumRank ?? 0) >= 2;
      if (sameCat && isPremium) return 0;
      if (sameCat) return 1;
      if (isPremium) return 2;
      return 3;
    };
    return [...categoryListings].sort((a, b) => getPriority(a) - getPriority(b)).slice(0, 4);
  })();
  const diagnosisReport = toSerializable(diagnosisReportRaw);

  const listing = { ...toSerializable(listingData), images, seller };

  const isPremium = (listing.premiumRank ?? 0) >= 2;

  // Track view (fire-and-forget)
  prisma.listing
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const areaPyeong = listing.areaM2 ? m2ToPyeong(listing.areaM2) : null;

  // Numeric values for charts
  const numPremiumFee = Number(listing.premiumFee ?? 0);
  const numMonthlyRevenue = Number(listing.monthlyRevenue ?? 0);
  const numMonthlyProfit = Number(listing.monthlyProfit ?? 0);
  const numMonthlyRent = Number(listing.monthlyRent ?? 0);
  const numManagementFee = Number(listing.managementFee ?? 0);
  const numDeposit = Number(listing.price);
  const avgPremium = marketPrice ? Number(marketPrice.avgKeyMoney) : 0;

  // Real market stats from actual listings — prefer same district+category, fallback to wider pool
  const sameCategoryDistrictListings = [...districtListings, ...categoryListings].filter(
    (l) => l.businessCategory === listingData.businessCategory && l.district === listingData.district
  );
  // If narrow filter has < 2 results, use all available comparison listings (same district OR same category)
  const uniqueListings = new Map<string, typeof districtListings[0]>();
  for (const l of [...districtListings, ...categoryListings]) {
    uniqueListings.set(l.id, l);
  }
  const realListingsForStats = sameCategoryDistrictListings.length >= 2
    ? sameCategoryDistrictListings
    : Array.from(uniqueListings.values());
  const realAvgDeposit = realListingsForStats.length > 0
    ? Math.round(realListingsForStats.reduce((s, l) => s + Number(l.price), 0) / realListingsForStats.length)
    : 0;
  const premiumListings = realListingsForStats.filter(l => l.premiumFee && Number(l.premiumFee) > 0);
  const realAvgPremium = premiumListings.length > 0
    ? Math.round(premiumListings.reduce((s, l) => s + Number(l.premiumFee!), 0) / premiumListings.length)
    : 0;
  const rentListings = realListingsForStats.filter(l => l.monthlyRent && Number(l.monthlyRent) > 0);
  const realAvgRent = rentListings.length > 0
    ? Math.round(rentListings.reduce((s, l) => s + Number(l.monthlyRent!), 0) / rentListings.length)
    : 0;

  // Cost breakdown estimates
  const totalRent = numMonthlyRent + numManagementFee;
  const totalCosts = Math.max(0, numMonthlyRevenue - numMonthlyProfit);
  const nonRentCosts = Math.max(0, totalCosts - totalRent);
  const laborCost = Math.round(nonRentCosts * 0.30);
  const materialCost = Math.round(nonRentCosts * 0.56);
  const otherCost = nonRentCosts - laborCost - materialCost;

  // ROI calculation
  const totalInvestment = numDeposit + numPremiumFee;
  const roiMonths =
    numMonthlyProfit > 0
      ? Math.round(totalInvestment / numMonthlyProfit)
      : 0;
  const annualROI =
    totalInvestment > 0 && numMonthlyProfit > 0
      ? ((numMonthlyProfit * 12) / totalInvestment) * 100
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* [1] Image Gallery */}
      <ImageGallery
        images={listing.images}
        title={listing.title}
        businessCategory={listing.businessCategory}
        showPhotoHint={!listing.images.length && session?.user?.id === listing.sellerId}
      />

      {/* [2] Two-column layout */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* LEFT COLUMN */}
        <div className="min-w-0">
          {/* [2-1] Title Area */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {(listing.safetyGrade === "A" || listing.safetyGrade === "B") && (
                <span className="rounded-md bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                  매출인증
                </span>
              )}
              {isPremium && (
                <span className="rounded-md bg-purple-600 px-3 py-1 text-sm font-semibold text-white">
                  프리미엄
                </span>
              )}
            </div>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">{listing.title}</h1>

            {listing.transferReason && (
              <p className="mt-2 text-sm text-gray-500">
                양도사유: {listing.transferReason}
              </p>
            )}

            <p className="mt-2 flex items-center gap-1.5 text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              {listing.address}
              {listing.addressDetail ? ` ${listing.addressDetail}` : ""}
            </p>

            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                조회 {formatNumber(listing.viewCount)}
              </span>
              <LikeButton
                listingId={listing.id}
                initialLiked={userLiked}
                initialCount={listing.likeCount ?? 0}
              />
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateKR(listing.createdAt)}
              </span>
            </div>
          </div>

          {/* [2-2] Core Pricing */}
          <div className="mt-8 rounded-xl border border-gray-100 bg-white p-6">
            <div className="flex items-center divide-x divide-gray-200">
              <PriceBlock label="보증금" value={formatKRW(numDeposit)} />
              <PriceBlock
                label="권리금"
                value={numPremiumFee > 0 ? formatKRW(numPremiumFee) : "무권리"}
                highlight
              />
              <PriceBlock
                label="월세"
                value={numMonthlyRent > 0 ? formatKRW(numMonthlyRent) : "-"}
              />
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              {numManagementFee > 0 && (
                <span>관리비 {formatKRW(numManagementFee)}</span>
              )}
              <span>총 투자비용 {formatKRW(totalInvestment)}</span>
            </div>
          </div>

          {/* [2-3] Revenue Summary (arrow flow) */}
          {(numMonthlyRevenue > 0 || numMonthlyProfit > 0) && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-gray-50 px-6 py-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">월매출</p>
                <p className="mt-0.5 text-base font-bold text-gray-900">{formatKRW(numMonthlyRevenue)}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="text-center">
                <p className="text-xs text-gray-500">월순이익</p>
                <p className="mt-0.5 text-base font-bold text-gray-900">{formatKRW(numMonthlyProfit)}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="text-center">
                <p className="text-xs text-gray-500">투자회수</p>
                <p className="mt-0.5 text-base font-bold text-purple-600">
                  {roiMonths > 0 ? `약 ${roiMonths}개월` : "-"}
                </p>
              </div>
            </div>
          )}

          {/* [2-4] Tabs */}
          <div className="mt-8">
            <DetailTabs />
          </div>

          {/* ===== TAB 1: 매물정보 ===== */}
          <section id="listing-info" className="mt-8">
            {/* DiagnosisSummaryCard */}
            {listing.hasDiagnosisBadge && (
              <DiagnosisSummaryCard listingId={listing.id} />
            )}

            {/* Info table */}
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  <InfoRow
                    label="업종"
                    value={BUSINESS_CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory}
                  />
                  {listing.businessSubtype && (
                    <InfoRow label="세부업종" value={listing.businessSubtype} />
                  )}
                  <InfoRow
                    label="상가유형"
                    value={STORE_TYPE_LABELS[listing.storeType] ?? listing.storeType}
                  />
                  {listing.areaM2 && (
                    <InfoRow
                      label="면적"
                      value={`${listing.areaM2}m² (${areaPyeong?.toFixed(1)}평)`}
                    />
                  )}
                  {listing.floor != null && (
                    <InfoRow
                      label="층수"
                      value={`${listing.floor}층${listing.totalFloors ? ` / ${listing.totalFloors}층` : ""}`}
                    />
                  )}
                  {listing.operatingYears != null && (
                    <InfoRow label="영업기간" value={`${listing.operatingYears}년`} />
                  )}
                  {listing.expiresAt && (
                    <InfoRow label="만료일" value={formatDateKR(listing.expiresAt)} />
                  )}
                </tbody>
              </table>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-900">상세 설명</h2>
              <div className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-6 leading-relaxed text-gray-700">
                {listing.description || (
                  <span className="text-gray-400">상세 설명이 아직 등록되지 않았습니다.</span>
                )}
              </div>
            </div>

            {/* Premium breakdown */}
            {(listing.goodwillPremium || listing.facilityPremium || listing.floorPremium) && (
              <div className="mt-6 overflow-hidden rounded-xl border border-purple-100 bg-purple-50/50">
                <div className="px-5 py-4">
                  <h3 className="text-sm font-bold text-purple-700">권리금 산정에 대한 설명</h3>
                  <div className="mt-3 space-y-3">
                    {listing.goodwillPremium != null && listing.goodwillPremium > 0 && (
                      <PremiumBreakdownRow
                        label="영업권리금"
                        amount={`${listing.goodwillPremium.toLocaleString()}만원`}
                        desc={listing.goodwillPremiumDesc}
                      />
                    )}
                    {listing.facilityPremium != null && listing.facilityPremium > 0 && (
                      <PremiumBreakdownRow
                        label="시설권리금"
                        amount={`${listing.facilityPremium.toLocaleString()}만원`}
                        desc={listing.facilityPremiumDesc}
                      />
                    )}
                    {listing.floorPremium != null && listing.floorPremium > 0 && (
                      <PremiumBreakdownRow
                        label="바닥권리금"
                        amount={`${listing.floorPremium.toLocaleString()}만원`}
                        desc={listing.floorPremiumDesc}
                      />
                    )}
                  </div>
                  <div className="mt-3 border-t border-purple-200/50 pt-3 text-right">
                    <span className="text-sm text-gray-500">합계 </span>
                    <span className="text-sm font-bold text-purple-700">
                      {((listing.goodwillPremium ?? 0) + (listing.facilityPremium ?? 0) + (listing.floorPremium ?? 0)).toLocaleString()}만원
                    </span>
                  </div>
                  {diagnosisReport && (
                    <div className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-right">
                      <span className="text-xs text-gray-500">권리진단서 적정 권리금: </span>
                      <span className="text-xs font-bold text-purple-600">
                        {formatKRW(diagnosisReport.fairPremiumBusiness + diagnosisReport.fairPremiumFacility + diagnosisReport.fairPremiumFloor)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DiagnosisCard */}
            {diagnosisReport && (
              <div className="mt-4">
                <DiagnosisCard diagnosis={diagnosisReport} />
              </div>
            )}

            {/* Seller-only: diagnosis purchase button */}
            {!diagnosisReport && session?.user?.id === listing.sellerId && (
              <DiagnosisPurchaseButton listingId={listing.id} />
            )}

            {/* No revenue verification notice */}
            {(!listing.safetyGrade || listing.safetyGrade === "C" || listing.safetyGrade === "D") && (
              <div className="mt-8 rounded-xl bg-gray-50 px-6 py-4">
                <h3 className="text-sm font-semibold text-gray-700">매출 증빙 없음</h3>
                <p className="mt-1 text-sm text-gray-500">이 매물은 매출 증빙이 없습니다. 거래 시 매출 자료를 직접 확인하시기 바랍니다.</p>
                <a
                  href="#comments"
                  className="mt-2 inline-block rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  판매자에게 매출자료 요청하기
                </a>
              </div>
            )}
          </section>

          {/* ===== TAB 2: 수익분석 ===== */}
          <section id="revenue-analysis" className="mt-12">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">수익 분석</h2>
              {listing.safetyGrade && <SafetyBadge grade={listing.safetyGrade} size="md" />}
            </div>

            {/* Safety verification badge (A/B only) */}
            {(listing.safetyGrade === "A" || listing.safetyGrade === "B") && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/50 px-5 py-3">
                <SafetyBadge grade={listing.safetyGrade} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-purple-800">
                    {listing.safetyGrade === "A"
                      ? "홈택스/여신금융협회 매출 검증 완료"
                      : "매출 증빙자료 제출 완료"}
                  </p>
                  {listing.safetyComment && (
                    <p className="mt-0.5 text-xs text-purple-600">
                      {listing.safetyComment}
                    </p>
                  )}
                </div>
                {!hasRevenueAccess && (
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/api/payments/single?listingId=${listing.id}`}
                      className="rounded-lg border border-purple-300 px-3 py-1.5 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-100"
                    >
                      증빙 열람 {VIEWER_PLANS.SINGLE.price.toLocaleString()}원
                    </Link>
                    <Link
                      href="/pricing#viewer"
                      className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-purple-700"
                    >
                      월 구독
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Revenue/Profit Content */}
            {(numMonthlyRevenue > 0 || numMonthlyProfit > 0) ? (
              <>
                {/* 4 stat cards */}
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="월매출" value={formatKRW(numMonthlyRevenue)} />
                  <StatCard label="월순이익" value={formatKRW(numMonthlyProfit)} />
                  <StatCard label="총 투자금" value={formatKRW(totalInvestment)} />
                  <StatCard label="투자회수기간" value={roiMonths > 0 ? `약 ${roiMonths}개월` : "-"} />
                </div>

                {/* Revenue Grade Message */}
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
                  <RevenueGradeMessage
                    grade={listing.safetyGrade}
                    monthlyRevenue={numMonthlyRevenue}
                    monthlyProfit={numMonthlyProfit}
                  />
                </div>

                {/* Cost Structure */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {/* Cost Table */}
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                    <div className="border-b border-gray-100 px-6 py-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        월 지출 내역 (판매자 입력)
                      </h3>
                      <p className="mt-1 text-[11px] text-gray-400">* 판매자가 직접 입력한 정보이며, 실제와 다를 수 있습니다</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                      <CostRow label="임대료 (월세+관리비)" value={totalRent} />
                      <CostRow label="인건비 (추정)" value={laborCost} />
                      <CostRow label="재료비/원가 (추정)" value={materialCost} />
                      <CostRow label="기타비용 (추정)" value={otherCost} />
                      <div className="flex items-center justify-between bg-purple-50 px-6 py-3">
                        <span className="text-sm font-bold text-gray-900">월순이익</span>
                        <span className="text-base font-bold text-purple-600">{formatKRW(numMonthlyProfit)}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 px-6 py-2">
                      <p className="text-[11px] text-gray-400">
                        * 인건비/재료비는 업종 평균 기준 추정치입니다
                      </p>
                    </div>
                  </div>

                  {/* Cost Pie Chart */}
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
                    <h3 className="mb-2 text-base font-semibold text-gray-900">매출 구성</h3>
                    <CostPieChart
                      rent={totalRent}
                      laborCost={laborCost}
                      materialCost={materialCost}
                      otherCost={otherCost}
                      profit={numMonthlyProfit}
                    />
                  </div>
                </div>

                {/* ROI Summary */}
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  <div className="px-6 py-5">
                    <h3 className="text-base font-semibold text-gray-900">투자 수익률 (ROI)</h3>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-gray-500">보증금</p>
                        <p className="mt-1 text-sm font-bold text-gray-900">{formatKRW(numDeposit)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">권리금</p>
                        <p className="mt-1 text-sm font-bold text-purple-600">
                          {numPremiumFee > 0 ? formatKRW(numPremiumFee) : "무권리"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">투자회수</p>
                        <p className="mt-1 text-sm font-bold text-purple-600">
                          {roiMonths > 0 ? `약 ${roiMonths}개월` : "-"}
                        </p>
                      </div>
                    </div>
                    {annualROI > 0 && (
                      <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4 text-center">
                        <p className="text-xs text-gray-500">연간 투자수익률 (ROI)</p>
                        <p className="mt-1 text-2xl font-bold text-purple-600">
                          {annualROI.toFixed(1)}%
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          (월순이익 x 12) / (보증금 + 권리금) x 100
                        </p>
                      </div>
                    )}
                    {roiMonths > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>0개월</span>
                          <span>{roiMonths}개월</span>
                        </div>
                        <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-purple-500 transition-all"
                            style={{
                              width: `${Math.min(100, (12 / roiMonths) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          1년 기준 회수율:{" "}
                          <span className="font-semibold text-purple-600">
                            {((12 / roiMonths) * 100).toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-6 py-12 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  매출/수익 정보가 등록되지 않은 매물입니다
                </p>
              </div>
            )}
          </section>

          {/* ===== TAB 3: 주변시세 ===== */}
          <section id="market-comparison" className="mt-12">
            <h2 className="text-lg font-bold text-gray-900">주변 시세</h2>

            {(marketPrice || districtListings.length > 0) ? (
              <>
                {/* Market Price Chart */}
                {numPremiumFee > 0 && (avgPremium > 0 || realAvgPremium > 0) && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        권리금 시세 비교
                      </h3>
                      <span className="text-xs text-gray-500">
                        {listing.district} ·{" "}
                        {BUSINESS_CATEGORY_LABELS[listing.businessCategory]}
                      </span>
                    </div>
                    <MarketBarChart
                      currentPremium={numPremiumFee}
                      avgPremium={avgPremium || realAvgPremium}
                      district={listing.district}
                    />
                    {(() => {
                      const ratio =
                        avgPremium > 0 ? numPremiumFee / avgPremium : 1;
                      const verdict =
                        ratio <= 0.8
                          ? "저가"
                          : ratio >= 1.2
                            ? "고가"
                            : "적정";
                      return (
                        <div className="mt-4 flex items-center justify-between">
                          <span
                            className={`rounded-md px-3 py-1 text-sm font-bold ${
                              verdict === "적정"
                                ? "bg-purple-100 text-purple-700"
                                : verdict === "저가"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-purple-50 text-purple-600"
                            }`}
                          >
                            지역 평균 대비{" "}
                            {verdict === "적정"
                              ? "적정 수준"
                              : verdict === "저가"
                                ? "저렴한 편"
                                : "높은 편"}
                          </span>
                          <Link
                            href={`/market-price?subRegion=${listing.district}&businessType=${listing.businessCategory}`}
                            className="flex items-center gap-1 text-sm text-purple-600 hover:underline"
                          >
                            상세 시세 보기
                          </Link>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Market Price Stats */}
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
                  <div className="border-b border-gray-100 px-6 py-4">
                    <h3 className="text-base font-semibold text-gray-900">
                      {listing.district} 시세 요약
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
                    <MarketStat
                      label="평균 권리금"
                      value={
                        (marketPrice?.avgKeyMoney ?? realAvgPremium) > 0
                          ? formatKRW(marketPrice ? marketPrice.avgKeyMoney : realAvgPremium)
                          : "데이터 부족"
                      }
                    />
                    <MarketStat
                      label="평균 보증금"
                      value={
                        (marketPrice?.avgDeposit ?? realAvgDeposit) > 0
                          ? formatKRW(marketPrice ? marketPrice.avgDeposit : realAvgDeposit)
                          : "데이터 부족"
                      }
                    />
                    <MarketStat
                      label="평균 월세"
                      value={
                        (marketPrice?.avgMonthlyRent ?? realAvgRent) > 0
                          ? formatKRW(marketPrice ? marketPrice.avgMonthlyRent : realAvgRent)
                          : "데이터 부족"
                      }
                    />
                    <MarketStat
                      label="비교 매물"
                      value={`${marketPrice ? marketPrice.sampleCount : districtListings.length}건`}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-6 py-12 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  해당 지역의 시세 데이터가 아직 충분하지 않습니다
                </p>
              </div>
            )}

            {/* Nearby Listings Table */}
            {districtListings.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="text-base font-semibold text-gray-900">인근 매물 비교</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                        <th className="px-4 py-3 font-medium">매물명</th>
                        <th className="px-4 py-3 font-medium">업종</th>
                        <th className="px-4 py-3 font-medium text-right">보증금</th>
                        <th className="px-4 py-3 font-medium text-right">권리금</th>
                        <th className="px-4 py-3 font-medium text-right">월세</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Current listing row */}
                      <tr className="bg-purple-50/50">
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {listing.title}
                          <span className="ml-2 inline-flex items-center rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            이 매물
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {BUSINESS_CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatKRW(listing.price)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-purple-600">
                          {numPremiumFee > 0 ? formatKRW(numPremiumFee) : "무권리"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {numMonthlyRent > 0 ? formatKRW(numMonthlyRent) : "-"}
                        </td>
                      </tr>
                      {districtListings.slice(0, 3).map((sl) => (
                        <tr key={sl.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/listings/${sl.id}`}
                              className="font-medium text-gray-800 hover:text-purple-600"
                            >
                              {sl.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {BUSINESS_CATEGORY_LABELS[sl.businessCategory] ?? sl.businessCategory}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatKRW(sl.price)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-purple-600">
                            {sl.premiumFee && Number(sl.premiumFee) > 0
                              ? formatKRW(sl.premiumFee)
                              : "무권리"}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">
                            {sl.monthlyRent && Number(sl.monthlyRent) > 0
                              ? formatKRW(sl.monthlyRent)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ===== TAB 4: 위치정보 ===== */}
          <ListingLocationSection
            lat={listing.latitude}
            lng={listing.longitude}
            address={listing.address ?? ""}
            addressDetail={listing.addressDetail}
            city={listing.city}
            district={listing.district}
            neighborhood={listing.neighborhood}
            postalCode={listing.postalCode}
          />

          {/* ===== Share + Comments ===== */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            <div className="flex items-center justify-between">
              <ShareButtons listingId={listing.id} title={listing.title} />
            </div>

            <div id="comments" className="mt-8">
              <CommentSectionWrapper listingId={listing.id} sellerId={listing.sellerId} />
            </div>
          </div>
        </div>

        {/* ===== RIGHT SIDEBAR ===== */}
        <div className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            {/* [S-1] Seller Info Card */}
            <div className="rounded-xl border border-gray-100 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
                  {listing.seller?.name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {listing.seller?.name ?? "미인증"}
                  </p>
                  <p className="text-xs text-gray-500">판매자</p>
                </div>
              </div>

              <div className="mt-4">
                <ContactSection
                  listingId={listing.id}
                  sellerId={listing.sellerId}
                  contactPhone={listing.contactPhone}
                  contactEmail={listing.contactEmail}
                  isPhonePublic={listing.isPhonePublic}
                />
              </div>
            </div>

            {/* [S-2] Diagnosis CTA */}
            {!diagnosisReport ? (
              <Link
                href={`/reports/purchase?listingId=${listing.id}`}
                className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-purple-700"
              >
                AI 권리진단서 발급 30,000원
              </Link>
            ) : (
              <Link
                href={`/reports/${diagnosisReport.id}`}
                className="flex w-full items-center justify-center rounded-lg border border-purple-300 px-4 py-3 text-sm font-bold text-purple-700 transition-colors hover:bg-purple-50"
              >
                권리진단서 결과 보기
              </Link>
            )}

            {/* [S-3] Premium Offer (accordion) */}
            <details className="group rounded-xl border border-gray-100 bg-white">
              <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-gray-900">
                권리금 제안하기
                <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="border-t border-gray-100 px-5 py-4">
                <PremiumOfferSection
                  listingId={id}
                  sellerId={listing.sellerId}
                  userId={userId ?? null}
                  premiumFee={Math.round(numPremiumFee / 10000)}
                  compact={true}
                />
              </div>
            </details>

            {/* [S-4] Compare Button */}
            <CompareSection
              listing={{
                id: listing.id,
                title: listing.title,
                businessCategory: listing.businessCategory,
                city: listing.city,
                district: listing.district,
                thumbnail:
                  images[0]?.thumbnailUrl ?? images[0]?.url ?? null,
                price: String(listing.price),
                monthlyRent: listing.monthlyRent
                  ? String(listing.monthlyRent)
                  : null,
                premiumFee: listing.premiumFee
                  ? String(listing.premiumFee)
                  : null,
                managementFee: listing.managementFee
                  ? String(listing.managementFee)
                  : null,
                monthlyRevenue: listing.monthlyRevenue
                  ? String(listing.monthlyRevenue)
                  : null,
                monthlyProfit: listing.monthlyProfit
                  ? String(listing.monthlyProfit)
                  : null,
                areaM2: listing.areaM2,
                areaPyeong:
                  listing.areaPyeong ??
                  (listing.areaM2
                    ? Math.round(listing.areaM2 / 3.3058)
                    : null),
                floor: listing.floor,
                safetyGrade: listing.safetyGrade,
                isPremium: listing.isPremium,
                premiumRank: listing.premiumRank,
                storeType: listing.storeType,
              }}
            />

            {/* [S-5] Simulator Link */}
            <Link
              href={`/simulator?listingId=${listing.id}&keyMoney=${Math.round(Number(listing.premiumFee || 0) / 10000)}&deposit=${Math.round(Number(listing.price || 0) / 10000)}&monthlyRent=${Math.round(Number(listing.monthlyRent || 0) / 10000)}&businessType=${encodeURIComponent(BUSINESS_CATEGORY_LABELS[listing.businessCategory] || "기타")}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Calculator className="h-4 w-4" />
              이 매물로 창업 시뮬레이션
            </Link>

            {/* Disclaimer */}
            <p className="text-xs leading-relaxed text-gray-400">
              본 매물 정보는 판매자가 등록한 것으로, 권리샵은 정보의
              정확성을 보증하지 않습니다. 중요한 거래 결정 시{" "}
              <Link
                href="/legal/disclaimer"
                className="underline hover:text-gray-600"
              >
                면책조항
              </Link>
              을 확인하시고 전문가 검토를 받으시기 바랍니다.
            </p>
          </div>
        </div>
      </div>

      {/* [3] District Similar Listings */}
      {districtDisplay.length > 0 && (
        <div className="mt-16 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">이 지역 유사 매물</h2>
            <Link
              href={`/listings?district=${listing.district}&city=${listing.city}`}
              className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:underline"
            >
              더보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {districtDisplay.map((sl) => (
              <SimilarListingCard key={sl.id} sl={sl} />
            ))}
          </div>
        </div>
      )}

      {/* Category Similar Listings */}
      {categoryDisplay.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">같은 업종 추천 매물</h2>
            <Link
              href={`/listings?businessCategory=${listing.businessCategory}`}
              className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:underline"
            >
              더보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryDisplay.map((sl) => (
              <SimilarListingCard key={sl.id} sl={sl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Helper Components ===== */

function PriceBlock({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex-1 px-4 py-1 text-center first:pl-0 last:pr-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? "text-purple-600" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="w-32 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500">{label}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{value}</td>
    </tr>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-base font-bold text-gray-900">{value}</p>
    </div>
  );
}

function PremiumBreakdownRow({
  label,
  amount,
  desc,
}: {
  label: string;
  amount: string;
  desc?: string | null;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-purple-700">{amount}</span>
      </div>
      {desc && (
        <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{desc}</p>
      )}
    </div>
  );
}

function SimilarListingCard({ sl }: { sl: { id: string; title: string; businessCategory: string; city: string; district: string; price: number | bigint; premiumFee?: number | bigint | null; safetyGrade?: string | null; premiumRank?: number | null; images: { url: string; thumbnailUrl?: string | null }[] } }) {
  const thumb = sl.images[0]?.thumbnailUrl ?? sl.images[0]?.url ?? null;
  const rank = sl.premiumRank ?? 0;

  return (
    <Link
      href={`/listings/${sl.id}`}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {thumb ? (
          <Image
            src={thumb}
            alt={sl.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <span className="text-sm text-gray-400">
              {BUSINESS_CATEGORY_LABELS[sl.businessCategory] ?? sl.businessCategory}
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-gray-900/70 px-2 py-0.5 text-[11px] font-medium text-white">
          {BUSINESS_CATEGORY_LABELS[sl.businessCategory] ?? sl.businessCategory}
        </span>
        {rank >= 2 && (
          <span className="absolute left-2 bottom-2 rounded bg-gray-700 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {rank === 3 ? "AD" : "추천"}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-purple-600">
          {sl.title}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {sl.city} {sl.district}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-bold text-purple-600">
            {sl.premiumFee && Number(sl.premiumFee) > 0 ? formatKRW(sl.premiumFee) : "무권리"}
          </span>
          <span className="text-xs text-gray-400">
            보증금 {formatKRW(sl.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-800">
        {value > 0 ? formatKRW(value) : "-"}
      </span>
    </div>
  );
}

function MarketStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}
