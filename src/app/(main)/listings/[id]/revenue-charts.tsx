"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface RevenueChartsProps {
  monthlyRevenue: number;
  monthlyProfit: number;
}

function generateTrendData(baseRevenue: number, baseProfit: number) {
  const months = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월",
  ];
  const seed = (baseRevenue * 7 + baseProfit * 13) % 1000;

  return months.map((month, i) => {
    const rv = 1 + (((seed * (i + 1) * 37) % 200) - 100) / 1000;
    const pv = 1 + (((seed * (i + 1) * 53) % 200) - 100) / 1000;
    return {
      month,
      매출: Math.round((baseRevenue * rv) / 10000),
      순이익: Math.round((baseProfit * pv) / 10000),
    };
  });
}

export function RevenueLineChart({
  monthlyRevenue,
  monthlyProfit,
}: RevenueChartsProps) {
  const data = generateTrendData(monthlyRevenue, monthlyProfit);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}만`} />
        <Tooltip
          formatter={(value) => [`${Number(value ?? 0).toLocaleString()}만원`]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="매출"
          stroke="#2EC4B6"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="순이익"
          stroke="#0B3B57"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface CostPieProps {
  monthlyRent: number;
  managementFee: number;
  monthlyRevenue: number;
  monthlyProfit: number;
}

const PIE_COLORS = ["#FF6B6B", "#FFA94D", "#868E96", "#2EC4B6"];

export function CostPieChart({
  monthlyRent,
  managementFee,
  monthlyRevenue,
  monthlyProfit,
}: CostPieProps) {
  const rent = monthlyRent / 10000;
  const mgmt = managementFee / 10000;
  const totalCost = (monthlyRevenue - monthlyProfit) / 10000;
  const otherCost = Math.max(0, totalCost - rent - mgmt);

  const data = [
    { name: "월세", value: rent },
    { name: "관리비", value: mgmt },
    { name: "기타비용", value: otherCost },
    { name: "순이익", value: monthlyProfit / 10000 },
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
