import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKRW, formatDateKR, formatNumber } from "@/lib/utils/format";
import { LISTING_STATUS_LABELS, BUSINESS_CATEGORY_LABELS } from "@/lib/utils/constants";

export const metadata = { title: "매물 관리" };

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      businessCategory: true,
      price: true,
      status: true,
      city: true,
      district: true,
      viewCount: true,
      createdAt: true,
      sellerId: true,
    },
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    PENDING_VERIFICATION: "bg-yellow-50 text-yellow-700",
    SOLD: "bg-blue-50 text-blue-700",
    HIDDEN: "bg-gray-100 text-gray-500",
    EXPIRED: "bg-red-50 text-red-600",
    DRAFT: "bg-gray-100 text-gray-500",
    DELETED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">매물 관리</h1>
      <p className="mt-1 text-sm text-gray-500">총 {listings.length}건</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-6 py-3 font-medium">매물명</th>
              <th className="px-4 py-3 font-medium">유형</th>
              <th className="px-4 py-3 font-medium">위치</th>
              <th className="px-4 py-3 font-medium text-right">가격</th>
              <th className="px-4 py-3 font-medium text-center">상태</th>
              <th className="px-4 py-3 font-medium text-right">조회</th>
              <th className="px-4 py-3 font-medium text-right">등록일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/listings/${l.id}`} className="font-medium text-navy hover:text-mint">
                    {l.title}
                  </Link>
                </td>
                <td className="px-4 py-4 text-gray-500">
                  {BUSINESS_CATEGORY_LABELS[l.businessCategory] ?? l.businessCategory}
                </td>
                <td className="px-4 py-4 text-gray-500">{l.city} {l.district}</td>
                <td className="px-4 py-4 text-right font-medium text-navy">{formatKRW(l.price)}</td>
                <td className="px-4 py-4 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[l.status] ?? "bg-gray-100"}`}>
                    {LISTING_STATUS_LABELS[l.status] ?? l.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-gray-500">{formatNumber(l.viewCount)}</td>
                <td className="px-4 py-4 text-right text-gray-400">{formatDateKR(l.createdAt)}</td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">등록된 매물이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
