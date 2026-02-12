"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare, Inbox, Send, ChevronDown, ChevronUp, Phone } from "lucide-react";
import { INQUIRY_STATUS_LABELS, INQUIRY_STATUS_BADGE } from "@/lib/utils/constants";

type InquiryStatus = "PENDING" | "REPLIED" | "CANCELLED";

interface Inquiry {
  id: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  listing: {
    id: string;
    title: string;
  };
  sender: {
    id: string;
    name: string | null;
    phone: string | null;
  };
  receiver: {
    id: string;
    name: string | null;
  };
}

type TabType = "received" | "sent";
type FilterStatus = "ALL" | InquiryStatus;

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "대기중" },
  { value: "REPLIED", label: "답변완료" },
  { value: "CANCELLED", label: "종료" },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

export default function InquiriesPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("received");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setExpandedId(null);
    try {
      const endpoint =
        tab === "received"
          ? `/api/inquiries/received?status=${statusFilter}`
          : `/api/inquiries/sent`;
      const res = await fetch(endpoint);
      const json = await res.json();
      setInquiries(json.data ?? []);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [tab, statusFilter]);

  useEffect(() => {
    if (authStatus === "authenticated") fetchInquiries();
  }, [authStatus, fetchInquiries]);

  const handleStatusChange = async (id: string, newStatus: InquiryStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchInquiries();
      }
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-navy" />
        <h1 className="text-2xl font-bold text-navy">문의 관리</h1>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-gray-200">
        <button
          onClick={() => {
            setTab("received");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "received"
              ? "border-b-2 border-navy text-navy"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Inbox className="h-4 w-4" />
          받은 문의
        </button>
        <button
          onClick={() => {
            setTab("sent");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "sent"
              ? "border-b-2 border-navy text-navy"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Send className="h-4 w-4" />
          보낸 문의
        </button>
      </div>

      {/* Status Filter (received tab only) */}
      {tab === "received" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-navy text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="ml-auto h-4 w-16 rounded bg-gray-200" />
              </div>
              <div className="mt-3 h-4 w-3/4 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && inquiries.length === 0 && (
        <div className="mt-12 flex flex-col items-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">
            {tab === "received" ? "받은 문의가 없습니다" : "보낸 문의가 없습니다"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {tab === "received"
              ? "매물에 대한 문의가 들어오면 여기에 표시됩니다."
              : "매물에 문의를 보내면 여기에 표시됩니다."}
          </p>
        </div>
      )}

      {/* Inquiry List */}
      {!loading && inquiries.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="mt-6 hidden md:block">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500">
                    <th className="px-4 py-3">매물</th>
                    <th className="px-4 py-3">
                      {tab === "received" ? "보낸 사람" : "내용"}
                    </th>
                    <th className="px-4 py-3">
                      {tab === "received" ? "내용" : ""}
                    </th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">날짜</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inquiries.map((inq) => {
                    const isExpanded = expandedId === inq.id;
                    const badge = INQUIRY_STATUS_BADGE[inq.status] ?? {
                      bg: "bg-gray-100",
                      text: "text-gray-500",
                    };
                    return (
                      <InquiryRowGroup key={inq.id}>
                        <tr
                          onClick={() => toggleExpand(inq.id)}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">
                            {truncate(inq.listing.title, 20)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {tab === "received"
                              ? inq.sender.name ?? "익명"
                              : truncate(inq.message, 30)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {tab === "received"
                              ? truncate(inq.message, 30)
                              : ""}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                            >
                              {INQUIRY_STATUS_LABELS[inq.status] ?? inq.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {formatDate(inq.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50 px-6 py-4">
                              <InquiryDetail
                                inquiry={inq}
                                tab={tab}
                                updatingId={updatingId}
                                onStatusChange={handleStatusChange}
                              />
                            </td>
                          </tr>
                        )}
                      </InquiryRowGroup>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="mt-6 space-y-3 md:hidden">
            {inquiries.map((inq) => {
              const isExpanded = expandedId === inq.id;
              const badge = INQUIRY_STATUS_BADGE[inq.status] ?? {
                bg: "bg-gray-100",
                text: "text-gray-500",
              };
              return (
                <div
                  key={inq.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <button
                    onClick={() => toggleExpand(inq.id)}
                    className="w-full px-4 py-3 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {inq.listing.title}
                        </p>
                        {tab === "received" && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {inq.sender.name ?? "익명"}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          {truncate(inq.message, 40)}
                        </p>
                      </div>
                      <div className="ml-3 flex flex-col items-end gap-1">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {INQUIRY_STATUS_LABELS[inq.status] ?? inq.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(inq.createdAt)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                      <InquiryDetail
                        inquiry={inq}
                        tab={tab}
                        updatingId={updatingId}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function InquiryRowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function InquiryDetail({
  inquiry,
  tab,
  updatingId,
  onStatusChange,
}: {
  inquiry: Inquiry;
  tab: TabType;
  updatingId: string | null;
  onStatusChange: (id: string, status: InquiryStatus) => void;
}) {
  const isUpdating = updatingId === inquiry.id;

  return (
    <div className="space-y-3">
      {/* Full message */}
      <div>
        <p className="text-xs font-medium text-gray-500">문의 내용</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
          {inquiry.message}
        </p>
      </div>

      {/* Sender info (received tab only) */}
      {tab === "received" && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-xs text-gray-500">보낸 사람: </span>
            <span className="font-medium text-gray-700">
              {inquiry.sender.name ?? "익명"}
            </span>
          </div>
          {inquiry.sender.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-700">{inquiry.sender.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons (received tab only, status is PENDING) */}
      {tab === "received" && inquiry.status === "PENDING" && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(inquiry.id, "REPLIED");
            }}
            disabled={isUpdating}
            className="rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {isUpdating ? "처리 중..." : "답변완료"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(inquiry.id, "CANCELLED");
            }}
            disabled={isUpdating}
            className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:opacity-50"
          >
            {isUpdating ? "처리 중..." : "종료"}
          </button>
        </div>
      )}

      {/* Date */}
      <p className="text-xs text-gray-400">
        {formatDate(inquiry.createdAt)}
      </p>
    </div>
  );
}
