"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminPartner {
  id: string;
  companyName: string;
  serviceType: string;
  tier: string;
  user: {
    name: string;
    email: string;
  };
  status: string;
  viewCount: number;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "DRAFT", label: "임시저장" },
  { value: "DELETED", label: "삭제됨" },
];

const SERVICE_TYPE_LABEL: Record<string, string> = {
  INTERIOR: "인테리어",
  SIGNAGE: "간판/사인",
  EQUIPMENT: "주방기기",
  CLEANING: "청소/방역",
  ACCOUNTING: "세무/회계",
  LEGAL: "법무",
  POS_SYSTEM: "POS시스템",
  DELIVERY: "배달대행",
  MARKETING: "마케팅",
  CONSULTING: "컨설팅",
  OTHER: "기타",
};

const TIER_LABEL: Record<string, string> = {
  FREE: "무료",
  BASIC: "베이직",
  PREMIUM: "프리미엄",
  VIP: "VIP",
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (statusFilter) params.set("status", statusFilter);
    if (keyword) params.set("keyword", keyword);

    const res = await fetch(`/api/admin/partners?${params}`);
    const data = await res.json();
    setPartners(data.partners || []);
    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter, keyword]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  async function handleStatusChange(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/partners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      alert("상태가 변경되었습니다");
      fetchPartners();
    } else {
      alert("상태 변경에 실패했습니다");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const res = await fetch(`/api/admin/partners/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      alert("삭제되었습니다");
      fetchPartners();
    } else {
      alert("삭제에 실패했습니다");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">협력업체 관리</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="업체명, 등록자 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none"
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center">
          <p className="text-gray-400">협력업체가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">업체명</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">서비스유형</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">등급</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">등록자</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">상태</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">조회수</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">등록일</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {partner.companyName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {SERVICE_TYPE_LABEL[partner.serviceType] || partner.serviceType}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        partner.tier === "VIP"
                          ? "bg-purple-100 text-purple-800"
                          : partner.tier === "PREMIUM"
                            ? "bg-blue-100 text-blue-800"
                            : partner.tier === "BASIC"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {TIER_LABEL[partner.tier] || partner.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{partner.user.name}</div>
                    <div className="text-xs text-gray-400">{partner.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        partner.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : partner.status === "DRAFT"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {partner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {partner.viewCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(partner.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <select
                        value={partner.status}
                        onChange={(e) => handleStatusChange(partner.id, e.target.value)}
                        className="text-sm px-3 py-1 border border-gray-300 rounded-lg outline-none"
                      >
                        {STATUS_OPTIONS.filter((opt) => opt.value).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(partner.id)}
                        className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    </div>
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
