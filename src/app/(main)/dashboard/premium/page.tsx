"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Plus, Eye, MousePointer, TrendingUp } from "lucide-react";
import { PREMIUM_AD_CONFIG } from "@/lib/utils/constants";

interface PremiumListingItem {
  id: string;
  listingId: string;
  status: string;
  startDate: string;
  endDate: string;
  paymentStatus: string;
  listing: {
    id: string;
    title: string;
    businessCategory: string;
    isPremium: boolean;
    premiumRank: number;
    viewCount: number;
    inquiryCount: number;
  };
  plan: {
    name: string;
    displayName: string;
    price: string;
  };
}

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "활성", color: "text-green-700", bg: "bg-green-100" },
  EXPIRED: { label: "만료", color: "text-gray-600", bg: "bg-gray-100" },
  CANCELLED: { label: "취소", color: "text-red-700", bg: "bg-red-100" },
};

export default function DashboardPremiumPage() {
  const [premiumListings, setPremiumListings] = useState<PremiumListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/premium-listings")
      .then((r) => r.json())
      .then((j) => setPremiumListings(j.data ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const activeCount = premiumListings.filter((p) => p.status === "ACTIVE").length;
  const totalViews = premiumListings.reduce((sum, p) => sum + (p.listing?.viewCount ?? 0), 0);
  const totalInquiries = premiumListings.reduce((sum, p) => sum + (p.listing?.inquiryCount ?? 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-yellow-500" />
          <h1 className="text-2xl font-bold text-navy">매물 광고 관리</h1>
        </div>
        <Link
          href="/premium/listing-ad"
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          <Plus className="h-4 w-4" />
          새 광고 신청
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Star className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">활성 광고</p>
              <p className="text-2xl font-bold text-navy">{activeCount}건</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">총 조회수</p>
              <p className="text-2xl font-bold text-navy">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <MousePointer className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">총 문의수</p>
              <p className="text-2xl font-bold text-navy">{totalInquiries.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Listings Table */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-navy">내 프리미엄 매물</h2>
        {isLoading ? (
          <div className="mt-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : premiumListings.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
            <TrendingUp className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">등록된 매물 광고가 없습니다</p>
            <Link
              href="/premium/listing-ad"
              className="mt-4 inline-block rounded-lg bg-accent px-6 py-2 text-sm font-medium text-white hover:bg-accent-dark"
            >
              첫 광고 시작하기
            </Link>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
                  <th className="pb-3 pr-4">매물</th>
                  <th className="pb-3 pr-4">등급</th>
                  <th className="pb-3 pr-4">상태</th>
                  <th className="pb-3 pr-4">시작일</th>
                  <th className="pb-3 pr-4">종료일</th>
                  <th className="pb-3 pr-4">남은기간</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {premiumListings.map((item) => {
                  const tierConfig = PREMIUM_AD_CONFIG[item.plan.name];
                  const statusConfig = STATUS_STYLES[item.status] ?? STATUS_STYLES.EXPIRED;
                  const endDate = new Date(item.endDate);
                  const now = new Date();
                  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

                  return (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <Link href={`/listings/${item.listing.id}`} className="text-sm font-medium text-navy hover:text-navy">
                          {item.listing.title}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        {tierConfig && (
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold ${tierConfig.color} ${tierConfig.bg} border ${tierConfig.border}`}>
                            {tierConfig.badge}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">
                        {new Date(item.startDate).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="py-3 pr-4 text-sm text-gray-600">
                        {endDate.toLocaleDateString("ko-KR")}
                      </td>
                      <td className="py-3 pr-4">
                        {item.status === "ACTIVE" ? (
                          <span className={`text-sm font-medium ${daysLeft <= 7 ? "text-red-600" : "text-green-600"}`}>
                            {daysLeft}일
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3">
                        {item.status === "ACTIVE" && (
                          <Link
                            href={`/premium/listing-ad?listingId=${item.listing.id}&extend=true`}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            연장
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
