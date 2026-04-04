"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import Image from "next/image";
import dynamic from "next/dynamic";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "@/lib/toast";

const StartupPartnerSection = dynamic(() => import("@/components/listing/StartupPartnerSection"), {
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

export default function PartnerDetailClient() {
  const params = useParams();
  const id = params.id as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadPartner();
  }, [id]);

  const loadPartner = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/partners/${id}`);
      if (!res.ok) {
        throw new Error("데이터를 불러오지 못했습니다");
      }
      const data = await res.json();
      setPartner(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse mb-6" />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl h-96 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadPartner}
          className="px-6 py-2 bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition-colors"
        >
          재시도
        </button>
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
      BASIC: "bg-navy-100 text-navy-800 dark:bg-navy-900 dark:text-navy-200",
      PREMIUM: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      VIP: "bg-navy-100 text-navy-800 dark:bg-navy-900 dark:text-navy-200",
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
                      ? "ring-2 ring-navy-600"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image src={img.url} alt={`협력업체 사진 ${idx + 1}`} fill className="object-cover" />
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
              <span className="px-3 py-1 bg-navy-100 dark:bg-navy-900 text-navy-800 dark:text-navy-200 rounded-full text-sm font-medium">
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
                className="text-sm font-medium text-navy-700 dark:text-navy-400 hover:underline"
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
                className="text-sm font-medium text-navy-700 dark:text-navy-400 hover:underline"
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
                className="text-sm font-medium text-navy-700 dark:text-navy-400 hover:underline"
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
      <StartupPartnerSection
        sameType={{ type: "partner", id, title: "추천 협력업체", viewAllLink: "/partners" }}
        tabs={[
          { type: "franchise", label: "추천 프랜차이즈", minTier: "SILVER" },
          { type: "equipment", label: "추천 집기", minTier: "PREMIUM" },
        ]}
      />

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:hidden">
        <button
          onClick={() => toast.info("채팅 기능은 곧 지원됩니다")}
          className="w-full py-3 bg-navy-700 text-white rounded-xl font-medium hover:bg-navy-600 transition-colors"
        >
          문의하기
        </button>
      </div>
    </div>
  );
}
