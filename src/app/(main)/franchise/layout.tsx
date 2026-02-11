import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프랜차이즈 정보 - 권리샵",
  description: "프랜차이즈 브랜드 정보와 창업 비용을 확인하세요",
};

export default function FranchiseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
