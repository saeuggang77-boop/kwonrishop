"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_TYPE_LABELS, REGION_OPTIONS } from "@/lib/constants";
import PremiumCarousel from "@/components/shared/PremiumCarousel";
import Image from "next/image";

interface Partner {
  id: string;
  companyName: string;
  serviceType: string;
  description: string | null;
  serviceArea: string[];
  tier: "FREE" | "BASIC" | "PREMIUM" | "VIP";
  viewCount: number;
  images: { url: string }[];
  user: {
    name: string | null;
    image: string | null;
  };
}

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [featuredPartners, setFeaturedPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [region, setRegion] = useState("");

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (serviceType) params.set("serviceType", serviceType);
    if (region) params.set("region", region);
    if (keyword) params.set("keyword", keyword);

    const res = await fetch(`/api/partners?${params}`);
    const data = await res.json();
    setPartners(data.partners || []);
    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, serviceType, region, keyword]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    fetch("/api/partners?featured=true")
      .then((r) => r.json())
      .then((data) => setFeaturedPartners(data.partners || []));
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchPartners();
  }

  function handleServiceTypeChange(value: string) {
    setServiceType(value);
    setPage(1);
  }

  function handleRegionChange(value: string) {
    setRegion(value);
    setPage(1);
  }

  const getTierBadge = (tier: Partner["tier"]) => {
    if (tier === "FREE") return null;
    const colors = {
      BASIC: "bg-blue-100 text-blue-800",
      PREMIUM: "bg-gray-100 text-gray-800",
      VIP: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier]}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">협력업체</h1>
        <p className="text-gray-600 dark:text-gray-400">점포 창업 및 운영에 필요한 검증된 업체를 만나보세요</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="업체명, 서비스 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shrink-0"
          >
            검색
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">서비스 유형</label>
          <select
            value={serviceType}
            onChange={(e) => handleServiceTypeChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">전체</option>
            {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">서비스 지역</label>
          <select
            value={region}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">전체</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 프리미엄 협력업체 캐러셀 */}
      <PremiumCarousel
        title="프리미엄 협력업체"
        subtitle="검증된 유료 업체를 먼저 확인하세요"
        count={featuredPartners.length}
      >
        {featuredPartners.map((partner) => {
          const tierColors: Record<string, string> = {
            VIP: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
            PREMIUM: "border-gray-400 bg-gray-50 dark:bg-gray-700/30",
            BASIC: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
          };
          const tierBadgeColors: Record<string, string> = {
            VIP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
            PREMIUM: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
            BASIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          };
          const tier = partner.tier;

          return (
            <div
              key={partner.id}
              onClick={() => router.push(`/partners/${partner.id}`)}
              className={`min-w-[280px] max-w-[280px] snap-start rounded-xl border-2 ${tierColors[tier] || tierColors.BASIC} overflow-hidden cursor-pointer hover:shadow-lg transition-shadow shrink-0`}
            >
              <div className="relative h-36 bg-gray-100 dark:bg-gray-700">
                {partner.images.length > 0 ? (
                  <Image src={partner.images[0].url} alt={partner.companyName} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {partner.companyName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate flex-1">{partner.companyName}</h3>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${tierBadgeColors[tier] || tierBadgeColors.BASIC}`}>
                    {tier}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}
                </p>
                {partner.serviceArea.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {partner.serviceArea.slice(0, 2).join(", ")}
                    {partner.serviceArea.length > 2 && ` 외 ${partner.serviceArea.length - 2}개`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </PremiumCarousel>

      {/* Result Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          총 <span className="font-medium text-gray-900 dark:text-white">{total.toLocaleString()}</span>개 업체
        </p>
      </div>

      {/* Partner Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">등록된 협력업체가 없습니다</p>
          <p className="text-sm">검색 조건을 변경해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((partner) => (
            <div
              key={partner.id}
              onClick={() => router.push(`/partners/${partner.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* Image or Placeholder */}
              <div className="mb-4">
                {partner.images.length > 0 ? (
                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image
                      src={partner.images[0].url}
                      alt={partner.companyName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                      {partner.companyName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Company Info */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{partner.companyName}</h3>
                {getTierBadge(partner.tier)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">서비스:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {SERVICE_TYPE_LABELS[partner.serviceType] || partner.serviceType}
                  </span>
                </div>
                {partner.serviceArea.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">지역:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {partner.serviceArea.slice(0, 2).join(", ")}
                      {partner.serviceArea.length > 2 && ` 외 ${partner.serviceArea.length - 2}개`}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {partner.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {partner.description}
                </p>
              )}

              {/* View Count */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  조회 {partner.viewCount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
