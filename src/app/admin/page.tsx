"use client";

import { useEffect, useState } from "react";

interface TimeSeriesEntry {
  date: string;
  total: number;
}

interface AdminStats {
  totalUsers: number;
  activeListings: number;
  pendingReports: number;
  totalRevenue: number;
  activePartners: number;
  totalFranchises: number;
  usersByRole: { role: string; _count: number }[];
  timeSeries?: {
    revenue: TimeSeriesEntry[];
    signups: TimeSeriesEntry[];
    listings: TimeSeriesEntry[];
  };
  popularCategories?: { name: string; count: number }[];
  popularRegions?: { name: string; count: number }[];
  signupStats?: {
    totals: { today: number; yesterday: number; last7days: number; last30days: number };
    byRole: {
      role: string;
      today: number;
      yesterday: number;
      last7days: number;
      last30days: number;
      total: number;
    }[];
    verification: { role: string; total: number; verified: number }[];
  };
}

type ChartTab = "revenue" | "signups" | "listings";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<ChartTab>("revenue");

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "전체 회원수",
      value: stats?.totalUsers.toLocaleString() || "0",
      icon: "👥",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "활성 매물수",
      value: stats?.activeListings.toLocaleString() || "0",
      icon: "🏪",
      color: "bg-green-50 text-green-600",
    },
    {
      label: "활성 협력업체",
      value: stats?.activePartners.toLocaleString() || "0",
      icon: "🤝",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "프랜차이즈 수",
      value: stats?.totalFranchises.toLocaleString() || "0",
      icon: "🏢",
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      label: "대기중 신고",
      value: stats?.pendingReports.toLocaleString() || "0",
      icon: "⚠️",
      color: "bg-orange-50 text-orange-600",
    },
    {
      label: "총 매출",
      value: stats?.totalRevenue.toLocaleString() + "원" || "0원",
      icon: "💰",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const roleLabel: Record<string, string> = {
    BUYER: "예비창업자",
    SELLER: "사장님",
    FRANCHISE: "프랜차이즈본사",
    PARTNER: "협력업체",
    ADMIN: "관리자",
  };

  const chartTabs: { key: ChartTab; label: string; unit: string }[] = [
    { key: "revenue", label: "매출 추이", unit: "원" },
    { key: "signups", label: "가입 추이", unit: "명" },
    { key: "listings", label: "매물등록 추이", unit: "건" },
  ];

  const getChartData = (): TimeSeriesEntry[] => {
    if (!stats?.timeSeries) return [];
    return stats.timeSeries[chartTab] || [];
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map((d) => d.total), 1);
  const totalSum = chartData.reduce((acc, d) => acc + d.total, 0);
  const avgValue = chartData.length > 0 ? Math.round(totalSum / chartData.length) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((card, i) => (
              <div key={i} className="bg-cream rounded-3xl border border-line p-6">
                <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center text-2xl mb-3`}>
                  {card.icon}
                </div>
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {/* 신규 가입 현황 */}
          {stats?.signupStats && (
            <div className="bg-cream rounded-3xl border border-line p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">신규 가입 현황</h2>

              {/* 기간별 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "오늘", value: stats.signupStats.totals.today, color: "bg-blue-50 text-blue-700" },
                  { label: "어제", value: stats.signupStats.totals.yesterday, color: "bg-indigo-50 text-indigo-700" },
                  { label: "최근 7일", value: stats.signupStats.totals.last7days, color: "bg-emerald-50 text-emerald-700" },
                  { label: "최근 30일", value: stats.signupStats.totals.last30days, color: "bg-amber-50 text-amber-700" },
                ].map((c) => (
                  <div key={c.label} className={`rounded-2xl p-4 ${c.color}`}>
                    <p className="text-xs font-medium opacity-80">{c.label}</p>
                    <p className="text-2xl font-bold mt-1">{c.value.toLocaleString()}<span className="text-base font-medium ml-0.5">명</span></p>
                  </div>
                ))}
              </div>

              {/* 역할별 표 */}
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[500px] text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-200">
                      <th className="text-left py-2 px-2 font-medium">역할</th>
                      <th className="text-right py-2 px-2 font-medium">오늘</th>
                      <th className="text-right py-2 px-2 font-medium">어제</th>
                      <th className="text-right py-2 px-2 font-medium">7일</th>
                      <th className="text-right py-2 px-2 font-medium">30일</th>
                      <th className="text-right py-2 px-2 font-medium">누적</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.signupStats.byRole.map((r) => (
                      <tr key={r.role} className="border-b border-gray-100">
                        <td className="py-2.5 px-2 text-gray-900 font-medium">{roleLabel[r.role] || r.role}</td>
                        <td className={`text-right py-2.5 px-2 ${r.today > 0 ? "text-blue-700 font-semibold" : "text-gray-400"}`}>{r.today.toLocaleString()}</td>
                        <td className="text-right py-2.5 px-2 text-gray-700">{r.yesterday.toLocaleString()}</td>
                        <td className="text-right py-2.5 px-2 text-gray-700">{r.last7days.toLocaleString()}</td>
                        <td className="text-right py-2.5 px-2 text-gray-700">{r.last30days.toLocaleString()}</td>
                        <td className="text-right py-2.5 px-2 text-gray-900 font-semibold">{r.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 사업자인증 진행률 */}
              {stats.signupStats.verification.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">사업자인증 진행률</h3>
                  <div className="space-y-2.5">
                    {stats.signupStats.verification.map((v) => {
                      const pct = v.total > 0 ? Math.round((v.verified / v.total) * 100) : 0;
                      return (
                        <div key={v.role} className="flex items-center gap-3">
                          <div className="w-24 text-sm text-gray-700 font-medium flex-shrink-0">{roleLabel[v.role] || v.role}</div>
                          <div className="flex-1 relative h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-emerald-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-600 whitespace-nowrap min-w-[140px] text-right">
                            <span className="font-semibold text-emerald-700">{v.verified.toLocaleString()}</span>
                            <span className="text-gray-400"> / {v.total.toLocaleString()}명</span>
                            <span className="ml-2 text-gray-500 font-medium">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {stats?.usersByRole && stats.usersByRole.length > 0 && (
            <div className="bg-cream rounded-3xl border border-line p-6 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">역할별 회원 분포</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {stats.usersByRole.map((item) => (
                  <div key={item.role} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{item._count.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">{roleLabel[item.role] || item.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 인기 업종 & 지역 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* 인기 업종 */}
            {stats?.popularCategories && stats.popularCategories.length > 0 && (
              <div className="bg-cream rounded-3xl border border-line p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">인기 업종 TOP 5</h2>
                <div className="space-y-3">
                  {stats.popularCategories.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-gray-900 font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{item.count.toLocaleString()}건</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 인기 지역 */}
            {stats?.popularRegions && stats.popularRegions.length > 0 && (
              <div className="bg-cream rounded-3xl border border-line p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">인기 지역 TOP 5</h2>
                <div className="space-y-3">
                  {stats.popularRegions.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-gray-900 font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{item.count.toLocaleString()}건</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 시계열 차트 */}
          <div className="bg-cream rounded-3xl border border-line p-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-900">최근 30일 추이</h2>
              <div className="inline-flex bg-gray-100 rounded-lg p-1">
                {chartTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setChartTab(tab.key)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      chartTab === tab.key
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 합계/평균 요약 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">30일 합계</p>
                <p className="text-xl font-bold text-blue-900">
                  {chartTab === "revenue"
                    ? totalSum.toLocaleString() + "원"
                    : totalSum.toLocaleString() + (chartTab === "signups" ? "명" : "건")}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">일 평균</p>
                <p className="text-xl font-bold text-green-900">
                  {chartTab === "revenue"
                    ? avgValue.toLocaleString() + "원"
                    : avgValue.toLocaleString() + (chartTab === "signups" ? "명" : "건")}
                </p>
              </div>
            </div>

            {/* 바 차트 */}
            {chartData.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>데이터가 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end gap-[2px] min-w-[600px]" style={{ height: "200px" }}>
                  {chartData.map((d) => {
                    const heightPct = Math.max((d.total / maxValue) * 100, 2);
                    const dateLabel = d.date.slice(5); // MM-DD
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center justify-end group relative"
                        style={{ height: "100%" }}
                      >
                        {/* 툴팁 */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {d.date}: {d.total.toLocaleString()}
                          {chartTab === "revenue" ? "원" : chartTab === "signups" ? "명" : "건"}
                        </div>
                        {/* 바 */}
                        <div
                          className={`w-full rounded-t transition-all ${
                            chartTab === "revenue"
                              ? "bg-purple-400 group-hover:bg-purple-500"
                              : chartTab === "signups"
                              ? "bg-blue-400 group-hover:bg-blue-500"
                              : "bg-green-400 group-hover:bg-green-500"
                          }`}
                          style={{ height: `${heightPct}%`, minHeight: "2px" }}
                        />
                        {/* 날짜 라벨 (5일 간격) */}
                        {(chartData.indexOf(d) % 5 === 0 || chartData.indexOf(d) === chartData.length - 1) && (
                          <span className="text-xs text-gray-400 mt-1 rotate-[-45deg] origin-top-left whitespace-nowrap">
                            {dateLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
