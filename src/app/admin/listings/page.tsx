"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "@/lib/toast";

function getUserFilterFromUrl() {
  if (typeof window === "undefined") return { userId: "", name: "", email: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    userId: params.get("userId") || "",
    name: params.get("name") || "",
    email: params.get("email") || "",
  };
}

interface AdminListing {
  id: string;
  storeName: string | null;
  tier: string;
  tierExpiresAt: string | null;
  user: {
    name: string | null;
    email: string | null;
  };
  status: string;
  viewCount: number;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "DRAFT", label: "임시저장" },
  { value: "EXPIRED", label: "만료" },
  { value: "SOLD", label: "판매완료" },
  { value: "DELETED", label: "삭제됨" },
];

const TIER_OPTIONS = [
  { value: "", label: "전체 등급" },
  { value: "FREE", label: "FREE" },
  { value: "BASIC", label: "BASIC" },
  { value: "PREMIUM", label: "PREMIUM" },
  { value: "VIP", label: "VIP" },
];

function TierBadge({ tier }: { tier: string }) {
  const cls =
    tier === "VIP"
      ? "bg-amber-100 text-amber-800"
      : tier === "PREMIUM"
        ? "bg-purple-100 text-purple-700"
        : tier === "BASIC"
          ? "bg-blue-100 text-blue-700"
          : "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
      {tier}
    </span>
  );
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [userFilter, setUserFilter] = useState(() => getUserFilterFromUrl());

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (statusFilter) params.set("status", statusFilter);
    if (tierFilter) params.set("tier", tierFilter);
    if (keyword) params.set("keyword", keyword);
    if (userFilter.userId) params.set("userId", userFilter.userId);

    const res = await fetch(`/api/admin/listings?${params}`);
    const data = await res.json();
    setListings(data.listings || []);
    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter, tierFilter, keyword, userFilter.userId]);

  function clearUserFilter() {
    setUserFilter({ userId: "", name: "", email: "" });
    setPage(1);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/admin/listings");
    }
  }

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  async function handleStatusChange(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success("상태가 변경되었습니다");
      fetchListings();
    } else {
      toast.error("상태 변경에 실패했습니다");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">매물관리</h1>

      {/* User filter banner */}
      {userFilter.userId && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
          <div className="text-sm">
            <span className="text-blue-700 font-medium">
              {userFilter.name || userFilter.email || "선택한 회원"}님
            </span>
            <span className="text-gray-600">의 매물만 보는 중</span>
            {userFilter.email && userFilter.name && (
              <span className="text-xs text-gray-400 ml-2">{userFilter.email}</span>
            )}
          </div>
          <button
            onClick={clearUserFilter}
            className="text-xs px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors whitespace-nowrap"
          >
            전체 매물 보기
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-cream rounded-3xl border border-line p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
          >
            {TIER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="상호명, 주소, 작성자(이름/이메일) 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 min-w-[180px] px-4 py-2 border border-gray-300 rounded-lg outline-none"
          />
          <button
            onClick={() => setPage(1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      {/* Result Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{total.toLocaleString()}</span>건
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-cream rounded-3xl border border-line p-6">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-cream rounded-3xl border border-line p-20 text-center">
          <p className="text-gray-400">매물이 없습니다</p>
        </div>
      ) : (
        <div className="bg-cream rounded-3xl border border-line overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-sm font-medium text-gray-600">상호명</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-600">작성자</th>
                <th className="px-3 md:px-6 py-3 text-left text-sm font-medium text-gray-600">등급</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-600">만료일</th>
                <th className="px-3 md:px-6 py-3 text-left text-sm font-medium text-gray-600">상태</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-600">조회수</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-600">등록일</th>
                <th className="px-3 md:px-6 py-3 text-left text-sm font-medium text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 md:px-6 py-4 text-sm">
                    <a
                      href={`/listings/${listing.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                      title="새 탭에서 매물 상세 보기"
                    >
                      {listing.storeName ?? "[제목 없음]"}
                      <span className="text-xs opacity-60">↗</span>
                    </a>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                    <div>{listing.user.name}</div>
                    <div className="text-xs text-gray-400">{listing.user.email}</div>
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    <TierBadge tier={listing.tier} />
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                    {listing.tier !== "FREE" && listing.tierExpiresAt
                      ? new Date(listing.tierExpiresAt).toLocaleDateString("ko-KR")
                      : "-"}
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        listing.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : listing.status === "SOLD"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                    {listing.viewCount.toLocaleString()}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    <select
                      value={listing.status}
                      onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                      className="text-sm px-2 md:px-3 py-1 border border-gray-300 rounded-lg outline-none"
                    >
                      {STATUS_OPTIONS.filter((opt) => opt.value).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-6">
          {(() => {
            const windowSize = 5;
            let start = Math.max(1, page - Math.floor(windowSize / 2));
            const end = Math.min(totalPages, start + windowSize - 1);
            if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
            const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
            return (
              <>
                <button onClick={() => setPage(1)} disabled={page === 1} className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">&laquo;</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1} className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">&lsaquo;</button>
                {pages.map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
                ))}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">&rsaquo;</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">&raquo;</button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
