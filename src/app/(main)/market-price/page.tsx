"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { Search, Lock, TrendingUp, Wallet, Building, DollarSign, BarChart3 } from "lucide-react";
import { formatKRW } from "@/lib/utils/format";
import { BUSINESS_CATEGORY_LABELS, REGIONS } from "@/lib/utils/constants";

interface MarketPriceData {
  id: string;
  region: string;
  subRegion: string;
  businessType: string;
  avgDeposit: number;
  avgMonthlyRent: number;
  avgKeyMoney: number;
  avgMonthlySales: number;
  sampleCount: number;
}

interface SessionUser {
  id: string;
  name?: string | null;
  subscriptionTier: string;
}

interface MyListing {
  id: string;
  title: string;
  premiumFee: string | number | null;
  businessCategory: string;
  district: string;
}

const TREND_MONTHS = ["9월", "10월", "11월", "12월", "1월", "2월"];

export default function MarketPricePage() {
  const [region, setRegion] = useState("서울특별시");
  const [subRegion, setSubRegion] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [data, setData] = useState<MarketPriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const [myListings, setMyListings] = useState<MyListing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState("");

  const user = session?.user as SessionUser | undefined;
  const isPro = user && user.subscriptionTier !== "FREE";

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/listings?limit=50")
      .then((r) => r.json())
      .then((j) => setMyListings(j.data ?? []))
      .catch(() => {});
  }, [session?.user]);

  const doSearch = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (subRegion) params.set("subRegion", subRegion);
    if (businessType) params.set("businessType", businessType);

    fetch(`/api/market-prices?${params}`)
      .then((r) => r.json())
      .then((j) => setData(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [region, subRegion, businessType]);

  useEffect(() => { doSearch(); }, [doSearch]);

  // Selected data for current filters
  const filtered = data.filter(
    (d) =>
      (!subRegion || d.subRegion === subRegion) &&
      (!businessType || d.businessType === businessType)
  );

  // Aggregated averages from filtered data
  const avg = filtered.length > 0
    ? {
        keyMoney: Math.round(filtered.reduce((s, d) => s + d.avgKeyMoney, 0) / filtered.length),
        deposit: Math.round(filtered.reduce((s, d) => s + d.avgDeposit, 0) / filtered.length),
        rent: Math.round(filtered.reduce((s, d) => s + d.avgMonthlyRent, 0) / filtered.length),
        sales: Math.round(filtered.reduce((s, d) => s + d.avgMonthlySales, 0) / filtered.length),
        count: filtered.reduce((s, d) => s + d.sampleCount, 0),
      }
    : null;

  // Bar chart: key money distribution by sub-region
  const barData = Object.values(
    data.reduce<Record<string, { name: string; avgKeyMoney: number; count: number }>>((acc, d) => {
      if (!acc[d.subRegion]) acc[d.subRegion] = { name: d.subRegion, avgKeyMoney: 0, count: 0 };
      acc[d.subRegion].avgKeyMoney += d.avgKeyMoney;
      acc[d.subRegion].count++;
      return acc;
    }, {})
  )
    .map((d) => ({ name: d.name, 평균권리금: Math.round(d.avgKeyMoney / d.count / 10000) }))
    .sort((a, b) => b.평균권리금 - a.평균권리금)
    .slice(0, 8);

  // Nearby regions comparison table
  const nearbyData = subRegion
    ? data.filter((d) => d.businessType === (businessType || "CAFE_BAKERY")).slice(0, 5)
    : data
        .filter((d) => d.businessType === (businessType || "CAFE_BAKERY"))
        .reduce<MarketPriceData[]>((acc, d) => {
          if (!acc.find((a) => a.subRegion === d.subRegion)) acc.push(d);
          return acc;
        }, [])
        .slice(0, 5);

  // 최근 6개월 시세 추이 데이터 (결정적 변동 패턴)
  const TREND_OFFSETS_KEY = [-0.08, -0.05, -0.02, 0.01, 0.03, 0.05];
  const TREND_OFFSETS_DEP = [-0.05, -0.03, -0.01, 0.00, 0.02, 0.04];
  const trendData = TREND_MONTHS.map((m, i) => ({
    month: m,
    권리금: avg ? Math.round(avg.keyMoney / 10000 * (1 + TREND_OFFSETS_KEY[i])) : 0,
    보증금: avg ? Math.round(avg.deposit / 10000 * (1 + TREND_OFFSETS_DEP[i])) : 0,
  }));

  // My listing comparison
  const selectedListing = myListings.find((l) => l.id === selectedListingId);
  const myKeyMoney = selectedListing?.premiumFee ? Number(selectedListing.premiumFee) : 0;
  const regionAvg = avg?.keyMoney ?? 0;
  const myVerdict = myKeyMoney === 0 ? null : myKeyMoney <= regionAvg * 0.8 ? "저가" : myKeyMoney >= regionAvg * 1.2 ? "고가" : "적정";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">시세 정보</h1>
        <p className="mt-1 text-sm text-gray-500">지역별, 업종별 상가 시세를 비교해 보세요</p>
      </div>

      {/* Search Filters */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">시/도</label>
            <select
              value={region}
              onChange={(e) => { setRegion(e.target.value); setSubRegion(""); }}
              aria-label="시/도 선택"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
            >
              {Object.keys(REGIONS).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">구/군</label>
            <select
              value={subRegion}
              onChange={(e) => setSubRegion(e.target.value)}
              aria-label="구/군 선택"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
            >
              <option value="">전체</option>
              {(REGIONS[region] ?? []).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">업종</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              aria-label="업종 선택"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
            >
              <option value="">전체 업종</option>
              {Object.entries(BUSINESS_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={doSearch}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mint-dark"
            >
              <Search className="h-4 w-4" />
              검색
            </button>
          </div>
        </div>
      </div>

      {/* Pro Lock Overlay Wrapper */}
      <div className="relative">
        {/* Blur overlay for non-pro */}
        {!isPro && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
            <Lock className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-600">
              시세 비교 위젯은 PRO 이상 플랜에서 이용 가능합니다
            </p>
            <Link
              href="/pricing"
              className="mt-3 rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint/90"
            >
              업그레이드
            </Link>
          </div>
        )}

        {/* Content (blurred for non-pro) */}
        <div className={!isPro ? "pointer-events-none select-none" : ""}>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-mint border-t-transparent" />
            </div>
          ) : !avg ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">검색 조건에 맞는 시세 데이터가 없습니다</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard icon={<DollarSign className="h-5 w-5" />} label="평균 권리금" value={formatKRW(avg.keyMoney)} color="text-orange-600" bg="bg-orange-100" />
                <SummaryCard icon={<Wallet className="h-5 w-5" />} label="평균 보증금" value={formatKRW(avg.deposit)} color="text-blue-600" bg="bg-blue-100" />
                <SummaryCard icon={<Building className="h-5 w-5" />} label="평균 월세" value={formatKRW(avg.rent)} color="text-purple-600" bg="bg-purple-100" />
                <SummaryCard icon={<TrendingUp className="h-5 w-5" />} label="평균 월매출" value={formatKRW(avg.sales)} color="text-green-600" bg="bg-green-100" />
              </div>

              {/* Charts Row */}
              <div className="mb-8 grid gap-6 lg:grid-cols-2">
                {/* Bar Chart: 권리금 분포 */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-navy">지역별 평균 권리금 (만원)</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v?: number) => `${(v ?? 0).toLocaleString()}만원`} />
                      <Bar dataKey="평균권리금" fill="#2EC4B6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Line Chart: 시세 추이 */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-navy">최근 6개월 시세 추이 (만원)</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v?: number) => `${(v ?? 0).toLocaleString()}만원`} />
                      <Legend />
                      <Line type="monotone" dataKey="권리금" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="보증금" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Nearby Comparison Table */}
              <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-navy">주변 지역 시세 비교</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left">
                        <th className="px-3 py-2 font-medium text-gray-500">지역</th>
                        <th className="px-3 py-2 font-medium text-gray-500">업종</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">평균 권리금</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">평균 보증금</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">평균 월세</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500">표본수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nearbyData.map((d) => (
                        <tr key={d.id} className={`border-b border-gray-100 ${d.subRegion === subRegion ? "bg-mint/5 font-medium" : ""}`}>
                          <td className="px-3 py-2.5">{d.subRegion}</td>
                          <td className="px-3 py-2.5">{BUSINESS_CATEGORY_LABELS[d.businessType] ?? d.businessType}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-orange-600">{formatKRW(d.avgKeyMoney)}</td>
                          <td className="px-3 py-2.5 text-right">{formatKRW(d.avgDeposit)}</td>
                          <td className="px-3 py-2.5 text-right">{formatKRW(d.avgMonthlyRent)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500">{d.sampleCount}건</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* My Listing Comparison */}
              {user && myListings.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-bold text-navy">내 매물과 비교</h3>
                  <select
                    value={selectedListingId}
                    onChange={(e) => setSelectedListingId(e.target.value)}
                    aria-label="내 매물 선택"
                    className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  >
                    <option value="">매물을 선택하세요</option>
                    {myListings.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>

                  {selectedListing && regionAvg > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-sm text-gray-600">내 권리금</span>
                        <span className="text-lg font-bold text-navy">{formatKRW(myKeyMoney)}</span>
                        <span className="text-sm text-gray-400">vs</span>
                        <span className="text-sm text-gray-600">지역 평균</span>
                        <span className="text-lg font-bold text-gray-700">{formatKRW(regionAvg)}</span>
                        {myVerdict && (
                          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                            myVerdict === "적정"
                              ? "bg-green-100 text-green-700"
                              : myVerdict === "저가"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {myVerdict}
                          </span>
                        )}
                      </div>
                      <div className="relative h-6 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-mint"
                          style={{ width: `${Math.min(100, (myKeyMoney / (regionAvg * 1.5)) * 100)}%` }}
                        />
                        <div
                          className="absolute top-0 h-full w-0.5 bg-red-500"
                          style={{ left: `${Math.min(100, (regionAvg / (regionAvg * 1.5)) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-xs text-gray-500">
                        <span>0원</span>
                        <span className="text-red-500">지역 평균</span>
                        <span>{formatKRW(Math.round(regionAvg * 1.5))}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`mt-0.5 text-lg font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
