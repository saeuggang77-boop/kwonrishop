import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "창업 시뮬레이터 - 권리샵",
  description: "내 조건에 맞는 창업 수익성을 분석해보세요",
};

export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
