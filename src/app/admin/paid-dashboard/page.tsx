"use client";

import { useEffect, useState } from "react";

interface TierBreakdown {
  tier: string;
  _count: number;
}

interface SummaryItem {
  total: number;
  breakdown: TierBreakdown[];
}

interface ExpiringSoon {
  type: string;
  name: string;
  tier: string;
  expiresAt: string | null;
}

interface CategoryRevenue {
  count: number;
  total: number;
}

interface TopUser {
  userId: string;
  email: string;
  name: string;
  paidCount: number;
  totalAmount: number;
}

interface PaidStats {
  summary: {
    listings: SummaryItem;
    equipment: SummaryItem;
    franchise: SummaryItem;
    partners: SummaryItem;
  };
  expiringSoon: ExpiringSoon[];
  revenue: {
    totalCount: number;
    totalAmount: number;
    last30DaysAmount: number;
    last30DaysCount: number;
    byCategory: Record<string, CategoryRevenue>;
  };
  topUsers: TopUser[];
}

const CATEGORY_LABEL: Record<string, string> = {
  LISTING: "매물",
  FRANCHISE: "프랜차이즈",
  PARTNER: "협력업체",
  EQUIPMENT: "집기장터",
  COMMON: "공통",
};

function TierBadge({ tier }: { tier: string }) {
  const cls =
    tier === "VIP" || tier === "GOLD"
      ? "bg-amber-100 text-amber-800"
      : tier === "PREMIUM" || tier === "SILVER"
        ? "bg-purple-100 text-purple-700"
        : tier === "BASIC" || tier === "BRONZE"
          ? "bg-blue-100 text-blue-700"
          : "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {tier}
    </span>
  );
}

function BreakdownText({ breakdown }: { breakdown: TierBreakdown[] }) {
  if (breakdown.length === 0) return <span className="text-gray-400 text-xs">없음</span>;
  return (
    <span className="text-xs text-gray-500">
      {breakdown.map((b) => `${b.tier} ${b._count}`).join(", ")}
    </span>
  );
}

export default function PaidDashboardPage() {
  const [stats, setStats] = useState<PaidStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/paid-stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      })
      .catch(() => setError("통계를 불러오지 못했습니다"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">유료 현황</h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">유료 현황</h1>
        <div className="bg-red-50 text-red-700 rounded-2xl p-6">{error || "데이터 없음"}</div>
      </div>
    );
  }

  const summaryCards = [
    { label: "유료 매물", icon: "🏪", data: stats.summary.listings },
    { label: "유료 집기", icon: "🛠️", data: stats.summary.equipment },
    { label: "유료 프랜차이즈", icon: "🏢", data: stats.summary.franchise },
    { label: "유료 협력업체", icon: "🤝", data: stats.summary.partners },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">유료 현황</h1>

      {/* Summary Cards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">현재 활성 유료 서비스</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-sm font-medium text-gray-600">{card.label}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {card.data.total.toLocaleString()}
                <span className="text-base font-normal text-gray-500 ml-1">건</span>
              </div>
              <BreakdownText breakdown={card.data.breakdown} />
            </div>
          ))}
        </div>
      </section>

      {/* Expiring Soon */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          만료 임박 (7일 이내)
          <span className="ml-2 text-sm font-normal text-gray-400">{stats.expiringSoon.length}건</span>
        </h2>
        {stats.expiringSoon.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400">
            7일 이내 만료 예정 서비스가 없습니다
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">유형</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">제목</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">등급</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">만료일</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.expiringSoon.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-600">{item.type}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-5 py-3"><TierBadge tier={item.tier} /></td>
                    <td className="px-5 py-3 text-sm text-orange-600 font-medium">
                      {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        disabled
                        className="text-xs px-3 py-1 border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
                        title="추후 구현 예정"
                      >
                        연장 알림 (TODO)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Revenue */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">누적 수익</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">총 결제 건수</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.revenue.totalCount.toLocaleString()}건
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">총 매출</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.revenue.totalAmount.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">최근 30일 매출</div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.revenue.last30DaysAmount.toLocaleString()}원
            </div>
            <div className="text-xs text-gray-400 mt-1">{stats.revenue.last30DaysCount}건</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-2">카테고리별</div>
            <div className="space-y-1">
              {Object.entries(stats.revenue.byCategory).map(([scope, data]) => (
                <div key={scope} className="flex justify-between text-xs">
                  <span className="text-gray-600">{CATEGORY_LABEL[scope] ?? scope}</span>
                  <span className="font-medium text-gray-900">{data.total.toLocaleString()}원</span>
                </div>
              ))}
              {Object.keys(stats.revenue.byCategory).length === 0 && (
                <span className="text-gray-400 text-xs">결제 내역 없음</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Top Users */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">유료 이용 TOP 10 사용자</h2>
        {stats.topUsers.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-400">
            결제 사용자가 없습니다
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">순위</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">이름</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">이메일</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">유료 건수</th>
                  <th className="px-5 py-3 text-left text-sm font-medium text-gray-600">총 결제액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topUsers.map((u, idx) => (
                  <tr key={u.userId} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-bold text-gray-400">#{idx + 1}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                      {u.paidCount.toLocaleString()}건
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-blue-600">
                      {u.totalAmount.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
