import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKRW, formatRelativeTime, formatNumber } from "@/lib/utils/format";
import { LISTING_STATUS_LABELS } from "@/lib/utils/constants";

export const metadata = { title: "내 매물 관리" };

export default async function DashboardListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const listings = await prisma.listing.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700", PENDING_VERIFICATION: "bg-yellow-50 text-yellow-700",
    SOLD: "bg-blue-50 text-blue-700", HIDDEN: "bg-gray-100 text-gray-500",
    EXPIRED: "bg-red-50 text-red-600", DRAFT: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">내 매물 관리</h1>
        <Link href="/listings/new" className="flex items-center gap-2 rounded-lg bg-mint px-5 py-2.5 text-sm font-medium text-white hover:bg-mint-dark">
          <Plus className="h-4 w-4" /> 매물 등록
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {listings.length === 0 ? (
          <div className="py-12 text-center text-gray-400">등록된 매물이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">매물명</th>
                <th className="px-4 py-3 font-medium text-right">가격</th>
                <th className="px-4 py-3 font-medium text-center">상태</th>
                <th className="px-4 py-3 font-medium text-right">조회</th>
                <th className="px-4 py-3 font-medium text-right">등록일</th>
                <th className="px-4 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listings.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-navy">{l.title}</td>
                  <td className="px-4 py-4 text-right">{formatKRW(l.price)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[l.status] ?? "bg-gray-100"}`}>
                      {LISTING_STATUS_LABELS[l.status] ?? l.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500">{formatNumber(l.viewCount)}</td>
                  <td className="px-4 py-4 text-right text-gray-400">{formatRelativeTime(l.createdAt)}</td>
                  <td className="px-4 py-4 text-right">
                    <Link href={`/listings/${l.id}/edit`} className="text-mint hover:underline">수정</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
