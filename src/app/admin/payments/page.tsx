"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Payment {
  id: string;
  status: string;
  amount: number;
  paymentKey: string | null;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  user: { id: string; name: string | null; email: string | null };
  product: { name: string; categoryScope: string; price: number; type: string };
  listing: { id: string; storeName: string | null; addressJibun: string | null } | null;
  equipment: { id: string; title: string } | null;
}

interface ListResponse {
  items: Payment[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const SCOPE_LABEL: Record<string, string> = {
  LISTING: "매물",
  EQUIPMENT: "집기",
  FRANCHISE: "프랜차이즈",
  PARTNER: "협력업체",
  COMMON: "공통",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기",
  PAID: "결제완료",
  CANCELLED: "취소",
  REFUNDED: "환불",
  EXPIRED: "만료",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "PAID"
      ? "bg-green-100 text-green-700"
      : status === "REFUNDED"
        ? "bg-red-100 text-red-700"
        : status === "PENDING"
          ? "bg-yellow-100 text-yellow-700"
          : status === "EXPIRED"
            ? "bg-gray-200 text-gray-600"
            : "bg-gray-100 text-gray-500";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [scope, setScope] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);

  function buildQS() {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", "50");
    if (status) qs.set("status", status);
    if (scope) qs.set("scope", scope);
    if (q.trim()) qs.set("q", q.trim());
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    return qs.toString();
  }

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payments?${buildQS()}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, scope, from, to]);

  function applySearch() {
    setPage(1);
    fetchData();
  }

  function resetFilters() {
    setStatus("");
    setScope("");
    setQ("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  async function handleRefund(p: Payment) {
    if (p.status !== "PAID") return;
    const reason = prompt(
      `이 결제를 환불 처리하시겠습니까?\n\n${p.user.email} · ${p.product.name} · ${p.amount.toLocaleString()}원\n\n토스 환불 + 광고 비활성화가 즉시 진행됩니다.\n\n환불 사유 (선택, 미입력 시 '관리자 환불'):`
    );
    if (reason === null) return; // 취소

    setRefundingId(p.id);
    try {
      const res = await fetch(`/api/admin/payments/${p.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || "관리자 환불" }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "환불 실패");
        return;
      }
      alert("환불 처리 완료");
      fetchData();
    } catch (e) {
      alert("네트워크 오류");
    } finally {
      setRefundingId(null);
    }
  }

  function downloadCSV() {
    const url = `/api/admin/payments/csv?${buildQS().replace(/page=\d+&?/, "").replace(/limit=\d+&?/, "")}`;
    window.location.href = url;
  }

  function fmtDateTime(iso: string) {
    const d = new Date(iso);
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function renderTarget(p: Payment) {
    if (p.listing) {
      return (
        <Link
          href={`/listings/${p.listing.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:underline"
        >
          {p.listing.storeName || "(이름 없음)"}
        </Link>
      );
    }
    if (p.equipment) {
      return (
        <Link
          href={`/equipment/${p.equipment.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:underline"
        >
          {p.equipment.title}
        </Link>
      );
    }
    return <span className="text-gray-400">-</span>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">결제 내역</h1>
          <p className="text-sm text-gray-500 mt-1">
            전체 결제 시간순 조회 · 환불 처리 · CSV 다운로드
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/paid-dashboard"
            className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            통계 대시보드
          </Link>
          <button
            onClick={downloadCSV}
            className="px-3 md:px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800"
          >
            CSV 다운로드
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">전체 상태</option>
          <option value="PAID">결제완료</option>
          <option value="REFUNDED">환불</option>
          <option value="PENDING">대기</option>
          <option value="CANCELLED">취소</option>
          <option value="EXPIRED">만료</option>
        </select>
        <select
          value={scope}
          onChange={(e) => {
            setScope(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">전체 카테고리</option>
          <option value="LISTING">매물</option>
          <option value="EQUIPMENT">집기</option>
          <option value="FRANCHISE">프랜차이즈</option>
          <option value="PARTNER">협력업체</option>
          <option value="COMMON">공통</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="시작일"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          placeholder="종료일"
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          placeholder="회원 이메일/이름"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={applySearch}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
          >
            검색
          </button>
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 요약 */}
      {data && (
        <div className="text-sm text-gray-500 mb-3">
          총 <span className="font-semibold text-gray-900">{data.pagination.total.toLocaleString()}</span>건 · {data.pagination.page} / {data.pagination.totalPages}페이지
        </div>
      )}

      {/* 테이블 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                <th className="hidden md:table-cell px-4 py-3">결제일시</th>
                <th className="px-3 md:px-4 py-3">회원</th>
                <th className="px-3 md:px-4 py-3">상품</th>
                <th className="hidden md:table-cell px-4 py-3">대상</th>
                <th className="px-3 md:px-4 py-3 text-right">금액</th>
                <th className="px-3 md:px-4 py-3">상태</th>
                <th className="px-3 md:px-4 py-3 text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    결제 내역이 없습니다
                  </td>
                </tr>
              ) : (
                data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-gray-700">
                      {fmtDateTime(p.createdAt)}
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="font-medium text-gray-900">{p.user.name || "-"}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">{p.user.email}</div>
                      <div className="md:hidden text-xs text-gray-400 mt-0.5">{fmtDateTime(p.createdAt)}</div>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">{p.product.name}</div>
                      <div className="text-xs text-gray-500">
                        {SCOPE_LABEL[p.product.categoryScope] || p.product.categoryScope}
                      </div>
                      <div className="md:hidden text-xs text-gray-400 truncate max-w-[120px]">
                        {renderTarget(p)}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-gray-700 max-w-[200px] truncate">
                      {renderTarget(p)}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {p.amount.toLocaleString()}원
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 md:px-4 py-3 text-center">
                      {p.status === "PAID" ? (
                        <button
                          onClick={() => handleRefund(p)}
                          disabled={refundingId === p.id}
                          className="px-2 md:px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
                        >
                          {refundingId === p.id ? "..." : "환불"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page} / {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
