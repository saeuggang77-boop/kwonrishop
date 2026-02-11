import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, MessageSquare, MousePointerClick, Package, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatPercent, formatKRW, formatRelativeTime } from "@/lib/utils/format";
import { LISTING_STATUS_LABELS, BUSINESS_CATEGORY_LABELS } from "@/lib/utils/constants";

export const metadata = { title: "대시보드" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    redirect("/dashboard/notifications");
  }

  const sellerId = session.user.id;

  // Fetch data in parallel
  const [listings, todayMetric, yesterdayMetric] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        businessCategory: true,
        price: true,
        status: true,
        viewCount: true,
        inquiryCount: true,
        createdAt: true,
      },
    }),
    prisma.dailySellerMetric.findFirst({
      where: { sellerId, date: { gte: startOfToday() } },
    }),
    prisma.dailySellerMetric.findFirst({
      where: { sellerId, date: { gte: startOfYesterday(), lt: startOfToday() } },
    }),
  ]);

  const activeCount = listings.filter((l) => l.status === "ACTIVE").length;
  const totalViews = listings.reduce((sum, l) => sum + l.viewCount, 0);
  const totalInquiries = listings.reduce((sum, l) => sum + l.inquiryCount, 0);
  const ctr = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

  const viewDelta = todayMetric && yesterdayMetric && yesterdayMetric.totalViews > 0
    ? ((todayMetric.totalViews - yesterdayMetric.totalViews) / yesterdayMetric.totalViews) * 100
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">{session.user.name}님의 매물 현황</p>
        </div>
        <Link
          href="/listings/new"
          className="flex items-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-mint-dark active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" /> 매물 등록
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<Package className="h-5 w-5" />}
          accentColor="bg-mint"
          iconColor="text-mint"
          label="활성 매물"
          value={formatNumber(activeCount)}
          sub={`전체 ${listings.length}건`}
        />
        <KpiCard
          icon={<Eye className="h-5 w-5" />}
          accentColor="bg-blue-500"
          iconColor="text-blue-500"
          label="총 조회수"
          value={formatNumber(totalViews)}
          delta={viewDelta}
        />
        <KpiCard
          icon={<MessageSquare className="h-5 w-5" />}
          accentColor="bg-orange-500"
          iconColor="text-orange-500"
          label="총 문의수"
          value={formatNumber(totalInquiries)}
        />
        <KpiCard
          icon={<MousePointerClick className="h-5 w-5" />}
          accentColor="bg-purple-500"
          iconColor="text-purple-500"
          label="문의 전환율"
          value={formatPercent(ctr)}
          sub="조회 → 문의"
        />
      </div>

      {/* Listings Table */}
      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-heading font-bold text-navy">내 매물</h2>
        </div>
        {listings.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p>등록된 매물이 없습니다.</p>
            <Link href="/listings/new" className="mt-2 inline-block text-sm text-mint hover:underline">
              첫 매물 등록하기
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">매물명</th>
                    <th className="px-4 py-3 font-medium">유형</th>
                    <th className="px-4 py-3 font-medium text-right">가격</th>
                    <th className="px-4 py-3 font-medium text-center">상태</th>
                    <th className="px-4 py-3 font-medium text-right">조회</th>
                    <th className="px-4 py-3 font-medium text-right">문의</th>
                    <th className="px-4 py-3 font-medium text-right">등록일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/listings/${listing.id}`} className="font-medium text-navy transition-colors hover:text-mint">
                          {listing.title}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {BUSINESS_CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-navy">
                        {formatKRW(listing.price)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={listing.status} />
                      </td>
                      <td className="px-4 py-4 text-right text-gray-500">
                        {formatNumber(listing.viewCount)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-500">
                        {formatNumber(listing.inquiryCount)}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-500">
                        {formatRelativeTime(listing.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="divide-y divide-gray-100 md:hidden">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="block px-4 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-navy">{listing.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {BUSINESS_CATEGORY_LABELS[listing.businessCategory] ?? listing.businessCategory}
                      </p>
                    </div>
                    <StatusBadge status={listing.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium text-navy">{formatKRW(listing.price)}</span>
                    <span>조회 {formatNumber(listing.viewCount)}</span>
                    <span>문의 {formatNumber(listing.inquiryCount)}</span>
                    <span className="ml-auto">{formatRelativeTime(listing.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  accentColor,
  iconColor,
  label,
  value,
  sub,
  delta,
}: {
  icon: React.ReactNode;
  accentColor: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
      {/* Top accent line */}
      <div className={`absolute inset-x-0 top-0 h-1 ${accentColor}`} />
      <div className="flex items-center justify-between">
        <span className="label-text">{label}</span>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta != null && (
          <span className={`flex items-center gap-0.5 ${delta >= 0 ? "text-green-600" : "text-red-500"}`}>
            {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {formatPercent(Math.abs(delta))}
          </span>
        )}
        {sub && <span className="text-gray-500">{sub}</span>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    PENDING_VERIFICATION: "bg-yellow-50 text-yellow-700",
    SOLD: "bg-blue-50 text-blue-700",
    HIDDEN: "bg-gray-100 text-gray-500",
    EXPIRED: "bg-red-50 text-red-600",
    DRAFT: "bg-gray-100 text-gray-500",
  };

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-500"}`}>
      {LISTING_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYesterday() {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}
