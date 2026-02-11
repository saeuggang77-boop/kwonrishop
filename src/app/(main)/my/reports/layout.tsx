import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 리포트 - 권리샵",
  description: "구매한 분석 리포트를 확인하세요",
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
