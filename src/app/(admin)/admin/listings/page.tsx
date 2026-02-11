import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKRW, formatDateKR, formatNumber } from "@/lib/utils/format";
import {
  LISTING_STATUS_LABELS,
  BUSINESS_CATEGORY_LABELS,
} from "@/lib/utils/constants";
import { ListingActions } from "./actions";
import { ListingStatus, BusinessCategory } from "@prisma/client";

export const metadata = { title: "매물 관리" };

const ITEMS_PER_PAGE = 20;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  category?: string;
  page?: string;
}>;

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const status = params.status as ListingStatus | "ALL" | undefined;
  const category = params.category as BusinessCategory | undefined;
  const page = parseInt(params.page || "1", 10);

  // Build where clause
  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { address: { contains: query, mode: "insensitive" } },
    ];
  }
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (category) {
    where.businessCategory = category;
  }

  const [listings, totalCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
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
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING_VERIFICATION: "bg-yellow-100 text-yellow-700",
    SOLD: "bg-blue-100 text-blue-700",
    HIDDEN: "bg-gray-100 text-gray-600",
    EXPIRED: "bg-red-100 text-red-600",
    DRAFT: "bg-gray-100 text-gray-600",
    DELETED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <form method="GET" className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="제목 또는 주소 검색"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <select
            name="status"
            defaultValue={status || "ALL"}
            className="w-40 h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="ALL">전체</option>
            <option value="ACTIVE">활성</option>
            <option value="PENDING_VERIFICATION">대기</option>
            <option value="HIDDEN">숨김</option>
            <option value="EXPIRED">만료</option>
            <option value="DELETED">삭제</option>
          </select>

          <select
            name="category"
            defaultValue={category || ""}
            className="w-40 h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">전체</option>
            {Object.entries(BUSINESS_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-10 px-5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            검색
          </button>
        </form>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-3">
        총 {formatNumber(totalCount)}건
      </p>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">업종</th>
                <th className="px-4 py-3 font-medium">지역</th>
                <th className="px-4 py-3 font-medium text-right">가격</th>
                <th className="px-4 py-3 font-medium text-center">상태</th>
                <th className="px-4 py-3 font-medium text-right">조회수</th>
                <th className="px-4 py-3 font-medium text-right">등록일</th>
                <th className="px-4 py-3 font-medium text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing, index) => (
                <tr
                  key={listing.id}
                  className="border-b border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500">
                    {(page - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/listings/${listing.id}`}
                      className="font-medium text-gray-900 hover:text-blue-500"
                    >
                      {listing.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {BUSINESS_CATEGORY_LABELS[listing.businessCategory]}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {listing.city} {listing.district}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatKRW(listing.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[listing.status]
                      }`}
                    >
                      {LISTING_STATUS_LABELS[listing.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatNumber(listing.viewCount)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatDateKR(listing.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ListingActions
                      listingId={listing.id}
                      currentStatus={listing.status}
                    />
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    매물이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === page;
              const searchQuery = new URLSearchParams();
              if (query) searchQuery.set("q", query);
              if (status && status !== "ALL") searchQuery.set("status", status);
              if (category) searchQuery.set("category", category);
              searchQuery.set("page", p.toString());

              return (
                <Link
                  key={p}
                  href={`?${searchQuery.toString()}`}
                  className={`min-w-[32px] h-8 flex items-center justify-center rounded text-sm ${
                    isActive
                      ? "bg-blue-500 text-white font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
