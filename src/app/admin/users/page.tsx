"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "@/lib/toast";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  listingCount: number;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "BUYER", label: "예비창업자" },
  { value: "SELLER", label: "사장님" },
  { value: "FRANCHISE", label: "프랜차이즈 본사" },
  { value: "PARTNER", label: "협력업체" },
  { value: "ADMIN", label: "관리자" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState("");
  const [keyword, setKeyword] = useState("");

  // 강제탈퇴 모달
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);

  async function handleBan() {
    if (!banTarget) return;
    setBanning(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: banTarget.id,
          action: "ban",
          reason: banReason || "관리자 강제탈퇴",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "강제탈퇴 완료");
        setBanTarget(null);
        setBanReason("");
        fetchUsers();
      } else {
        toast.error(data.error || "강제탈퇴 실패");
      }
    } catch {
      toast.error("강제탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setBanning(false);
    }
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (roleFilter) params.set("role", roleFilter);
    if (keyword) params.set("keyword", keyword);

    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, roleFilter, keyword]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">회원관리</h1>

      {/* Filters */}
      <div className="bg-cream rounded-3xl border border-line p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="이름, 이메일 검색"
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
          총 <span className="font-medium text-gray-900">{total.toLocaleString()}</span>명
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
      ) : users.length === 0 ? (
        <div className="bg-cream rounded-3xl border border-line p-20 text-center">
          <p className="text-gray-400">회원이 없습니다</p>
        </div>
      ) : (
        <div className="bg-cream rounded-3xl border border-line overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-sm font-medium text-gray-600">이름</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-600">이메일</th>
                <th className="px-3 md:px-6 py-3 text-left text-sm font-medium text-gray-600">역할</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-600">인증</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-600">매물수</th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-sm font-medium text-gray-600">가입일</th>
                <th className="px-3 md:px-6 py-3 text-left text-sm font-medium text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 md:px-6 py-4 text-sm text-gray-900">
                    <div>{user.name}</div>
                    <div className="md:hidden text-xs text-gray-400 truncate max-w-[140px]">{user.email}</div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-3 md:px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "SELLER"
                          ? "bg-green-100 text-green-800"
                          : user.role === "FRANCHISE"
                          ? "bg-orange-100 text-orange-800"
                          : user.role === "PARTNER"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {({
                        BUYER: "예비창업자",
                        SELLER: "사장님",
                        FRANCHISE: "프랜차이즈 본사",
                        PARTNER: "협력업체",
                        ADMIN: "관리자",
                      } as Record<string, string>)[user.role] || user.role}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    {user.isVerified ? (
                      <span className="text-green-600 text-sm">✓ 인증완료</span>
                    ) : (
                      <span className="text-gray-400 text-sm">미인증</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                    {user.listingCount.toLocaleString()}개
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    {user.role !== "ADMIN" && !user.email.includes("@banned.local") && !user.email.includes("@withdrawn.local") && (
                      <button
                        onClick={() => setBanTarget(user)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                      >
                        강제탈퇴
                      </button>
                    )}
                    {user.email.includes("@banned.local") && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">강제탈퇴</span>
                    )}
                    {user.email.includes("@withdrawn.local") && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">탈퇴</span>
                    )}
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
      {/* 강제탈퇴 모달 */}
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">회원 강제탈퇴</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-900 font-medium">{banTarget.name}</p>
              <p className="text-xs text-gray-500">{banTarget.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                역할: {({ BUYER: "예비창업자", SELLER: "사장님", FRANCHISE: "프랜차이즈 본사", PARTNER: "협력업체" } as Record<string, string>)[banTarget.role] || banTarget.role}
              </p>
            </div>
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-red-700 font-medium mb-1">강제탈퇴 시 처리 내용:</p>
              <ul className="text-xs text-red-600 space-y-0.5">
                <li>- 매물/집기/협력업체 전체 비활성화</li>
                <li>- 사업자번호 영구 블랙리스트 등록</li>
                <li>- 계정 비활성화 및 세션 무효화</li>
                <li>- 동일 사업자번호로 재가입 차단</li>
              </ul>
            </div>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="강제탈퇴 사유 (선택)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none resize-none mb-4"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setBanTarget(null); setBanReason(""); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleBan}
                disabled={banning}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {banning ? "처리 중..." : "강제탈퇴 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
