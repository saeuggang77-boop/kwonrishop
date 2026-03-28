"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import Image from "next/image";
import dynamic from "next/dynamic";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "@/lib/toast";

const CrossSellSection = dynamic(() => import("@/components/shared/CrossSellSection"), {
  ssr: false,
});

interface Partner {
  id: string;
  companyName: string;
  serviceType: string;
  description: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  website: string | null;
  addressRoad: string | null;
  addressJibun: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceArea: string[];
  tier: "FREE" | "BASIC" | "PREMIUM" | "VIP";
  viewCount: number;
  images: { url: string; sortOrder: number }[];
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function PartnerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetch(`/api/partners/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPartner(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (partner) {
      document.title = `${partner.companyName} - 협력업체 - 권리샵`;
    }
  }, [partner]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse mb-6" />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-96 animate-pulse" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">협력업체를 찾을 수 없습니다</p>
      </div>
    );
  }

  const getTierBadge = (tier: Partner["tier"]) => {
    if (tier === "FREE") return null;
    const colors = {
      BASIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PREMIUM: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      VIP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier]}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Breadcrumb items={[{ label: "협력업체", href: "/partners" }, { label: partner.companyName }]} />
      {/* Image Gallery */}
      {partner.images.length > 0 && (
        <div className="mb-6">
          <div className="relative w-full h-80 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={partner.images[currentImageIndex].url}
              alt={partner.companyName}
              fill
              className="object-cover"
              priority
            />
          </div>
          {partner.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {partner.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 ${
                    idx === currentImageIndex
                      ? "ring-2 ring-blue-600"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {partner.companyName}
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                {SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}
              </span>
              {getTierBadge(partner.tier)}
            </div>
          </div>
        </div>

        {/* Service Area */}
        {partner.serviceArea.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">서비스 가능 지역</h3>
            <div className="flex flex-wrap gap-2">
              {partner.serviceArea.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {partner.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">서비스 소개</h3>
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{partner.description}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {partner.contactPhone && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">전화번호:</span>
              <a
                href={`tel:${partner.contactPhone}`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {partner.contactPhone}
              </a>
            </div>
          )}
          {partner.contactEmail && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">이메일:</span>
              <a
                href={`mailto:${partner.contactEmail}`}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {partner.contactEmail}
              </a>
            </div>
          )}
          {partner.website && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">웹사이트:</span>
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {partner.website}
              </a>
            </div>
          )}
          {partner.addressRoad && (
            <div className="flex items-start gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-20">주소:</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {partner.addressRoad}
                </p>
                {partner.addressDetail && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{partner.addressDetail}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Count */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            조회 {partner.viewCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Map - if coordinates exist */}
      {partner.latitude && partner.longitude && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">위치</h3>
          <div id="map" className="w-full h-80 rounded-xl bg-gray-100 dark:bg-gray-700">
            {/* KakaoMap component can be integrated here later */}
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              지도 표시 영역 (위도: {partner.latitude}, 경도: {partner.longitude})
            </div>
          </div>
        </div>
      )}

      {/* 크로스셀 추천 */}
      <CrossSellSection type="partner" id={id} />

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:hidden">
        <button
          onClick={() => toast.info("채팅 기능은 곧 지원됩니다")}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          문의하기
        </button>
      </div>
    </div>
  );
}
