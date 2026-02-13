import Link from "next/link";
import {
  Users,
  ListChecks,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatDateKR } from "@/lib/utils/format";
import {
  BUSINESS_CATEGORY_LABELS,
  LISTING_STATUS_LABELS,
} from "@/lib/utils/constants";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "관리자 대시보드 - 권리샵",
};

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    userCount,
    listingCount,
    todayListingsCount,
    pendingViolationCount,
    todayInquiriesCount,
    recentListings,
    recentMembers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.fraudViolation.count({ where: { status: "PENDING" } }),
    prisma.inquiry.count({
      where: { createdAt: { gte: today } },
    }),
    prisma.listing.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        businessCategory: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  const kpiCards = [
    {
      icon: Users,
      label: "총 회원",
      value: formatNumber(userCount),
      borderColor: "border-l-blue-500",
      iconColor: "text-blue-500/40",
    },
    {
      icon: ListChecks,
      label: "총 매물",
      value: formatNumber(listingCount),
      borderColor: "border-l-green-500",
      iconColor: "text-blue-500/40",
    },
    {
      icon: TrendingUp,
      label: "오늘 신규 매물",
      value: formatNumber(todayListingsCount),
      borderColor: "border-l-blue-500",
      iconColor: "text-blue-500/40",
    },
    {
      icon: AlertTriangle,
      label: "대기 위반",
      value: formatNumber(pendingViolationCount),
      borderColor: "border-l-red-500",
      iconColor: "text-red-500/40",
    },
    {
      icon: MessageSquare,
      label: "오늘 문의",
      value: formatNumber(todayInquiriesCount),
      borderColor: "border-l-amber-500",
      iconColor: "text-amber-500/40",
    },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
      <p className="mt-1 text-sm text-gray-500">권리샵 플랫폼 현황 요약</p>

      {/* KPI Cards */}
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${card.borderColor} p-5`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${card.iconColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity - 2 column grid */}
      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Listings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              최근 등록 매물
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">제목</th>
                  <th className="px-4 py-3">업종</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">등록일</th>
                </tr>
              </thead>
              <tbody>
                {recentListings.map((listing, idx) => (
                  <tr
                    key={listing.id}
                    className="border-t border-gray-100 even:bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                      {listing.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {BUSINESS_CATEGORY_LABELS[listing.businessCategory] ??
                        listing.businessCategory}
                    </td>
                    <td className="px-4 py-3">
                      <ListingStatusBadge status={listing.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateKR(listing.createdAt)}
                    </td>
                  </tr>
                ))}
                {recentListings.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      등록된 매물이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-6 py-3 text-right">
            <Link
              href="/admin/listings"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              더보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Recent Members */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">
              최근 가입 회원
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">이메일</th>
                  <th className="px-4 py-3">역할</th>
                  <th className="px-4 py-3">가입일</th>
                </tr>
              </thead>
              <tbody>
                {recentMembers.map((member, idx) => (
                  <tr
                    key={member.id}
                    className="border-t border-gray-100 even:bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {member.name || "미등록"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">
                      {member.email ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateKR(member.createdAt)}
                    </td>
                  </tr>
                ))}
                {recentMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      가입한 회원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-6 py-3 text-right">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              더보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ListingStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    ACTIVE: "bg-green-100 text-green-700",
    PENDING_VERIFICATION: "bg-yellow-100 text-yellow-700",
    HIDDEN: "bg-gray-100 text-gray-600",
    SOLD: "bg-blue-100 text-blue-700",
    EXPIRED: "bg-red-100 text-red-600",
    DELETED: "bg-red-100 text-red-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        colorMap[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {LISTING_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colorMap: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    SELLER: "bg-blue-100 text-blue-700",
    BUYER: "bg-green-100 text-green-700",
  };

  const labelMap: Record<string, string> = {
    ADMIN: "관리자",
    SELLER: "판매자",
    BUYER: "구매자",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        colorMap[role] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {labelMap[role] ?? role}
    </span>
  );
}
