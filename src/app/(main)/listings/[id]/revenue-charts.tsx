"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function generateMonthlyData(baseRevenue: number) {
  const months = ["9월", "10월", "11월", "12월", "1월", "2월"];
  const base = baseRevenue / 10000; // Convert to 만원
  const seed = (baseRevenue * 7) % 1000;

  return months.map((month, i) => {
    // Vary ±15% around base, but keep in realistic range
    const variation = 1 + (((seed * (i + 1) * 37) % 300) - 150) / 1000;
    const value = Math.round(base * variation);
    return { month, 매출: value };
  });
}

export function RevenueBarChart({
  monthlyRevenue,
}: {
  monthlyRevenue: number;
}) {
  const data = generateMonthlyData(monthlyRevenue);
  const values = data.map((d) => d.매출);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  // Y-axis starts near minimum so bars have visible height differences
  const yMin = Math.floor(minVal * 0.7 / 100) * 100;
  const yMax = Math.ceil(maxVal * 1.1 / 100) * 100;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(v) => `${v}만`}
          domain={[yMin, yMax]}
        />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}만원`, "월매출"]}
        />
        <Bar dataKey="매출" radius={[6, 6, 0, 0]} barSize={40} fill="#1B3A5C" />
      </BarChart>
    </ResponsiveContainer>
  );
}

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
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
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
  );
}
