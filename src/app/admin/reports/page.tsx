"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "@/lib/toast";

interface AdminReport {
  id: string;
  reporter: {
    name: string;
    email: string;
  };
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "전체" },
  { value: "PENDING", label: "대기중" },
  { value: "REVIEWED", label: "검토중" },
  { value: "RESOLVED", label: "처리완료" },
  { value: "DISMISSED", label: "기각" },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/admin/reports?${params}`);
    const data = await res.json();
    setReports(data.reports || []);
    setTotal(data.pagination?.total || 0);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleStatusChange(id: string, newStatus: string) {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast.success("상태가 변경되었습니다");
      fetchReports();
    } else {
      toast.error("상태 변경에 실패했습니다");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">신고관리</h1>

      {/* Filters */}
      <div className="bg-cream rounded-3xl border border-line p-4 mb-6">
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
      ) : reports.length === 0 ? (
        <div className="bg-cream rounded-3xl border border-line p-20 text-center">
          <p className="text-gray-400">신고가 없습니다</p>
        </div>
      ) : (
        <div className="bg-cream rounded-3xl border border-line overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">신고자</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">대상 유형</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">신고 사유</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">상태</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">신고일</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{report.reporter.name}</div>
                    <div className="text-xs text-gray-400">{report.reporter.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{report.targetType}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {report.reason}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : report.status === "REVIEWED"
                            ? "bg-blue-100 text-blue-800"
                            : report.status === "RESOLVED"
                              ? "bg-green-100 text-green-800"
                              : report.status === "DISMISSED"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {report.status === "PENDING" && (
                        <button
                          onClick={() => handleStatusChange(report.id, "REVIEWED")}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          검토중
                        </button>
                      )}
                      {report.status === "REVIEWED" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(report.id, "RESOLVED")}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            처리완료
                          </button>
                          {report.targetType === "USER" && (
                            <button
                              onClick={async () => {
                                if (!confirm(`대상 ID ${report.targetId}를 제재하시겠습니까?\n\n매물/서비스 비활성화 + 사업자번호 블랙리스트 등록됩니다.`)) return;
                                const res = await fetch("/api/admin/users", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    targetUserId: report.targetId,
                                    action: "ban",
                                    reason: `신고 처리: ${report.reason}`,
                                  }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  toast.success(data.message || "제재 완료");
                                  handleStatusChange(report.id, "RESOLVED");
                                } else {
                                  toast.error(data.error || "제재 실패");
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                            >
                              제재
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(report.id, "DISMISSED")}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                          >
                            기각
                          </button>
                        </>
                      )}
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
