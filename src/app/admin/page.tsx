"use client";

import { useEffect, useState } from "react";

interface AdminStats {
  totalUsers: number;
  activeListings: number;
  pendingReports: number;
  totalRevenue: number;
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      )}
    </div>
  );
}
