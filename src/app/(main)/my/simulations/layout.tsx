import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 시뮬레이션 - 권리샵",
  description: "저장된 창업 시뮬레이션을 확인하세요",
};

export default function SimulationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
