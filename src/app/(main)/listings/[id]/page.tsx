import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Calendar, Eye, Building, Layers,
  TrendingUp, Calculator, Star, Users,
  ArrowRight, Shield, ShieldCheck, Lock,
} from "lucide-react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { SafetyBadge, DiagnosisBadge } from "@/components/listings/safety-badge";
import { ContactSection } from "@/components/listings/contact-section";
import { formatKRW, formatDateKR, formatNumber } from "@/lib/utils/format";
import {
  BUSINESS_CATEGORY_LABELS,
  STORE_TYPE_LABELS,
  LISTING_STATUS_LABELS,
  SAFETY_GRADE_CONFIG,
  PREMIUM_AD_CONFIG,
  EXPERT_CATEGORY_LABELS,
  DIAGNOSIS_BADGE_CONFIG,
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
import { DiagnosisSummaryCard, DiagnosisCTACard } from "@/components/listings/diagnosis-summary-card";
import { PaywallOverlay } from "@/components/listings/paywall-overlay";
import { auth } from "@/lib/auth";
import { ListingLocationSection } from "./listing-location-section";

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
        prisma.listing.findMany({
          where: {
            id: { not: listingId },
            status: "ACTIVE",
            district: listingData.district,
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
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, thumbnailUrl: true } },
          },
          orderBy: { viewCount: "desc" },
          take: 4,
        }),
        prisma.listing.findMany({
          where: {
            id: { not: listingId },
            status: "ACTIVE",
            businessCategory: listingData.businessCategory,
            district: { not: listingData.district },
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
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true, thumbnailUrl: true } },
          },
          orderBy: { viewCount: "desc" },
          take: 4,
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
  const diagnosisReport = toSerializable(diagnosisReportRaw);

  const listing = { ...toSerializable(listingData), images, seller };

  // Track view (fire-and-forget)
  prisma.listing
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const areaPyeong = listing.areaM2 ? m2ToPyeong(listing.areaM2) : null;

  const premiumTierKey =
    listing.premiumRank === 3
      ? "VIP"
      : listing.premiumRank === 2
        ? "PREMIUM"
        : listing.premiumRank === 1
          ? "BASIC"
          : null;
  const premiumTierConfig = premiumTierKey
    ? PREMIUM_AD_CONFIG[premiumTierKey]
    : null;

  // Numeric values for charts
  const numPremiumFee = Number(listing.premiumFee ?? 0);
  const numMonthlyRevenue = Number(listing.monthlyRevenue ?? 0);
  const numMonthlyProfit = Number(listing.monthlyProfit ?? 0);
  const numMonthlyRent = Number(listing.monthlyRent ?? 0);
  const numManagementFee = Number(listing.managementFee ?? 0);
  const numDeposit = Number(listing.price);
  const avgPremium = marketPrice ? Number(marketPrice.avgKeyMoney) : 0;

  // Real market stats from actual listings in the same district + category
  const sameCategoryDistrictListings = [...districtListings, ...categoryListings].filter(
    (l) => l.businessCategory === listingData.businessCategory && l.district === listingData.district
  );
  const realListingsForStats = [
    ...sameCategoryDistrictListings,
    // Include current listing in stats for comparison
  ];
  const realAvgDeposit = realListingsForStats.length > 0
    ? Math.round(realListingsForStats.reduce((s, l) => s + Number(l.price), 0) / realListingsForStats.length)
    : 0;
  const realAvgPremium = realListingsForStats.length > 0
    ? Math.round(realListingsForStats.filter(l => l.premiumFee && Number(l.premiumFee) > 0).reduce((s, l) => s + Number(l.premiumFee!), 0) / Math.max(1, realListingsForStats.filter(l => l.premiumFee && Number(l.premiumFee) > 0).length))
    : 0;
  const realAvgRent = realListingsForStats.length > 0
    ? Math.round(realListingsForStats.filter(l => l.monthlyRent && Number(l.monthlyRent) > 0).reduce((s, l) => s + Number(l.monthlyRent!), 0) / Math.max(1, realListingsForStats.filter(l => l.monthlyRent && Number(l.monthlyRent) > 0).length))
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
  const roiColorClass =
    annualROI >= 20 ? "text-green-600" : annualROI >= 10 ? "text-orange-600" : "text-red-600";
  const roiBgClass =
    annualROI >= 20
      ? "bg-green-50 border-green-200"
      : annualROI >= 10
        ? "bg-orange-50 border-orange-200"
        : "bg-red-50 border-red-200";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Premium Listing Banner */}
      {premiumTierKey === "VIP" && (
        <div className="mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-50 px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-yellow-400 px-3 py-1 text-sm font-bold text-yellow-900">
              프리미엄 매물
            </span>
            <span className="text-lg font-bold text-yellow-900">
              프리미엄 매물 광고
            </span>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <ImageGallery
        images={listing.images}
        title={listing.title}
        businessCategory={listing.businessCategory}
        showPhotoHint={!listing.images.length && session?.user?.id === listing.sellerId}
      />

      {/* Header: Badges + Title + Address */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white">
            {BUSINESS_CATEGORY_LABELS[listing.businessCategory] ??
              listing.businessCategory}
          </span>
          <span className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
            {STORE_TYPE_LABELS[listing.storeType] ?? listing.storeType}
          </span>
          <span
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              listing.status === "ACTIVE"
                ? "bg-green-50 text-green-700"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {LISTING_STATUS_LABELS[listing.status] ?? listing.status}
          </span>
          {listing.safetyGrade && <SafetyBadge grade={listing.safetyGrade} size="md" />}
          {premiumTierConfig && (
            <span
              className={`rounded-md border px-3 py-1.5 text-sm font-bold ${premiumTierConfig.bg} ${premiumTierConfig.color} ${premiumTierConfig.border}`}
            >
              {premiumTierConfig.badge}
            </span>
          )}
          {listing.seller?.isTrustedSeller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              안심거래
            </span>
          )}
          {listing.hasDiagnosisBadge && <DiagnosisBadge size="md" />}
        </div>

        <h1 className="mt-4 text-3xl font-bold text-navy">{listing.title}</h1>

        <p className="mt-2 flex items-center gap-2 text-gray-600">
          <MapPin className="h-5 w-5" />
          {listing.address}
          {listing.addressDetail ? ` ${listing.addressDetail}` : ""}
        </p>

        {/* View count + like + date */}
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

      {/* Sticky Tab Navigation */}
      <div className="mt-6">
        <DetailTabs />
      </div>

      {/* Main Content Grid: 70/30 */}
      <div className="mt-8 grid gap-8 lg:grid-cols-10">
        {/* Main Content - 7 columns */}
        <div className="lg:col-span-7">
          {/* ===== TAB 1: 매물정보 ===== */}
          <section id="listing-info">
            {/* 권리진단서 카드: 발급 완료 → 요약 카드, 미발급 → CTA 카드 */}
            {listing.hasDiagnosisBadge ? (
              <DiagnosisSummaryCard listingId={listing.id} />
            ) : (
              <DiagnosisCTACard listingId={listing.id} />
            )}

            {/* Price Info Card - 2-Column Grid */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="bg-gradient-to-r from-navy/5 to-navy/10 px-6 py-4">
                <h2 className="text-lg font-bold text-navy">가격 정보</h2>
              </div>
              <div className="p-4">
                {/* Top 2x2 grid: 보증금, 월세, 권리금, 관리비 */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <PriceCard emoji="💰" label="보증금" value={formatKRW(numDeposit)} />
                  <PriceCard emoji="🏠" label="월세" value={numMonthlyRent > 0 ? formatKRW(numMonthlyRent) : null} />
                  <PriceCard
                    emoji="🔑"
                    label="권리금"
                    value={numPremiumFee > 0 ? formatKRW(numPremiumFee) : "무권리"}
                    color="text-orange-600"
                  />
                  <PriceCard emoji="🧾" label="관리비" value={numManagementFee > 0 ? formatKRW(numManagementFee) : null} />
                </div>

                {/* 권리금 세부 breakdown pills (진단서 데이터가 있을 때만) */}
                {diagnosisReport && numPremiumFee > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 px-1">
                    {[
                      { label: "영업", value: diagnosisReport.fairPremiumBusiness },
                      { label: "시설", value: diagnosisReport.fairPremiumFacility },
                      { label: "바닥", value: diagnosisReport.fairPremiumFloor },
                    ].filter((p) => p.value > 0).map((p) => (
                      <span
                        key={p.label}
                        className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                      >
                        {p.label} {formatKRW(p.value)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Revenue row */}
                {(numMonthlyRevenue > 0 || numMonthlyProfit > 0) && (
                  <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <PriceCard emoji="📊" label="월매출" value={numMonthlyRevenue > 0 ? formatKRW(numMonthlyRevenue) : null} color="text-green-600" />
                    <PriceCard emoji="💵" label="월수익" value={numMonthlyProfit > 0 ? formatKRW(numMonthlyProfit) : null} color="text-green-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Quick Summary: 월매출, 월순이익, 투자회수 */}
            {(numMonthlyRevenue > 0 || numMonthlyProfit > 0) && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-purple/20 bg-purple/5 p-3 text-center">
                  <p className="text-[11px] text-gray-500">📊 월매출</p>
                  <p className="mt-0.5 text-sm font-bold text-purple">{formatKRW(numMonthlyRevenue)}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-[11px] text-gray-500">💵 월순이익</p>
                  <p className="mt-0.5 text-sm font-bold text-green-700">{formatKRW(numMonthlyProfit)}</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
                  <p className="text-[11px] text-gray-500">⏱️ 투자회수</p>
                  <p className="mt-0.5 text-sm font-bold text-orange-600">{roiMonths > 0 ? `약 ${roiMonths}개월` : "-"}</p>
                </div>
              </div>
            )}

            {/* Premium Gauge Bar (Item 7: market comparison one-liner) */}
            {numPremiumFee > 0 && avgPremium > 0 && (() => {
              const ratio = numPremiumFee / avgPremium;
              const verdict = ratio <= 0.8 ? "저가" : ratio >= 1.2 ? "고가" : "적정";
              const pct = Math.min(100, Math.round(ratio * 50));
              return (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white px-5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      <TrendingUp className="mr-1 inline h-4 w-4 text-navy" />
                      권리금 시세
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                      verdict === "적정" ? "bg-green-100 text-green-700"
                        : verdict === "저가" ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {listing.district} 평균 대비 {verdict === "적정" ? "적정 수준" : verdict === "저가" ? "저렴한 편" : "높은 편"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="relative h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            verdict === "적정" ? "bg-green-500"
                              : verdict === "저가" ? "bg-blue-500"
                              : "bg-red-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                        {/* Average marker */}
                        <div className="absolute top-0 h-full w-0.5 bg-gray-400" style={{ left: "50%" }} />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                        <span>저렴</span>
                        <span>평균</span>
                        <span>높음</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Store Details */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-navy">매물 정보</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <DetailItem
                  label="업종"
                  value={
                    BUSINESS_CATEGORY_LABELS[listing.businessCategory] ??
                    listing.businessCategory
                  }
                />
                {listing.businessSubtype && (
                  <DetailItem label="세부업종" value={listing.businessSubtype} />
                )}
                {listing.areaM2 && (
                  <DetailItem
                    icon={<Layers className="h-4 w-4" />}
                    label="면적"
                    value={`${listing.areaM2}m² (${areaPyeong?.toFixed(1)}평)`}
                  />
                )}
                {listing.floor != null && (
                  <DetailItem
                    icon={<Building className="h-4 w-4" />}
                    label="층수"
                    value={`${listing.floor}층${listing.totalFloors ? ` / ${listing.totalFloors}층` : ""}`}
                  />
                )}
                {listing.operatingYears != null && (
                  <DetailItem
                    label="영업기간"
                    value={`${listing.operatingYears}년`}
                  />
                )}
                {listing.expiresAt && (
                  <DetailItem
                    icon={<Calendar className="h-4 w-4" />}
                    label="만료일"
                    value={formatDateKR(listing.expiresAt)}
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-xl font-bold text-navy">상세 설명</h2>
              <div className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-6 leading-relaxed text-gray-700">
                {listing.description || (
                  <span className="text-gray-400">상세 설명이 아직 등록되지 않았습니다.</span>
                )}
              </div>
            </div>

            {/* 매출 증빙 없음 (C/D/null) — 매물정보 탭에만 표시 */}

            {(!listing.safetyGrade || listing.safetyGrade === "C" || listing.safetyGrade === "D") && (
              <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 px-6 py-4">
                  <span className="text-xl">⚠️</span>
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-gray-700">매출 증빙 없음</h2>
                    <p className="mt-1 text-sm text-gray-600">이 매물은 매출 증빙이 없습니다. 거래 시 매출 자료를 직접 확인하시기 바랍니다.</p>
                  </div>
                  <a
                    href="#comments"
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    판매자에게 매출자료 요청하기
                  </a>
                </div>
              </div>
            )}

            {/* 권리진단서 상세 카드 (DiagnosisSummaryCard가 상단에서 요약 표시) */}
            {diagnosisReport && (
              <div className="mt-4">
                <DiagnosisCard diagnosis={diagnosisReport} />
              </div>
            )}

            {/* 매도인 전용: 진단서 발급 버튼 */}
            {!diagnosisReport && session?.user?.id === listing.sellerId && (
              <DiagnosisPurchaseButton listingId={listing.id} />
            )}
          </section>

          {/* ===== TAB 2: 수익분석 ===== */}
          <section id="revenue-analysis" className="mt-12">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-navy">수익 분석</h2>
              {listing.safetyGrade && <SafetyBadge grade={listing.safetyGrade} size="md" />}
            </div>

            {/* 매출 인증/증빙 통합 카드 (A/B등급만) */}
            {(listing.safetyGrade === "A" || listing.safetyGrade === "B") && (
              <div className={`mt-4 flex flex-wrap items-center gap-3 rounded-xl border px-5 py-3 ${
                listing.safetyGrade === "A"
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50"
              }`}>
                <SafetyBadge grade={listing.safetyGrade} size="md" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${listing.safetyGrade === "A" ? "text-green-800" : "text-amber-800"}`}>
                    {listing.safetyGrade === "A"
                      ? "홈택스/여신금융협회 매출 검증 완료"
                      : "매출 증빙자료 제출 완료"}
                  </p>
                  {listing.safetyComment && (
                    <p className={`mt-0.5 text-xs ${listing.safetyGrade === "A" ? "text-green-600" : "text-amber-600"}`}>
                      {listing.safetyComment}
                    </p>
                  )}
                </div>
                {!hasRevenueAccess && (
                  <div className="flex shrink-0 gap-2">
                    <Link
                      href={`/api/payments/single?listingId=${listing.id}`}
                      className="rounded-lg border border-navy px-3 py-1.5 text-xs font-bold text-navy transition-colors hover:bg-navy/5"
                    >
                      증빙 열람 {VIEWER_PLANS.SINGLE.price.toLocaleString()}원
                    </Link>
                    <Link
                      href="/pricing#viewer"
                      className="rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-navy/90"
                    >
                      월 구독
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Revenue/Profit Summary Cards */}
            {(numMonthlyRevenue > 0 || numMonthlyProfit > 0) ? (
              <>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <SummaryCard
                    label="월매출"
                    value={formatKRW(numMonthlyRevenue)}
                    color="purple"
                  />
                  <SummaryCard
                    label="월순이익"
                    value={formatKRW(numMonthlyProfit)}
                    color="green"
                  />
                  <SummaryCard
                    label="총 투자금"
                    value={formatKRW(totalInvestment)}
                    color="navy"
                  />
                  <SummaryCard
                    label="투자회수기간"
                    value={roiMonths > 0 ? `약 ${roiMonths}개월` : "-"}
                    color="orange"
                  />
                </div>

                {/* Revenue Grade Message */}
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
                  <RevenueGradeMessage
                    grade={listing.safetyGrade}
                    monthlyRevenue={numMonthlyRevenue}
                    monthlyProfit={numMonthlyProfit}
                  />
                </div>

                {/* Cost Structure (Free) */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {/* Cost Table */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <div className="border-b border-gray-100 px-6 py-4">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-navy">
                            월 지출 내역 (판매자 입력)
                          </h3>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">판매자 제공</span>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">* 판매자가 직접 입력한 정보이며, 실제와 다를 수 있습니다</p>
                      </div>
                      <div className="divide-y divide-gray-100">
                        <CostRow label="임대료 (월세+관리비)" value={totalRent} />
                        <CostRow label="인건비 (추정)" value={laborCost} />
                        <CostRow label="재료비/원가 (추정)" value={materialCost} />
                        <CostRow label="기타비용 (추정)" value={otherCost} />
                        <div className="flex items-center justify-between bg-purple/5 px-6 py-3">
                          <span className="text-sm font-bold text-navy">
                            월 순수익
                          </span>
                          <span className="text-base font-bold text-purple">
                            {formatKRW(numMonthlyProfit)}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 px-6 py-2">
                        <p className="text-[11px] text-gray-400">
                          * 인건비/재료비는 업종 평균 기준 추정치입니다
                        </p>
                      </div>
                    </div>

                    {/* Cost Pie Chart */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
                      <h3 className="mb-2 text-base font-semibold text-navy">
                        매출 구성
                      </h3>
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
                  <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-r from-navy/5 to-navy/10">
                    <div className="px-6 py-5">
                      <h3 className="text-base font-semibold text-navy">
                        투자 수익률 (ROI)
                      </h3>
                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-500">보증금</p>
                          <p className="mt-1 text-sm font-bold text-navy">
                            {formatKRW(numDeposit)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">권리금</p>
                          <p className="mt-1 text-sm font-bold text-orange-600">
                            {numPremiumFee > 0
                              ? formatKRW(numPremiumFee)
                              : "무권리"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">투자회수</p>
                          <p className="mt-1 text-sm font-bold text-purple">
                            {roiMonths > 0 ? `약 ${roiMonths}개월` : "-"}
                          </p>
                        </div>
                      </div>
                      {annualROI > 0 && (
                        <div className={`mt-4 rounded-xl border p-4 text-center ${roiBgClass}`}>
                          <p className="text-xs text-gray-500">연간 투자수익률 (ROI)</p>
                          <p className={`mt-1 text-2xl font-bold ${roiColorClass}`}>
                            {annualROI.toFixed(1)}%
                          </p>
                          <p className="mt-1 text-[11px] text-gray-400">
                            (월수익 × 12) ÷ (보증금 + 권리금) × 100
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
                              className="h-full rounded-full bg-gradient-to-r from-purple to-navy transition-all"
                              style={{
                                width: `${Math.min(100, (12 / roiMonths) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            1년 기준 회수율:{" "}
                            <span className={`font-semibold ${roiColorClass}`}>
                              {((12 / roiMonths) * 100).toFixed(1)}%
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

              </>
            ) : (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-6 py-12 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  매출/수익 정보가 등록되지 않은 매물입니다
                </p>
              </div>
            )}
          </section>

          {/* ===== TAB 3: 주변시세 ===== */}
          <section id="market-comparison" className="mt-12">
            <h2 className="text-xl font-bold text-navy">주변 시세</h2>

            {(marketPrice || districtListings.length > 0) ? (
              <>
                {/* Market Price Chart */}
                {numPremiumFee > 0 && (avgPremium > 0 || realAvgPremium > 0) && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-navy" />
                      <h3 className="text-base font-semibold text-navy">
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
                                ? "bg-green-100 text-green-700"
                                : verdict === "저가"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
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
                            className="flex items-center gap-1 text-sm text-navy hover:underline"
                          >
                            상세 시세 보기
                          </Link>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Market Price Stats */}
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-6 py-4">
                    <h3 className="text-base font-semibold text-navy">
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
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-6 py-12 text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  해당 지역의 시세 데이터가 아직 충분하지 않습니다
                </p>
              </div>
            )}

            {/* Nearby Listings Table */}
            {districtListings.length > 0 && (
              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="text-base font-semibold text-navy">
                    인근 매물 비교
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
                        <th className="px-4 py-3 font-medium">매물명</th>
                        <th className="px-4 py-3 font-medium">업종</th>
                        <th className="px-4 py-3 font-medium text-right">
                          보증금
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          권리금
                        </th>
                        <th className="px-4 py-3 font-medium text-right">
                          월세
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* Current listing row */}
                      <tr className="bg-navy/5">
                        <td className="px-4 py-3 font-semibold text-navy">
                          {listing.title}
                          <span className="ml-2 inline-flex items-center rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-white">
                            이 매물
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {BUSINESS_CATEGORY_LABELS[
                            listing.businessCategory
                          ] ?? listing.businessCategory}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-navy">
                          {formatKRW(listing.price)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-orange-600">
                          {numPremiumFee > 0
                            ? formatKRW(numPremiumFee)
                            : "무권리"}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {numMonthlyRent > 0
                            ? formatKRW(numMonthlyRent)
                            : "-"}
                        </td>
                      </tr>
                      {districtListings.slice(0, 3).map((sl) => (
                        <tr key={sl.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              href={`/listings/${sl.id}`}
                              className="font-medium text-gray-800 hover:text-navy"
                            >
                              {sl.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {BUSINESS_CATEGORY_LABELS[sl.businessCategory] ??
                              sl.businessCategory}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-navy">
                            {formatKRW(sl.price)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-orange-600">
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

          {/* ===== Bottom Section ===== */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            {/* Share */}
            <div className="flex items-center justify-between">
              <ShareButtons listingId={listing.id} title={listing.title} />
            </div>

            {/* Expert Consultation CTA */}
            <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="bg-gradient-to-r from-navy/5 to-navy/10 px-6 py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-navy" />
                  <h2 className="text-lg font-bold text-navy">
                    전문가에게 물어보세요
                  </h2>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  이 매물에 대해 전문가의 의견을 들어보세요
                </p>
              </div>

              {recommendedExperts.length > 0 ? (
                <>
                  <div className="divide-y divide-gray-100">
                    {recommendedExperts.map(
                      (expert: {
                        id: string;
                        name: string;
                        title: string;
                        rating: number;
                        category: string;
                      }) => (
                        <div
                          key={expert.id}
                          className="flex items-center justify-between px-6 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-sm font-bold text-navy">
                              {expert.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {expert.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{expert.title}</span>
                                {expert.rating > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {expert.rating.toFixed(1)}
                                  </span>
                                )}
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                                  {EXPERT_CATEGORY_LABELS[expert.category] ??
                                    expert.category}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/experts/${expert.id}?listingId=${listing.id}`}
                            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-dark"
                          >
                            상담 신청
                          </Link>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="border-t border-gray-100 px-6 py-3">
                    <Link
                      href="/experts"
                      className="flex items-center gap-1 text-sm font-medium text-navy hover:underline"
                    >
                      전문가 더 보기
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="px-6 py-6 text-center">
                  <p className="text-sm text-gray-500">
                    전문가 상담이 필요하신가요?
                  </p>
                  <Link
                    href="/experts"
                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
                  >
                    전문가 찾기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

            {/* ===== Comment Section ===== */}
            <div id="comments" className="mt-8">
              <CommentSectionWrapper listingId={listing.id} sellerId={listing.sellerId} />
            </div>
        </div>

        {/* ===== Sidebar - 3 columns ===== */}
        <div className="lg:col-span-3">
          <div className="sticky top-28 space-y-4">
            {/* Seller Info Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                판매자
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy/10 text-lg font-bold text-navy">
                  {listing.seller?.name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-navy">
                    {listing.seller?.name ?? "미인증"}
                  </p>
                  {listing.seller?.isTrustedSeller ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      <ShieldCheck className="h-3 w-3" />
                      안심거래 판매자
                    </span>
                  ) : (
                    <p className="text-xs text-gray-500">판매자</p>
                  )}
                </div>
              </div>

            </div>

            <ContactSection
              listingId={listing.id}
              sellerId={listing.sellerId}
              contactPhone={listing.contactPhone}
              contactEmail={listing.contactEmail}
              isPhonePublic={listing.isPhonePublic}
            />

            {/* Compare Button */}
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

            {/* Simulator Button */}
            <Link
              href={`/simulator?listingId=${listing.id}&keyMoney=${Math.round(Number(listing.premiumFee || 0) / 10000)}&deposit=${Math.round(Number(listing.price || 0) / 10000)}&monthlyRent=${Math.round(Number(listing.monthlyRent || 0) / 10000)}&businessType=${encodeURIComponent(BUSINESS_CATEGORY_LABELS[listing.businessCategory] || "기타")}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-navy bg-navy/5 px-4 py-3 text-sm font-bold text-navy transition-colors hover:bg-navy/10"
            >
              <Calculator className="h-4 w-4" />이 매물로 창업 시뮬레이션
            </Link>

            {/* Disclaimer */}
            <div className="rounded-lg bg-yellow-50 p-4 text-xs leading-relaxed text-yellow-800">
              <p className="font-medium">주의사항</p>
              <p className="mt-2">
                본 매물 정보는 판매자가 등록한 것으로, 권리샵은 정보의
                정확성을 보증하지 않습니다. 중요한 거래 결정 시{" "}
                <Link
                  href="/legal/disclaimer"
                  className="font-medium underline hover:text-yellow-900"
                >
                  면책조항
                </Link>
                을 확인하시고 전문가 검토를 받으시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== District Similar Listings ===== */}
      {districtListings.length > 0 && (
        <div className="mt-16 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-navy">이 지역 유사 매물</h2>
            <Link
              href={`/listings?district=${listing.district}&city=${listing.city}`}
              className="flex items-center gap-1 text-sm font-medium text-navy hover:underline"
            >
              더보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {districtListings.slice(0, 4).map((sl) => (
              <SimilarListingCard key={sl.id} sl={sl} />
            ))}
          </div>
        </div>
      )}

      {/* ===== Category Similar Listings ===== */}
      {categoryListings.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-navy">같은 업종 추천 매물</h2>
            <Link
              href={`/listings?businessCategory=${listing.businessCategory}`}
              className="flex items-center gap-1 text-sm font-medium text-navy hover:underline"
            >
              더보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryListings.slice(0, 4).map((sl) => (
              <SimilarListingCard key={sl.id} sl={sl} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Helper Components ===== */

const SIMILAR_CAT_MAP: Record<string, { gradient: string; icon: string }> = {
  CAFE_BAKERY:   { gradient: "from-amber-800/70 to-amber-600/50", icon: "☕" },
  CHICKEN:       { gradient: "from-orange-600/70 to-orange-400/50", icon: "🍗" },
  KOREAN_FOOD:   { gradient: "from-red-700/70 to-red-500/50", icon: "🍚" },
  PIZZA:         { gradient: "from-yellow-600/70 to-yellow-400/50", icon: "🍕" },
  BUNSIK:        { gradient: "from-pink-600/70 to-pink-400/50", icon: "🍜" },
  RETAIL:        { gradient: "from-blue-700/70 to-blue-500/50", icon: "🏪" },
  BAR_PUB:       { gradient: "from-purple-700/70 to-purple-500/50", icon: "🍺" },
  WESTERN_FOOD:  { gradient: "from-rose-700/70 to-rose-500/50", icon: "🍝" },
  SERVICE:       { gradient: "from-blue-800/70 to-blue-600/50", icon: "✂️" },
  ENTERTAINMENT: { gradient: "from-indigo-700/70 to-indigo-500/50", icon: "🎮" },
  EDUCATION:     { gradient: "from-cyan-700/70 to-cyan-500/50", icon: "📚" },
};

const SIMILAR_GRADE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  A: { label: "A등급", color: "text-green-700", bg: "bg-green-100" },
  B: { label: "B등급", color: "text-blue-700", bg: "bg-blue-100" },
  C: { label: "C등급", color: "text-amber-700", bg: "bg-amber-100" },
  D: { label: "C등급", color: "text-amber-700", bg: "bg-amber-100" },
};

function SimilarListingCard({ sl }: { sl: { id: string; title: string; businessCategory: string; city: string; district: string; price: number | bigint; premiumFee?: number | bigint | null; safetyGrade?: string | null; images: { url: string; thumbnailUrl?: string | null }[] } }) {
  const thumb = sl.images[0]?.thumbnailUrl ?? sl.images[0]?.url ?? null;
  const catInfo = SIMILAR_CAT_MAP[sl.businessCategory] ?? { gradient: "from-gray-600/70 to-gray-400/50", icon: "🏠" };
  const gradeConfig = sl.safetyGrade ? SIMILAR_GRADE_MAP[sl.safetyGrade] ?? null : null;

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
          <div className={`flex h-full items-center justify-center bg-gradient-to-br ${catInfo.gradient}`}>
            <span className="text-4xl drop-shadow-lg">{catInfo.icon}</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-navy/80 px-2 py-0.5 text-[11px] font-medium text-white">
          {BUSINESS_CATEGORY_LABELS[sl.businessCategory] ?? sl.businessCategory}
        </span>
        {gradeConfig && (
          <span className={`absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${gradeConfig.bg} ${gradeConfig.color}`}>
            {gradeConfig.label}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="truncate text-sm font-semibold text-gray-800 group-hover:text-navy">
          {sl.title}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {sl.city} {sl.district}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-bold text-orange-600">
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

function PriceCard({
  emoji,
  label,
  value,
  color,
}: {
  emoji: string;
  label: string;
  value: string | null;
  color?: string;
}) {
  const hasValue = value !== null;
  return (
    <div
      className={`rounded-lg p-4 ${
        hasValue
          ? "bg-gray-50"
          : "border border-dashed border-gray-300 bg-white"
      }`}
    >
      <p className="text-sm text-gray-500">
        <span className="mr-1">{emoji}</span>
        {label}
      </p>
      {hasValue ? (
        <p className={`mt-1 text-xl font-bold ${color ?? "text-gray-900"}`}>
          {value}
        </p>
      ) : (
        <p className="mt-1 text-lg italic text-gray-300">미입력</p>
      )}
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon} {label}
      </p>
      <p className="mt-2 font-semibold text-navy">{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "green" | "navy" | "orange" | "purple";
}) {
  const colorMap = {
    green: "border-green-200 bg-green-50",
    navy: "border-navy/20 bg-navy/5",
    orange: "border-orange-200 bg-orange-50",
    purple: "border-purple/30 bg-purple/5",
  };
  const textMap = {
    green: "text-green-700",
    navy: "text-navy",
    orange: "text-orange-600",
    purple: "text-purple",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-bold ${textMap[color]}`}>{value}</p>
    </div>
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
      <p className="mt-1 text-sm font-bold text-navy">{value}</p>
    </div>
  );
}

