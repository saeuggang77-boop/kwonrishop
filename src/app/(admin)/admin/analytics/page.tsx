import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils/format";
import { Users, Package, TrendingUp } from "lucide-react";

export const metadata = { title: "플랫폼 분석" };

export default async function AdminAnalyticsPage() {
  const [userCount, listingCount, eventCount] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.event.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">플랫폼 분석</h1>
      <p className="mt-1 text-sm text-gray-500">전체 플랫폼 현황</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <Users className="h-5 w-5 text-blue-500" />
          <p className="mt-3 text-2xl font-bold text-navy">{formatNumber(userCount)}</p>
          <p className="text-xs text-gray-500">총 회원수</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <Package className="h-5 w-5 text-navy" />
          <p className="mt-3 text-2xl font-bold text-navy">{formatNumber(listingCount)}</p>
          <p className="text-xs text-gray-500">활성 매물</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <p className="mt-3 text-2xl font-bold text-navy">{formatNumber(eventCount)}</p>
          <p className="text-xs text-gray-500">총 이벤트</p>
        </div>
      </div>
    </div>
  );
}
