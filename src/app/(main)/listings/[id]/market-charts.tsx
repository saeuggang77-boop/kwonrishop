"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MarketBarChartProps {
  currentPremium: number;
  avgPremium: number;
  district: string;
}

const BAR_COLORS = ["#2EC4B6", "#0B3B57"];

export function MarketBarChart({
  currentPremium,
  avgPremium,
  district,
}: MarketBarChartProps) {
  const data = [
    { name: "이 매물", 권리금: Math.round(currentPremium / 10000) },
    { name: `${district} 평균`, 권리금: Math.round(avgPremium / 10000) },
  ];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}만`} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}만원`]}
        />
        <Bar dataKey="권리금" radius={[6, 6, 0, 0]} barSize={60}>
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={BAR_COLORS[index % BAR_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
