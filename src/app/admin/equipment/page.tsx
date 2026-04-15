"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { EQUIPMENT_CATEGORY_LABELS } from "@/lib/constants";
import { toast } from "@/lib/toast";

interface AdminEquipment {
  id: string;
  title: string;
  category: string;
  price: number;
  user: {
    name: string;
    email: string;
  };
  status: string;
  images: Array<{ url: string }>;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "RESERVED", label: "예약" },
  { value: "SOLD", label: "판매완료" },
  { value: "EXPIRED", label: "만료" },
  { value: "DELETED", label: "삭제됨" },
  { value: "DRAFT", label: "임시저장" },
];

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "활성",
  RESERVED: "예약",
  SOLD: "판매완료",
  EXPIRED: "만료",
  DELETED: "삭제",
  DRAFT: "임시저장",
};

export default function AdminEquipmentPage() {
  const [equipment, setEquipment] = useState<AdminEquipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (statusFilter) params.set("status", statusFilter);
      if (keyword) params.set("keyword", keyword);

      const res = await fetch(`/api/admin/equipment?${params}`);
      const data = await res.json();
      setEquipment(data.equipment || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setEquipment([]);
      setTotal(0);
      setTotalPages(1);
    }
    setLoading(false);
  }, [page, statusFilter, keyword]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  async function handleStatusChange(id: string, newStatus: string) {
    const label = STATUS_LABELS[newStatus] || newStatus;
    if (!confirm(`상태를 "${label}"(으)로 변경하시겠습니까?`)) return;

    const res = await fetch(`/api/admin/equipment/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success("상태가 변경되었습니다");
      fetchEquipment();
    } else {
      const error = await res.json();
      toast.error(error.error || "상태 변경에 실패했습니다");
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}"을(를) 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    const res = await fetch(`/api/admin/equipment/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("삭제되었습니다");
      fetchEquipment();
    } else {
      const error = await res.json();
      toast.error(error.error || "삭제에 실패했습니다");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">집기장터 관리</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="제목, 설명 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg outline-none"
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
      ) : equipment.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center">
          <p className="text-gray-400">집기가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">사진</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">제목</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">카테고리</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">가격</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">판매자</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">상태</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">등록일</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {equipment.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {item.images?.[0]?.url ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.images[0].url}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        사진없음
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {item.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {EQUIPMENT_CATEGORY_LABELS[item.category] || item.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {item.price.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[180px]">
                    <div className="truncate">{item.user.name}</div>
                    <div className="text-xs text-gray-400 truncate">{item.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : item.status === "RESERVED"
                            ? "bg-yellow-100 text-yellow-800"
                            : item.status === "SOLD"
                              ? "bg-blue-100 text-blue-800"
                              : item.status === "EXPIRED"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-sm px-3 py-1 border border-gray-300 bg-white text-gray-900 rounded-lg outline-none"
                      >
                        {STATUS_OPTIONS.filter((opt) => opt.value).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
