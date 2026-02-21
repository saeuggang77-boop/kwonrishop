"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });

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
