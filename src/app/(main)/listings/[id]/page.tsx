import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Eye, Building, Layers, Phone, Mail, FileSearch, TrendingUp, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { InquiryForm } from "@/components/listings/inquiry-form";
import { formatKRW, formatDateKR, formatNumber } from "@/lib/utils/format";
import {
  BUSINESS_CATEGORY_LABELS,
  STORE_TYPE_LABELS,
  LISTING_STATUS_LABELS,
  SAFETY_GRADE_CONFIG,
  PREMIUM_AD_CONFIG,
} from "@/lib/utils/constants";
import { m2ToPyeong } from "@/lib/utils/area";
import { ImageGallery } from "./image-gallery";
import { ShareButtons } from "./share-buttons";
import { CompareSection } from "./compare-section";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { title: true, city: true, district: true },
  });
  if (!listing) return { title: "매물을 찾을 수 없습니다" };
  return {
    title: `${listing.title} - ${listing.city} ${listing.district}`,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  const listingData = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listingData || listingData.status === "DELETED") {
    notFound();
  }

  const [images, seller, marketPrice] = await Promise.all([
    prisma.listingImage.findMany({
      where: { listingId: id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: listingData.sellerId },
      select: { id: true, name: true, image: true },
    }),
    prisma.marketPrice.findFirst({
      where: {
        subRegion: listingData.district,
        businessType: listingData.businessCategory,
      },
    }),
  ]);

  const listing = { ...listingData, images, seller };

  // Track view (fire-and-forget)
  prisma.listing
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const areaPyeong = listing.areaM2 ? m2ToPyeong(listing.areaM2) : null;

  const premiumTierKey = listing.premiumRank === 3 ? "VIP" : listing.premiumRank === 2 ? "PREMIUM" : listing.premiumRank === 1 ? "BASIC" : null;
  const premiumTierConfig = premiumTierKey ? PREMIUM_AD_CONFIG[premiumTierKey] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* VIP Premium Banner */}
      {premiumTierKey === "VIP" && (
        <div className="mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-50 px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-yellow-400 px-3 py-1 text-sm font-bold text-yellow-900">VIP</span>
            <span className="text-lg font-bold text-yellow-900">VIP 프리미엄 매물</span>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      <ImageGallery images={listing.images} title={listing.title} />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2">
          {/* Badges */}
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
              <span className={`rounded-md px-3 py-1.5 text-sm font-bold border ${SAFETY_GRADE_CONFIG[listing.safetyGrade].bg} ${SAFETY_GRADE_CONFIG[listing.safetyGrade].color} ${SAFETY_GRADE_CONFIG[listing.safetyGrade].border}`}>
                안전 {SAFETY_GRADE_CONFIG[listing.safetyGrade].label}
              </span>
            )}
            {premiumTierConfig && (
              <span className={`rounded-md px-3 py-1.5 text-sm font-bold border ${premiumTierConfig.bg} ${premiumTierConfig.color} ${premiumTierConfig.border}`}>
                {premiumTierConfig.badge}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-4 text-3xl font-bold text-navy">{listing.title}</h1>

          {/* Address */}
          <p className="mt-2 flex items-center gap-2 text-gray-600">
            <MapPin className="h-5 w-5" />
            {listing.address}
            {listing.addressDetail ? ` ${listing.addressDetail}` : ""}
          </p>

          {/* Price Info Card */}
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="bg-gradient-to-r from-mint/5 to-navy/5 px-6 py-4">
              <h2 className="text-lg font-bold text-navy">가격 정보</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <PriceRow label="보증금" value={formatKRW(listing.price)} />
              {listing.monthlyRent && Number(listing.monthlyRent) > 0 && (
                <PriceRow label="월세" value={formatKRW(listing.monthlyRent)} />
              )}
              {listing.premiumFee && Number(listing.premiumFee) > 0 ? (
                <PriceRow
                  label="권리금"
                  value={formatKRW(listing.premiumFee)}
                  highlight="orange"
                />
              ) : (
                <PriceRow label="권리금" value="무권리" highlight="mint" />
              )}
              {listing.managementFee && Number(listing.managementFee) > 0 && (
                <PriceRow
                  label="관리비"
                  value={formatKRW(listing.managementFee)}
                  secondary
                />
              )}
              {listing.monthlyRevenue && Number(listing.monthlyRevenue) > 0 && (
                <PriceRow
                  label="월매출"
                  value={formatKRW(listing.monthlyRevenue)}
                  highlight="mint"
                />
              )}
              {listing.monthlyProfit && Number(listing.monthlyProfit) > 0 && (
                <PriceRow
                  label="월수익"
                  value={formatKRW(listing.monthlyProfit)}
                  highlight="green"
                />
              )}
            </div>
          </div>

          {/* 권리 안전도 분석 */}
          {listing.safetyGrade && SAFETY_GRADE_CONFIG[listing.safetyGrade] && (() => {
            const gradeConfig = SAFETY_GRADE_CONFIG[listing.safetyGrade!];
            return (
              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className={`flex items-center gap-3 px-6 py-4 ${gradeConfig.bg}`}>
                  <span className={`rounded-lg px-3 py-1.5 text-lg font-bold border ${gradeConfig.bg} ${gradeConfig.color} ${gradeConfig.border}`}>
                    {gradeConfig.label}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-navy">권리 안전도</h2>
                    <p className="text-sm text-gray-600">{gradeConfig.description}</p>
                  </div>
                </div>
                {listing.safetyComment && (
                  <div className="px-6 py-4">
                    <p className="text-sm text-gray-700">{listing.safetyComment}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 권리분석 리포트 CTA Banner */}
          <div className="mt-6 overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <FileSearch className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">더 자세한 분석이 필요하신가요?</p>
                  <p className="mt-0.5 text-sm text-gray-600">권리금 적정성 + 위험요소 분석 리포트를 받아보세요</p>
                </div>
              </div>
              <Link
                href={`/reports/request/${listing.id}`}
                className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                권리분석 리포트 신청
              </Link>
            </div>
          </div>

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
                  value={`${listing.floor}층${
                    listing.totalFloors ? ` / ${listing.totalFloors}층` : ""
                  }`}
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

          {/* 시세 비교 미니 위젯 */}
          {marketPrice && (
            <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gradient-to-r from-mint/5 to-white px-5 py-3">
                <TrendingUp className="h-4 w-4 text-mint" />
                <h3 className="text-sm font-bold text-navy">이 지역 시세</h3>
                <span className="text-xs text-gray-500">
                  {listing.district} · {BUSINESS_CATEGORY_LABELS[listing.businessCategory]}
                </span>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">지역 평균 권리금</span>
                  <span className="font-bold text-gray-800">{formatKRW(marketPrice.avgKeyMoney)}</span>
                </div>
                {listing.premiumFee && Number(listing.premiumFee) > 0 && (() => {
                  const myFee = Number(listing.premiumFee);
                  const avgFee = Number(marketPrice.avgKeyMoney);
                  const ratio = avgFee > 0 ? myFee / avgFee : 1;
                  const verdict = ratio <= 0.8 ? "저가" : ratio >= 1.2 ? "고가" : "적정";
                  const barMax = Math.max(myFee, avgFee) * 1.3;
                  return (
                    <div className="mt-3">
                      <div className="space-y-1.5">
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>이 매물</span>
                            <span>{formatKRW(myFee)}</span>
                          </div>
                          <div className="mt-0.5 h-2.5 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-mint" style={{ width: `${(myFee / barMax) * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>지역 평균</span>
                            <span>{formatKRW(avgFee)}</span>
                          </div>
                          <div className="mt-0.5 h-2.5 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-orange-400" style={{ width: `${(avgFee / barMax) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                          verdict === "적정" ? "bg-green-100 text-green-700" : verdict === "저가" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                        }`}>
                          {verdict}
                        </span>
                        <Link
                          href={`/market-price?subRegion=${listing.district}&businessType=${listing.businessCategory}`}
                          className="flex items-center gap-1 text-xs text-mint hover:underline"
                        >
                          자세히 보기
                          <Lock className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Share Buttons */}
          <div className="mt-8">
            <h3 className="mb-3 text-sm font-medium text-gray-700">공유하기</h3>
            <ShareButtons listingId={listing.id} title={listing.title} />
          </div>

          {/* Stats */}
          <div className="mt-8 flex items-center gap-6 border-t border-gray-200 pt-6 text-sm text-gray-500">
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

        {/* Sidebar - 1 column */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            {/* Seller Info Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                판매자
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint/10 text-lg font-bold text-mint">
                  {listing.seller?.name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-navy">
                    {listing.seller?.name ?? "미인증"}
                  </p>
                  <p className="text-xs text-gray-500">판매자</p>
                </div>
              </div>

              {/* Contact Buttons */}
              <div className="mt-4 space-y-2">
                {listing.contactPhone && (
                  <a
                    href={`tel:${listing.contactPhone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-mint-dark"
                  >
                    <Phone className="h-4 w-4" />
                    전화 문의
                  </a>
                )}
                {listing.contactEmail && (
                  <a
                    href={`mailto:${listing.contactEmail}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Mail className="h-4 w-4" />
                    이메일 문의
                  </a>
                )}
                {!listing.contactPhone && !listing.contactEmail && (
                  <p className="text-center text-sm text-gray-500">
                    연락처가 등록되지 않았습니다.
                  </p>
                )}
              </div>
            </div>

            {/* Inquiry Form */}
            <InquiryForm listingId={listing.id} sellerId={listing.sellerId} />

            {/* Compare Button */}
            <CompareSection
              listing={{
                id: listing.id,
                title: listing.title,
                businessCategory: listing.businessCategory,
                city: listing.city,
                district: listing.district,
                thumbnail: images[0]?.thumbnailUrl ?? images[0]?.url ?? null,
                price: String(listing.price),
                monthlyRent: listing.monthlyRent ? String(listing.monthlyRent) : null,
                premiumFee: listing.premiumFee ? String(listing.premiumFee) : null,
                managementFee: listing.managementFee ? String(listing.managementFee) : null,
                monthlyRevenue: listing.monthlyRevenue ? String(listing.monthlyRevenue) : null,
                monthlyProfit: listing.monthlyProfit ? String(listing.monthlyProfit) : null,
                areaM2: listing.areaM2,
                areaPyeong: listing.areaPyeong ?? (listing.areaM2 ? Math.round(listing.areaM2 / 3.3058) : null),
                floor: listing.floor,
                safetyGrade: listing.safetyGrade,
                isPremium: listing.isPremium,
                premiumRank: listing.premiumRank,
                storeType: listing.storeType,
              }}
            />

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
    </div>
  );
}

function PriceRow({
  label,
  value,
  highlight,
  secondary,
}: {
  label: string;
  value: string;
  highlight?: "orange" | "mint" | "green";
  secondary?: boolean;
}) {
  const valueClass = highlight
    ? highlight === "orange"
      ? "text-orange-600 font-bold"
      : highlight === "mint"
      ? "text-mint font-bold"
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
