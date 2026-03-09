import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프랜차이즈 - 권리샵",
  description: "검증된 프랜차이즈 브랜드 정보를 확인하세요. 창업비용, 매출, 가맹점 수 등 공정위 등록 데이터 기반.",
  openGraph: {
    title: "프랜차이즈 - 권리샵",
    description: "검증된 프랜차이즈 브랜드 정보를 확인하세요. 창업비용, 매출, 가맹점 수 등 공정위 등록 데이터 기반.",
  },
};

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
