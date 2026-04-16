"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

type InquiryStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<InquiryStatus, string> = {
  PENDING: "대기중",
  IN_PROGRESS: "처리중",
  RESOLVED: "해결완료",
  CLOSED: "종료",
};

const STATUS_COLORS: Record<InquiryStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<InquiryStatus | "ALL">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string>("");

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filterStatus !== "ALL") {
        params.set("status", filterStatus);
      }

      const response = await fetch(`/api/admin/inquiries?${params}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setInquiries(data.inquiries);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Fetch inquiries error:", error);
      toast.error("문의 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [page, filterStatus]);

  const handleStatusChange = async (id: string, newStatus: InquiryStatus) => {
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("상태가 변경되었습니다.");
      fetchInquiries();
    } catch (error) {
      console.error("Status change error:", error);
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleSaveNote = async (id: string) => {
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminNote: editingNote }),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("메모가 저장되었습니다.");
      setExpandedId(null);
      setEditingNote("");
      fetchInquiries();
    } catch (error) {
      console.error("Save note error:", error);
      toast.error("메모 저장에 실패했습니다.");
    }
  };

  const toggleExpand = (inquiry: Inquiry) => {
    if (expandedId === inquiry.id) {
      setExpandedId(null);
      setEditingNote("");
    } else {
      setExpandedId(inquiry.id);
      setEditingNote(inquiry.adminNote || "");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">문의 관리</h1>
        <p className="text-gray-600">고객 문의를 확인하고 처리하세요</p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {(["ALL", "PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {status === "ALL" ? "전체" : STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">로딩 중...</div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">문의가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => {
            const isExpanded = expandedId === inquiry.id;
            return (
              <div key={inquiry.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(inquiry)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                          {inquiry.subject}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[inquiry.status]
                          }`}
                        >
                          {STATUS_LABELS[inquiry.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{inquiry.name}</span>
                        <span>{inquiry.email}</span>
                        <span>{new Date(inquiry.createdAt).toLocaleString("ko-KR")}</span>
                      </div>
                    </div>
                    <button aria-label={isExpanded ? "접기" : "펼치기"} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                      <svg
                        className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-line p-5 bg-gray-50">
                    {/* Message */}
                    <div className="mb-5">
                      <h4 className="font-semibold text-gray-900 mb-2">문의 내용</h4>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 whitespace-pre-wrap">
                        {inquiry.message}
                      </div>
                    </div>

                    {/* Status Change */}
                    <div className="mb-5">
                      <h4 className="font-semibold text-gray-900 mb-2">상태 변경</h4>
                      <div className="flex gap-2">
                        {(["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const).map((status) => (
                          <button
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(inquiry.id, status);
                            }}
                            disabled={inquiry.status === status}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              inquiry.status === status
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {STATUS_LABELS[status]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin Note */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">관리자 메모</h4>
                      <textarea
                        value={editingNote}
                        onChange={(e) => {
                          e.stopPropagation();
                          setEditingNote(e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                        placeholder="관리자 전용 메모를 입력하세요..."
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveNote(inquiry.id);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          메모 저장
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            이전
          </button>
          <span className="px-4 py-2 text-gray-700">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
