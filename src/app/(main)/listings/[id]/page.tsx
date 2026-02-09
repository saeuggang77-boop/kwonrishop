import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Calendar, Eye, Building, Layers, Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { InquiryForm } from "@/components/listings/inquiry-form";
import { formatKRW, formatDateKR, formatNumber } from "@/lib/utils/format";
import {
  RIGHTS_CATEGORY_LABELS,
  PROPERTY_TYPE_LABELS,
  LISTING_STATUS_LABELS,
} from "@/lib/utils/constants";
import { m2ToPyeong } from "@/lib/utils/area";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const { id } = await params;

  const listingData = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listingData || listingData.status === "DELETED") {
    notFound();
  }

  const [images, seller] = await Promise.all([
    prisma.listingImage.findMany({
      where: { listingId: id },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: listingData.sellerId },
      select: { id: true, name: true, image: true },
    }),
  ]);

  const listing = { ...listingData, images, seller };

  // Track view (fire-and-forget)
  prisma.listing
    .update({ where: { id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const areaPyeong = listing.areaM2 ? m2ToPyeong(listing.areaM2) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Image Gallery */}
      <div className="overflow-hidden rounded-xl bg-gray-100">
        {listing.images.length > 0 ? (
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            <div className="relative aspect-[4/3]">
              <Image
                src={listing.images[0].url}
                alt={listing.title}
                fill
                className="object-cover"
                priority
              />
            </div>
            {listing.images.length > 1 && (
              <div className="grid grid-cols-2 gap-1">
                {listing.images.slice(1, 5).map((img, i) => (
                  <div key={img.id} className="relative aspect-[4/3]">
                    <Image src={img.url} alt={`${listing.title} ${i + 2}`} fill className="object-cover" />
                    {i === 3 && listing.images.length > 5 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
                        +{listing.images.length - 5}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex aspect-[2/1] items-center justify-center">
            <MapPin className="h-16 w-16 text-gray-300" />
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-navy px-2.5 py-1 text-xs font-medium text-white">
              {RIGHTS_CATEGORY_LABELS[listing.rightsCategory] ?? listing.rightsCategory}
            </span>
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
              {PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType}
            </span>
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              listing.status === "ACTIVE"
                ? "bg-green-50 text-green-700"
                : "bg-yellow-50 text-yellow-700"
            }`}>
              {LISTING_STATUS_LABELS[listing.status] ?? listing.status}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-navy">{listing.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-gray-500">
            <MapPin className="h-4 w-4" />
            {listing.address}
            {listing.addressDetail ? ` ${listing.addressDetail}` : ""}
          </p>

          {/* Price */}
          <div className="mt-6 rounded-lg bg-mint/5 p-6">
            <p className="text-sm text-gray-500">가격</p>
            <p className="mt-1 text-3xl font-bold text-navy">
              {formatKRW(listing.price)}
            </p>
            {listing.monthlyRent && Number(listing.monthlyRent) > 0 && (
              <p className="mt-1 text-gray-600">
                월세 {formatKRW(listing.monthlyRent)}
              </p>
            )}
            {listing.maintenanceFee && Number(listing.maintenanceFee) > 0 && (
              <p className="text-sm text-gray-500">
                관리비 {formatKRW(listing.maintenanceFee)}
              </p>
            )}
          </div>

          {/* Property Details */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-navy">매물 정보</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {listing.areaM2 && (
                <DetailItem icon={<Layers className="h-4 w-4" />} label="면적" value={`${listing.areaM2}m² (${areaPyeong?.toFixed(1)}평)`} />
              )}
              {listing.floor && (
                <DetailItem icon={<Building className="h-4 w-4" />} label="층" value={`${listing.floor}층${listing.totalFloors ? ` / ${listing.totalFloors}층` : ""}`} />
              )}
              {listing.buildYear && (
                <DetailItem icon={<Calendar className="h-4 w-4" />} label="건축년도" value={`${listing.buildYear}년`} />
              )}
              {listing.roomCount !== null && (
                <DetailItem label="방" value={`${listing.roomCount}개`} />
              )}
              {listing.bathroomCount !== null && (
                <DetailItem label="화장실" value={`${listing.bathroomCount}개`} />
              )}
              {listing.registryNumber && (
                <DetailItem label="등기번호" value={listing.registryNumber} />
              )}
              {listing.rightsPriority && (
                <DetailItem label="권리순위" value={`${listing.rightsPriority}순위`} />
              )}
              {listing.expirationDate && (
                <DetailItem icon={<Calendar className="h-4 w-4" />} label="만료일" value={formatDateKR(listing.expirationDate)} />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-navy">상세 설명</h2>
            <div className="mt-3 whitespace-pre-wrap text-gray-700 leading-relaxed">
              {listing.description}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 flex gap-4 border-t border-gray-200 pt-6 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> 조회 {formatNumber(listing.viewCount)}
            </span>
            <span>등록 {formatDateKR(listing.createdAt)}</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            {/* Seller Info */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-xs font-medium text-gray-500">판매자</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint/10 text-sm font-bold text-mint">
                  {listing.seller?.name?.charAt(0) ?? "?"}
                </div>
                <p className="font-medium text-navy">{listing.seller?.name ?? "미인증"}</p>
              </div>
              {listing.contactPhone && (
                <a
                  href={`tel:${listing.contactPhone}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 text-sm font-medium text-white hover:bg-mint-dark"
                >
                  <Phone className="h-4 w-4" /> 전화 문의
                </a>
              )}
              {listing.contactEmail && (
                <a
                  href={`mailto:${listing.contactEmail}`}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Mail className="h-4 w-4" /> 이메일 문의
                </a>
              )}
              {!listing.contactPhone && !listing.contactEmail && (
                <p className="mt-3 text-sm text-gray-400">연락처가 등록되지 않았습니다.</p>
              )}
            </div>

            {/* Inquiry Form */}
            <InquiryForm listingId={listing.id} sellerId={listing.sellerId} />

            {/* Disclaimer */}
            <div className="rounded-lg bg-yellow-50 p-4 text-xs text-yellow-800 leading-relaxed">
              본 매물 정보는 판매자가 등록한 것으로, 권리샵은 정보의 정확성을 보증하지 않습니다.
              중요한 거래 결정 시{" "}
              <Link href="/legal/disclaimer" className="font-medium underline">
                면책조항
              </Link>
              을 확인하시고 전문가 검토를 받으시기 바랍니다.
            </div>
          </div>
        </div>
      </div>
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
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="flex items-center gap-1 text-xs text-gray-500">
        {icon} {label}
      </p>
      <p className="mt-1 font-medium text-navy">{value}</p>
    </div>
  );
}
