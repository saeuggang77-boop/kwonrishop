"use client";

import { useEffect, useState, useCallback } from "react";

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
  { value: "REVIEWING", label: "검토중" },
  { value: "RESOLVED", label: "처리완료" },
  { value: "REJECTED", label: "기각" },
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
      alert("상태가 변경되었습니다");
      fetchReports();
    } else {
      alert("상태 변경에 실패했습니다");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">신고관리</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-20 text-center">
          <p className="text-gray-400">신고가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
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
                          : report.status === "REVIEWING"
                            ? "bg-blue-100 text-blue-800"
                            : report.status === "RESOLVED"
                              ? "bg-green-100 text-green-800"
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
                          onClick={() => handleStatusChange(report.id, "REVIEWING")}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          검토중
                        </button>
                      )}
                      {report.status === "REVIEWING" && (
                        <>
                          <button
                            onClick={() => handleStatusChange(report.id, "RESOLVED")}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            처리완료
                          </button>
                          <button
                            onClick={() => handleStatusChange(report.id, "REJECTED")}
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
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                page === p
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
