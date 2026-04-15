"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import Image from "next/image";
import dynamic from "next/dynamic";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "@/lib/toast";

const StartupPartnerSection = dynamic(() => import("@/components/listing/StartupPartnerSection"), {
  ssr: false,
});

const KakaoMap = dynamic(() => import("@/components/map/KakaoMap"), {
  loading: () => <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />,
});

interface Partner {
  id: string;
  companyName: string;
  serviceType: string;
  description: string | null;
  contactPhone: string | null;
  contactPhoneLocked?: boolean;
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
  const { data: session } = useSession();

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
        <div className="bg-gray-100 rounded-xl h-64 animate-pulse mb-6" />
        <div className="bg-gray-100 rounded-xl h-96 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadPartner}
          className="px-6 py-2 bg-green-700 text-cream rounded-full hover:bg-green-800 transition-colors"
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
      BASIC: "bg-green-100 text-green-800",
      PREMIUM: "bg-gray-100 text-gray-800",
      VIP: "bg-green-100 text-green-800",
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
          <div className="relative w-full h-80 rounded-xl overflow-hidden bg-gray-100">
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
                      ? "ring-2 ring-green-600"
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
      <div className="bg-cream rounded-3xl border border-line p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {partner.companyName}
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}
              </span>
              {getTierBadge(partner.tier)}
            </div>
          </div>
        </div>

        {/* Service Area */}
        {partner.serviceArea.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">서비스 가능 지역</h3>
            <div className="flex flex-wrap gap-2">
              {partner.serviceArea.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
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
            <h3 className="text-sm font-medium text-gray-600 mb-2">서비스 소개</h3>
            <p className="text-gray-900 whitespace-pre-wrap">{partner.description}</p>
          </div>
        )}

        {/* Contact Info */}
        <div className="pt-4 border-t border-line space-y-3">
          {partner.contactEmail && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-20">이메일:</span>
              <a
                href={`mailto:${partner.contactEmail}`}
                className="text-sm font-medium text-green-700 hover:underline"
              >
                {partner.contactEmail}
              </a>
            </div>
          )}
          {partner.website && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-20">웹사이트:</span>
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-green-700 hover:underline"
              >
                {partner.website}
              </a>
            </div>
          )}
          {partner.addressRoad && (
            <div className="flex items-start gap-2">
              <span className="text-sm text-gray-600 w-20">주소:</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {partner.addressRoad}
                </p>
                {partner.addressDetail && (
                  <p className="text-sm text-gray-600">{partner.addressDetail}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 연락하기 */}
        {partner.contactPhone && (
          <div className="pt-4 border-t border-line mt-4">
            <h4 className="font-medium text-gray-900 mb-1">연락하기</h4>
            <p className="text-xs text-gray-500 mb-3">바로 연락</p>
            {partner.contactPhoneLocked ? (
              <div className="flex flex-col items-center gap-3 py-4 bg-blue-50 rounded-xl border border-blue-100">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-gray-600 text-center">연락처는 로그인 후 확인할 수 있습니다</p>
                <Link href="/login" className="px-5 py-2.5 bg-green-700 text-white text-sm font-medium rounded-xl hover:bg-green-800 transition-colors">로그인하고 연락하기</Link>
              </div>
            ) : (
              <>
                <div className="flex gap-3">
                  <a href={`tel:${partner.contactPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    전화
                  </a>
                  <a href={`sms:${partner.contactPhone}?body=${encodeURIComponent(`안녕하세요, 권리샵에서 ${partner.companyName} 서비스를 보고 연락드립니다.`)}`} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white text-green-700 border-2 border-green-700 rounded-xl font-medium hover:bg-green-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    문자
                  </a>
                </div>
                <p className="mt-2.5 text-xs text-gray-400 flex items-start gap-1.5">
                  <span className="shrink-0">💡</span>
                  <span>통화 시 <span className="font-medium">&quot;권리샵 보고 연락드렸습니다&quot;</span> 멘트 권장</span>
                </p>
              </>
            )}
          </div>
        )}

        {/* View Count */}
        <div className="pt-4 border-t border-line mt-4">
          <p className="text-sm text-gray-500">
            조회 {partner.viewCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Map - if coordinates exist */}
      {partner.latitude && partner.longitude && (
        <div className="bg-cream rounded-3xl border border-line p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">위치</h3>
          <KakaoMap latitude={partner.latitude} longitude={partner.longitude} level={3} className="h-80" showInfoWindow={true} address={partner.addressRoad || ""} />
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-line p-4 md:hidden">
        {partner.contactPhone ? (
          <div className="flex gap-2">
            {!partner.contactPhoneLocked ? (
              <>
                <a href={`tel:${partner.contactPhone}`} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 transition-colors text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  전화 문의
                </a>
                <a href={`sms:${partner.contactPhone}?body=${encodeURIComponent(`안녕하세요, 권리샵에서 ${partner.companyName} 서비스를 보고 연락드립니다.`)}`} className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-white text-green-700 border-2 border-green-700 rounded-xl font-medium hover:bg-green-50 transition-colors text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  문자 문의
                </a>
              </>
            ) : (
              <Link href="/login" className="flex-1 py-3 bg-green-700 text-cream rounded-full font-medium text-center hover:bg-green-800 transition-colors">
                로그인하고 연락하기
              </Link>
            )}
          </div>
        ) : (
          <button
            onClick={() => toast.info("채팅 기능은 곧 지원됩니다")}
            className="w-full py-3 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 transition-colors"
          >
            문의하기
          </button>
        )}
      </div>
    </div>
  );
}
