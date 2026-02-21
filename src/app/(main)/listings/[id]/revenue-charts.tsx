"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });

interface CostPieProps {
  rent: number;          // 임대료 (월세+관리비) in raw won
  laborCost: number;     // 인건비
  materialCost: number;  // 재료비/원가
  otherCost: number;     // 기타비용
  profit: number;        // 순수익
}

/** 비용은 채도 낮은 색, 순수익은 강조색 */
const SLICE_COLORS: Record<string, string> = {
  "임대료": "#94A3B8",   // slate-400
  "인건비": "#C4B5A0",   // warm muted
  "재료비": "#A3BFAB",   // sage muted
  "기타비용": "#B8B0C8", // lavender muted
  "순수익": "#2EC4B6",   // brand accent
};

const RADIAN = Math.PI / 180;

/** 각 조각 위에 항목명 + 퍼센트 직접 표시 */
function renderSliceLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, name, percent } = props;
  if (!midAngle && midAngle !== 0) return null;
  if ((percent ?? 0) < 0.06) return null; // 6% 미만 슬라이스는 라벨 생략
  const isProfit = name === "순수익";
  const radius = (outerRadius ?? 78) + (isProfit ? 24 : 20);
  const x = (cx ?? 0) + radius * Math.cos(-midAngle * RADIAN);
  const y = (cy ?? 0) + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      textAnchor={x > (cx ?? 0) ? "start" : "end"}
      dominantBaseline="central"
      fontSize={isProfit ? 12 : 11}
      fontWeight={isProfit ? 700 : 500}
      fill={isProfit ? "#2EC4B6" : "#6B7280"}
    >
      {name} {((percent ?? 0) * 100).toFixed(0)}%
    </text>
  );
}

export function CostPieChart({
  rent,
  laborCost,
  materialCost,
  otherCost,
  profit,
}: CostPieProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = [
    { name: "임대료", value: Math.round(rent / 10000) },
    { name: "인건비", value: Math.round(laborCost / 10000) },
    { name: "재료비", value: Math.round(materialCost / 10000) },
    { name: "기타비용", value: Math.round(otherCost / 10000) },
    { name: "순수익", value: Math.round(profit / 10000) },
  ].filter((d) => d.value > 0);

  const profitMan = Math.round(profit / 10000);

  if (!mounted) {
    return (
      <div className="flex h-[220px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-navy" />
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={78}
            paddingAngle={2}
            dataKey="value"
            label={renderSliceLabel}
            labelLine={false}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={SLICE_COLORS[entry.name] ?? "#CBD5E1"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${Number(value ?? 0).toLocaleString()}만원`]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* 도넛 가운데: 순수익 강조 표시 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] font-medium text-gray-400">순수익</p>
          <p className="text-lg font-bold text-[#2EC4B6]">
            {profitMan.toLocaleString()}만원
          </p>
        </div>
      </div>
    </div>
  );
}

export function RevenueGradeMessage({ grade, monthlyRevenue, monthlyProfit }: {
  grade: string | null;
  monthlyRevenue: number;
  monthlyProfit: number;
}) {
  if (grade === "A") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-sm font-medium text-green-800">
          홈택스 연동 매출 데이터가 준비되면 차트가 표시됩니다
        </p>
      </div>
    );
  }
  if (grade === "B") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm font-medium text-amber-800">
          매출 증빙자료가 제출되었습니다
        </p>
      </div>
    );
  }
  // C, D, null
  const formatValue = (v: number) => v > 0 ? `${Math.round(v / 10000).toLocaleString()}만원` : "-";
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-xs text-gray-500">월매출</p>
        <p className="mt-1 text-lg font-bold text-gray-800">{formatValue(monthlyRevenue)}</p>
      </div>
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-xs text-gray-500">월수익</p>
        <p className="mt-1 text-lg font-bold text-gray-800">{formatValue(monthlyProfit)}</p>
      </div>
    </div>
  );
}
