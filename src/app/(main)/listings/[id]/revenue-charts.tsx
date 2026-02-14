"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

interface CostPieProps {
  rent: number;          // 임대료 (월세+관리비) in raw won
  laborCost: number;     // 인건비
  materialCost: number;  // 재료비/원가
  otherCost: number;     // 기타비용
  profit: number;        // 순수익
}

const PIE_COLORS = ["#FF6B6B", "#FFA94D", "#51CF66", "#868E96", "#1B3A5C"];

export function CostPieChart({
  rent,
  laborCost,
  materialCost,
  otherCost,
  profit,
}: CostPieProps) {
  const data = [
    { name: "임대료", value: Math.round(rent / 10000) },
    { name: "인건비", value: Math.round(laborCost / 10000) },
    { name: "재료비", value: Math.round(materialCost / 10000) },
    { name: "기타비용", value: Math.round(otherCost / 10000) },
    { name: "순수익", value: Math.round(profit / 10000) },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${Number(value ?? 0).toLocaleString()}만원`]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => {
          const total = data.reduce((s, d) => s + d.value, 0);
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
          return (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
              <span className="text-gray-600">{item.name}</span>
              <span className="font-medium text-gray-800">{pct}%</span>
              <span className="text-xs text-gray-400">({item.value.toLocaleString()}만원)</span>
            </div>
          );
        })}
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
