"use client";

import { useState, useEffect } from "react";
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

const BAR_COLORS = ["#1B3A5C", "#2D5F8A"];

export function MarketBarChart({
  currentPremium,
  avgPremium,
  district,
}: MarketBarChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = [
    { name: "이 매물", 권리금: Math.round(currentPremium / 10000) },
    { name: `${district} 평균`, 권리금: Math.round(avgPremium / 10000) },
  ];

  if (!mounted) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-navy" />
      </div>
    );
  }

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
