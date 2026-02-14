import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin, Calendar, Eye, Building, Layers,
  FileSearch, TrendingUp, Calculator, Star, Users,
  ArrowRight, MapPinned, Footprints, Store, Shield, ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
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
import { m2ToPyeong } from "@/lib/utils/area";
import { ImageGallery } from "./image-gallery";
import { ShareButtons } from "./share-buttons";
import { CompareSection } from "./compare-section";
import { DetailTabs } from "./detail-tabs";
import { RevenueBarChart, CostPieChart } from "./revenue-charts";
import { MarketBarChart } from "./market-charts";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const session = await auth();

  const listingData = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listingData || listingData.status === "DELETED") {
    notFound();
  }

  const [images, seller, marketPrice, recommendedExperts, similarListings] =
    await Promise.all([
      prisma.listingImage.findMany({
        where: { listingId: id },
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
        orderBy: [
          { isVerified: "desc" },
          { rating: "desc" },
          { consultCount: "desc" },
        ],
        take: 3,
      }),
      prisma.listing.findMany({
        where: {
          id: { not: id },
          status: "ACTIVE",
          OR: [
            { district: listingData.district },
            { businessCategory: listingData.businessCategory },
            { city: listingData.city },
          ],
        },
        include: {
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  const listing = { ...listingData, images, seller };

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* VIP Premium Banner */}
      {premiumTierKey === "VIP" && (
        <div className="mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-50 px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-yellow-400 px-3 py-1 text-sm font-bold text-yellow-900">
              VIP
            </span>
            <span className="text-lg font-bold text-yellow-900">
              VIP 프리미엄 매물
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
          {listing.safetyGrade && SAFETY_GRADE_CONFIG[listing.safetyGrade] && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-bold ${SAFETY_GRADE_CONFIG[listing.safetyGrade].bg} ${SAFETY_GRADE_CONFIG[listing.safetyGrade].color} ${SAFETY_GRADE_CONFIG[listing.safetyGrade].border}`}
            >
              <Shield className="h-4 w-4" />
              안전 {SAFETY_GRADE_CONFIG[listing.safetyGrade].label}
              <span className="hidden font-normal sm:inline">· {SAFETY_GRADE_CONFIG[listing.safetyGrade].description}</span>
            </span>
          )}
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
          {listing.hasDiagnosisBadge && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
              권리진단 완료
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-bold text-navy">{listing.title}</h1>

        <p className="mt-2 flex items-center gap-2 text-gray-600">
          <MapPin className="h-5 w-5" />
          {listing.address}
          {listing.addressDetail ? ` ${listing.addressDetail}` : ""}
        </p>

        {/* View count + date (prominent position) */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            조회 {formatNumber(listing.viewCount)}회
          </span>
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
            {/* 권리진단서 CTA Banner (moved above price card for visibility) */}
            <div className="mb-6 overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50">
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <FileSearch className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">
                      이 매물의 권리진단서를 발급받으세요
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      권리금 적정성 + 위험요소까지 분석해드립니다
                    </p>
                  </div>
                </div>
                <Link
                  href={`/reports/request/${listing.id}`}
                  className="shrink-0 rounded-lg bg-[#F59E0B] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#D97706]"
                >
                  권리진단서 발급
                </Link>
              </div>
            </div>

            {/* Price Info Card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="bg-gradient-to-r from-navy/5 to-navy/10 px-6 py-4">
                <h2 className="text-lg font-bold text-navy">가격 정보</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <PriceRow label="보증금" value={formatKRW(listing.price)} />
                {listing.monthlyRent && Number(listing.monthlyRent) > 0 && (
                  <PriceRow
                    label="월세"
                    value={formatKRW(listing.monthlyRent)}
                  />
                )}
                {listing.premiumFee && Number(listing.premiumFee) > 0 ? (
                  <PriceRow
                    label="권리금"
                    value={formatKRW(listing.premiumFee)}
                    highlight="orange"
                  />
                ) : (
                  <PriceRow label="권리금" value="무권리" highlight="navy" />
                )}
                {listing.managementFee &&
                  Number(listing.managementFee) > 0 && (
                    <PriceRow
                      label="관리비"
                      value={formatKRW(listing.managementFee)}
                      secondary
                    />
                  )}
                {listing.monthlyRevenue &&
                  Number(listing.monthlyRevenue) > 0 && (
                    <PriceRow
                      label="월매출"
                      value={formatKRW(listing.monthlyRevenue)}
                      highlight="navy"
                    />
                  )}
                {listing.monthlyProfit &&
                  Number(listing.monthlyProfit) > 0 && (
                    <PriceRow
                      label="월수익"
                      value={formatKRW(listing.monthlyProfit)}
                      highlight="green"
                    />
                  )}
              </div>
            </div>

            {/* Revenue Quick Summary (Item 6: preview in TAB 1) */}
            {(numMonthlyRevenue > 0 || numMonthlyProfit > 0) && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-purple/20 bg-purple/5 p-3 text-center">
                  <p className="text-[11px] text-gray-500">월매출</p>
                  <p className="mt-0.5 text-sm font-bold text-purple">{formatKRW(numMonthlyRevenue)}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-[11px] text-gray-500">월순이익</p>
                  <p className="mt-0.5 text-sm font-bold text-green-700">{formatKRW(numMonthlyProfit)}</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
                  <p className="text-[11px] text-gray-500">투자회수</p>
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
                {listing.description}
              </div>
            </div>

            {/* 권리 안전도 분석 */}
            {listing.safetyGrade &&
              SAFETY_GRADE_CONFIG[listing.safetyGrade] &&
              (() => {
                const gradeConfig =
                  SAFETY_GRADE_CONFIG[listing.safetyGrade!];
                return (
                  <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div
                      className={`flex items-center gap-3 px-6 py-4 ${gradeConfig.bg}`}
                    >
                      <Shield className="h-5 w-5 text-navy" />
                      <span
                        className={`rounded-lg border px-3 py-1.5 text-lg font-bold ${gradeConfig.bg} ${gradeConfig.color} ${gradeConfig.border}`}
                      >
                        {gradeConfig.label}
                      </span>
                      <div>
                        <h2 className="text-lg font-bold text-navy">
                          권리 안전도
                        </h2>
                        <p className="text-sm text-gray-600">
                          {gradeConfig.description}
                        </p>
                      </div>
                    </div>
                    {listing.safetyComment && (
                      <div className="px-6 py-4">
                        <p className="text-sm text-gray-700">
                          {listing.safetyComment}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Diagnosis promotion banner for listings without badge */}
            {!listing.hasDiagnosisBadge && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-sm font-semibold text-emerald-800">이 매물의 권리진단서를 발급받으세요</p>
                <p className="text-xs text-emerald-600 mt-1">권리진단서를 발급받으면 &ldquo;권리진단 완료&rdquo; 배지가 자동으로 부여됩니다.</p>
              </div>
            )}
          </section>

          {/* ===== TAB 2: 수익분석 ===== */}
          <section id="revenue-analysis" className="mt-12">
            <h2 className="text-xl font-bold text-navy">수익 분석</h2>

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

                {/* Monthly Revenue/Profit Trend Chart */}
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-base font-semibold text-navy">
                    월별 매출 추이 (예상)
                  </h3>
                  <RevenueBarChart
                    monthlyRevenue={numMonthlyRevenue}
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    * 현재 매출/순이익 기준 예상 추이이며 실제와 다를 수 있습니다
                  </p>
                </div>

                {/* Cost Structure */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {/* Cost Table */}
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-6 py-4">
                      <h3 className="text-base font-semibold text-navy">
                        비용 구조 (추정)
                      </h3>
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
                          <span className="font-semibold text-purple">
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

            {marketPrice ? (
              <>
                {/* Market Price Chart */}
                {numPremiumFee > 0 && (
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
                      avgPremium={avgPremium}
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
                      value={formatKRW(marketPrice.avgKeyMoney)}
                    />
                    <MarketStat
                      label="평균 보증금"
                      value={formatKRW(marketPrice.avgDeposit)}
                    />
                    <MarketStat
                      label="평균 월세"
                      value={formatKRW(marketPrice.avgMonthlyRent)}
                    />
                    <MarketStat
                      label="샘플 수"
                      value={`${marketPrice.sampleCount}건`}
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
            {similarListings.length > 0 && (
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
                          <span className="ml-1.5 text-[10px] font-bold text-navy">
                            현재
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
                      {similarListings.slice(0, 3).map((sl) => (
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
          <section id="location-info" className="mt-12">
            <h2 className="text-xl font-bold text-navy">위치 정보</h2>

            {/* Map Placeholder */}
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-200">
              <div className="flex aspect-[16/9] items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPinned className="mx-auto h-16 w-16 text-gray-400" />
                  <p className="mt-3 text-lg font-semibold text-gray-600">지도 준비중</p>
                  <p className="mt-1 text-sm text-gray-400">카카오맵 연동 예정</p>
                </div>
              </div>
            </div>

            {/* Location Details Grid */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Nearby Facilities */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                  <Store className="h-4 w-4 text-navy" />
                  <h3 className="text-sm font-semibold text-navy">
                    주변 시설
                  </h3>
                </div>
                <div className="divide-y divide-gray-50 px-5 py-2">
                  <FacilityRow emoji="🚇" name="지하철역" distance="도보 5분" />
                  <FacilityRow emoji="🚌" name="버스정류장" distance="도보 2분" />
                  <FacilityRow emoji="🏦" name="은행/ATM" distance="도보 3분" />
                  <FacilityRow emoji="🅿️" name="주차장" distance="도보 4분" />
                  <FacilityRow emoji="🏥" name="병원/약국" distance="도보 6분" />
                </div>
                <div className="border-t border-gray-100 px-5 py-3">
                  <p className="text-[11px] text-gray-400">
                    * 예상 거리이며 실제와 다를 수 있습니다
                  </p>
                </div>
              </div>

              {/* Foot Traffic */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                  <Footprints className="h-4 w-4 text-navy" />
                  <h3 className="text-sm font-semibold text-navy">
                    유동인구 (추정)
                  </h3>
                </div>
                <div className="px-5 py-4">
                  <div className="space-y-3">
                    <TrafficRow time="오전 (6-12시)" level={60} label="보통" />
                    <TrafficRow time="점심 (12-14시)" level={90} label="매우 많음" />
                    <TrafficRow time="오후 (14-18시)" level={70} label="많음" />
                    <TrafficRow time="저녁 (18-22시)" level={85} label="많음" />
                    <TrafficRow time="야간 (22-6시)" level={30} label="적음" />
                  </div>
                </div>
                <div className="border-t border-gray-100 px-5 py-3">
                  <p className="text-[11px] text-gray-400">
                    * 예상 데이터이며 실제와 다를 수 있습니다
                  </p>
                </div>
              </div>
            </div>

            {/* Address & Nearby Info */}
            <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-6 py-5">
                <p className="text-xs font-medium text-gray-500">주소</p>
                <p className="mt-1 text-xl font-bold text-navy">
                  {listing.address}
                  {listing.addressDetail ? ` ${listing.addressDetail}` : ""}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {listing.city} {listing.district}
                  {listing.neighborhood ? ` ${listing.neighborhood}` : ""}
                  {listing.postalCode ? ` (${listing.postalCode})` : ""}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    🚇 가장 가까운 지하철역
                  </span>
                  <span className="text-sm font-semibold text-navy">
                    {listing.district.replace(/구$/, "")}역 도보 5분
                  </span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    🚌 주변 버스정류장
                  </span>
                  <span className="text-sm font-semibold text-navy">3개</span>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    👥 일평균 유동인구
                  </span>
                  <span className="text-sm font-semibold text-navy">약 32,000명 (추정)</span>
                </div>
              </div>
              <div className="border-t border-gray-100 px-6 py-2">
                <p className="text-[11px] text-gray-400">
                  * 유동인구는 추정치이며 실제와 다를 수 있습니다
                </p>
              </div>
            </div>
          </section>

          {/* ===== Bottom Section ===== */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            {/* Share + Stats */}
            <div className="flex items-center justify-between">
              <ShareButtons listingId={listing.id} title={listing.title} />
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  조회 {formatNumber(listing.viewCount)}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  등록 {formatDateKR(listing.createdAt)}
                </span>
              </div>
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

      {/* ===== Similar Listings Section ===== */}
      {similarListings.length > 0 && (
        <div className="mt-16 border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-navy">비슷한 매물 추천</h2>
            <Link
              href={`/listings?businessCategory=${listing.businessCategory}&city=${listing.city}`}
              className="flex items-center gap-1 text-sm font-medium text-navy hover:underline"
            >
              더보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarListings.slice(0, 4).map((sl) => {
              const slThumb =
                sl.images[0]?.thumbnailUrl ?? sl.images[0]?.url ?? null;
              const slCat: Record<string, { gradient: string; icon: string }> = {
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
              const catInfo = slCat[sl.businessCategory] ?? { gradient: "from-gray-600/70 to-gray-400/50", icon: "🏠" };
              const gradeConfig = sl.safetyGrade ? (
                { A: { label: "A등급", color: "text-green-700", bg: "bg-green-100" },
                  B: { label: "B등급", color: "text-blue-700", bg: "bg-blue-100" },
                  C: { label: "C등급", color: "text-amber-700", bg: "bg-amber-100" },
                  D: { label: "D등급", color: "text-red-700", bg: "bg-red-100" },
                } as Record<string, { label: string; color: string; bg: string }>
              )[sl.safetyGrade] : null;
              return (
                <Link
                  key={sl.id}
                  href={`/listings/${sl.id}`}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {slThumb ? (
                      <Image
                        src={slThumb}
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
                      {BUSINESS_CATEGORY_LABELS[sl.businessCategory] ??
                        sl.businessCategory}
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
                        {sl.premiumFee && Number(sl.premiumFee) > 0
                          ? formatKRW(sl.premiumFee)
                          : "무권리"}
                      </span>
                      <span className="text-xs text-gray-400">
                        보증금 {formatKRW(sl.price)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Helper Components ===== */

function PriceRow({
  label,
  value,
  highlight,
  secondary,
}: {
  label: string;
  value: string;
  highlight?: "orange" | "navy" | "green";
  secondary?: boolean;
}) {
  const valueClass = highlight
    ? highlight === "orange"
      ? "text-orange-600 font-bold"
      : highlight === "navy"
        ? "text-purple font-bold"
        : "text-green-600 font-bold"
    : secondary
      ? "text-gray-600"
      : "text-navy font-semibold";

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-lg ${valueClass}`}>{value}</span>
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

function FacilityRow({
  emoji,
  name,
  distance,
}: {
  emoji: string;
  name: string;
  distance: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="flex items-center gap-2 text-sm text-gray-700">
        <span>{emoji}</span>
        {name}
      </span>
      <span className="text-xs text-gray-500">{distance}</span>
    </div>
  );
}

function TrafficRow({
  time,
  level,
  label,
}: {
  time: string;
  level: number;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{time}</span>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-navy transition-all"
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}
