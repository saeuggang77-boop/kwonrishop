"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Store,
  Calendar,
  Calculator,
  Building2,
  AlertCircle,
} from "lucide-react";
import { formatKRW } from "@/lib/utils/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FranchiseDetail {
  id: string;
  brandName: string;
  category: string;
  subcategory: string;
  logoUrl: string | null;
  monthlyAvgSales: string | null;
  startupCost: string | null;
  storeCount: number | null;
  dataYear: number | null;
  description: string | null;
  isPromoting: boolean;
}

/* ------------------------------------------------------------------ */
/*  Avatar colors                                                      */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS: Record<string, string> = {
  커피: "#6F4E37",
  치킨: "#EA580C",
  한식: "#B91C1C",
  양식: "#BE123C",
  피자: "#CA8A04",
  분식: "#DB2777",
  패스트푸드: "#F97316",
  도시락: "#DC2626",
  편의점: "#1D4ED8",
  화장품: "#EC4899",
  세탁: "#7C3AED",
};

function getAvatarBg(subcategory: string): string {
  return AVATAR_COLORS[subcategory] ?? "#1B3A5C";
}

/* ------------------------------------------------------------------ */
/*  Dummy detail data (정보공개서 기준)                                  */
/* ------------------------------------------------------------------ */

function getDummyDetails(brand: FranchiseDetail) {
  const cost = brand.startupCost ? Number(brand.startupCost) : 80_000_000;
  return {
    franchiseFee: Math.round(cost * 0.12),
    educationFee: Math.round(cost * 0.05),
    interiorCost: Math.round(cost * 0.45),
    deposit: Math.round(cost * 0.15),
    equipmentCost: Math.round(cost * 0.18),
    otherCost: Math.round(cost * 0.05),
    contractYears: 2,
    royaltyMonthly: brand.subcategory === "편의점" ? 0 : Math.round(cost * 0.003),
  };
}

function getStoreHistory(current: number | null) {
  const base = current ?? 200;
  return [
    { year: "2023", 가맹점: Math.round(base * 0.82), 직영점: Math.round(base * 0.04) },
    { year: "2024", 가맹점: Math.round(base * 0.91), 직영점: Math.round(base * 0.045) },
    { year: "2025", 가맹점: Math.round(base * 0.97), 직영점: Math.round(base * 0.05) },
  ];
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FranchiseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [brand, setBrand] = useState<FranchiseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/franchise/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((j) => setBrand(j.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-gray-300" />
        <p className="mt-4 text-lg font-medium text-gray-500">
          프랜차이즈 정보를 찾을 수 없습니다
        </p>
        <Link
          href="/franchise"
          className="mt-4 inline-block rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-navy/90"
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const details = getDummyDetails(brand);
  const storeHistory = getStoreHistory(brand.storeCount);
  const directStores = brand.storeCount ? Math.round(brand.storeCount * 0.05) : 5;
  const franchiseStores = (brand.storeCount ?? 200) - directStores;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        프랜차이즈 목록
      </button>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center gap-5">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white"
          style={{ backgroundColor: getAvatarBg(brand.subcategory) }}
        >
          {brand.brandName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy">{brand.brandName}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {brand.category}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {brand.subcategory}
            </span>
            {brand.storeCount && (
              <span className="text-sm text-gray-500">
                가맹 {franchiseStores}개 · 직영 {directStores}개
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="월 평균 매출"
          value={brand.monthlyAvgSales ? formatKRW(Number(brand.monthlyAvgSales)) : "비공개"}
          color="text-green-600"
          bg="bg-green-100"
        />
        <InfoCard
          icon={<DollarSign className="h-5 w-5" />}
          label="창업비용"
          value={brand.startupCost ? formatKRW(Number(brand.startupCost)) : "비공개"}
          color="text-orange-600"
          bg="bg-orange-100"
        />
        <InfoCard
          icon={<Store className="h-5 w-5" />}
          label="총 가맹점 수"
          value={brand.storeCount ? `${brand.storeCount.toLocaleString()}개` : "비공개"}
          color="text-blue-600"
          bg="bg-blue-100"
        />
        <InfoCard
          icon={<Calendar className="h-5 w-5" />}
          label="데이터 기준"
          value={brand.dataYear ? `${brand.dataYear}년` : "비공개"}
          color="text-purple-600"
          bg="bg-purple-100"
        />
      </div>

      {/* ── 상세 비용 테이블 ────────────────────────────────────── */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-navy">창업비용 상세 내역</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="px-3 py-2.5 font-medium text-gray-500">항목</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-500">금액</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "가맹비", value: details.franchiseFee },
                { label: "교육비", value: details.educationFee },
                { label: "인테리어 비용", value: details.interiorCost },
                { label: "보증금", value: details.deposit },
                { label: "설비/장비", value: details.equipmentCost },
                { label: "기타 초기비용", value: details.otherCost },
              ].map((row) => (
                <tr key={row.label} className="border-b border-gray-100">
                  <td className="px-3 py-2.5 text-gray-700">{row.label}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-navy">
                    {formatKRW(row.value)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-3 py-3 text-navy">합계</td>
                <td className="px-3 py-3 text-right text-navy">
                  {brand.startupCost ? formatKRW(Number(brand.startupCost)) : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-xs text-gray-500">계약 기간</span>
            <p className="mt-0.5 text-sm font-bold text-navy">{details.contractYears}년</p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-xs text-gray-500">월 로열티</span>
            <p className="mt-0.5 text-sm font-bold text-navy">
              {details.royaltyMonthly > 0 ? formatKRW(details.royaltyMonthly) : "없음"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 가맹점 현황 차트 ────────────────────────────────────── */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-navy">최근 3년 가맹점 추이</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={storeHistory} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar
              dataKey="가맹점"
              fill="#1B3A5C"
              radius={[4, 4, 0, 0]}
              label={{ position: "top", fontSize: 11, fontWeight: 700, fill: "#1B3A5C" }}
            />
            <Bar
              dataKey="직영점"
              fill="#93C5FD"
              radius={[4, 4, 0, 0]}
              label={{ position: "top", fontSize: 11, fontWeight: 700, fill: "#6B7280" }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 시뮬레이션 CTA ──────────────────────────────────────── */}
      <div className="mb-8 rounded-2xl border border-navy/20 bg-navy/5 p-6 text-center">
        <Calculator className="mx-auto h-10 w-10 text-navy" />
        <h3 className="mt-3 text-lg font-bold text-navy">
          {brand.brandName}(으)로 창업하면 수익이 얼마나 될까?
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          창업 시뮬레이터에서 예상 수익을 직접 분석해 보세요
        </p>
        <Link
          href={`/simulator?brand=${encodeURIComponent(brand.brandName)}`}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy/90"
        >
          <Calculator className="h-4 w-4" />
          이 브랜드로 창업 시뮬레이션
        </Link>
      </div>

      {/* ── 본사 미가입 문구 ────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <Building2 className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-3 text-sm text-gray-500">
          정보공개서 기준 데이터입니다. 실제와 다를 수 있습니다.
        </p>
        <p className="mt-2 text-sm font-medium text-navy">
          프랜차이즈 본사 관계자이신가요?
        </p>
        <p className="mt-1 text-xs text-gray-400">
          본사 인증을 하시면 브랜드 페이지를 직접 관리하고 가맹 문의를 받을 수 있습니다.
        </p>
        <Link
          href="/register?role=franchise"
          className="mt-4 inline-block rounded-lg border border-navy px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
        >
          본사 가입하기
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  InfoCard                                                           */
/* ------------------------------------------------------------------ */

function InfoCard({
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
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className={`mt-0.5 truncate text-lg font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
