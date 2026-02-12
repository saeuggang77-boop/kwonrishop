import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 권리진단서 - 권리샵",
  description: "구매한 권리진단서를 확인하세요",
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
