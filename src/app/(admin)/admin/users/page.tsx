import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateKR, formatNumber } from "@/lib/utils/format";
import { UserActions } from "./actions";
import { UserRole, AccountStatus } from "@prisma/client";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원 관리 - 권리샵",
};

const ITEMS_PER_PAGE = 20;

type SearchParams = Promise<{
  q?: string;
  role?: string;
  status?: string;
  page?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const role = params.role as UserRole | "ALL" | undefined;
  const status = params.status as AccountStatus | "ALL" | undefined;
  const page = parseInt(params.page || "1", 10);

  // Build where clause
  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }
  if (role && role !== "ALL") {
    where.role = role;
  }
  if (status && status !== "ALL") {
    where.accountStatus = status;
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        _count: {
          select: { listings: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const roleLabels: Record<string, string> = {
    BUYER: "구매자",
    SELLER: "판매자",
    ADMIN: "관리자",
  };

  const roleColors: Record<string, string> = {
    ADMIN: "bg-blue-100 text-blue-700",
    SELLER: "bg-green-100 text-green-700",
    BUYER: "bg-gray-100 text-gray-600",
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    DEACTIVATED: "bg-gray-100 text-gray-600",
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: "활성",
    SUSPENDED: "정지",
    DEACTIVATED: "비활성",
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
              placeholder="이름 또는 이메일 검색"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <select
            name="role"
            defaultValue={role || "ALL"}
            className="w-36 h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="ALL">전체</option>
            <option value="BUYER">구매자</option>
            <option value="SELLER">판매자</option>
            <option value="ADMIN">관리자</option>
          </select>

          <select
            name="status"
            defaultValue={status || "ALL"}
            className="w-36 h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="ALL">전체</option>
            <option value="ACTIVE">활성</option>
            <option value="SUSPENDED">정지</option>
            <option value="DEACTIVATED">비활성</option>
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
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium text-center">역할</th>
                <th className="px-4 py-3 font-medium text-center">상태</th>
                <th className="px-4 py-3 font-medium text-right">매물 수</th>
                <th className="px-4 py-3 font-medium text-right">가입일</th>
                <th className="px-4 py-3 font-medium text-center">액션</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 even:bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500">
                    {(page - 1) * ITEMS_PER_PAGE + index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {user.name || "미등록"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        roleColors[user.role]
                      }`}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[user.accountStatus]
                      }`}
                    >
                      {statusLabels[user.accountStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatNumber(user._count.listings)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatDateKR(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <UserActions
                      userId={user.id}
                      currentStatus={user.accountStatus}
                    />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    회원이 없습니다.
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
              if (role && role !== "ALL") searchQuery.set("role", role);
              if (status && status !== "ALL") searchQuery.set("status", status);
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
