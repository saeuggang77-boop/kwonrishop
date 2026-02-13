import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { Eye, MessageSquare, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "분석" };

export default async function DashboardAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const metrics = await prisma.dailySellerMetric.findMany({
    where: { sellerId: session.user.id },
    orderBy: { date: "desc" },
    take: 30,
  });

  const totalViews = metrics.reduce((s, m) => s + m.totalViews, 0);
  const totalInquiries = metrics.reduce((s, m) => s + m.totalInquiries, 0);
  const avgConversion = metrics.length > 0
    ? metrics.reduce((s, m) => s + (m.conversionRate ?? 0), 0) / metrics.length * 100
    : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">분석</h1>
      <p className="mt-1 text-sm text-gray-500">최근 30일 데이터</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <Eye className="h-5 w-5 text-blue-500" />
          <p className="mt-3 text-2xl font-bold text-navy">{formatNumber(totalViews)}</p>
          <p className="text-xs text-gray-500">총 조회수</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <MessageSquare className="h-5 w-5 text-orange-500" />
          <p className="mt-3 text-2xl font-bold text-navy">{formatNumber(totalInquiries)}</p>
          <p className="text-xs text-gray-500">총 문의수</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <TrendingUp className="h-5 w-5 text-navy" />
          <p className="mt-3 text-2xl font-bold text-navy">{formatPercent(avgConversion)}</p>
          <p className="text-xs text-gray-500">평균 전환율</p>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white py-12 text-center text-gray-500">
          아직 분석 데이터가 없습니다.
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">날짜</th>
                <th className="px-4 py-3 font-medium text-right">조회</th>
                <th className="px-4 py-3 font-medium text-right">문의</th>
                <th className="px-4 py-3 font-medium text-right">CTA 클릭</th>
                <th className="px-4 py-3 font-medium text-right">활성 매물</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600">{m.date.toISOString().split("T")[0]}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(m.totalViews)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(m.totalInquiries)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(m.totalCtaClicks)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(m.activeListings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
