"use client";

import { useEffect, useState } from "react";

interface AdminStats {
  totalUsers: number;
  activeListings: number;
  pendingReports: number;
  totalRevenue: number;
  activePartners: number;
  totalFranchises: number;
  usersByRole: { role: string; _count: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

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
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className={`w-12 h-12 rounded-full ${card.color} flex items-center justify-center text-2xl mb-3`}>
                  {card.icon}
                </div>
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {stats?.usersByRole && stats.usersByRole.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
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
        </>
      )}
    </div>
  );
}
