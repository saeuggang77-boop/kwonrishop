import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프랜차이즈 브랜드 | 권리샵",
  description: "15,000개+ 프랜차이즈 브랜드 정보를 비교하세요. 가맹비, 매출, 가맹점 수 등 공정위 공시 데이터 기반 분석.",
  keywords: ["프랜차이즈", "가맹점", "창업", "가맹비", "로열티", "공정위", "프랜차이즈정보", "브랜드창업", "가맹점창업"],
  alternates: {
    canonical: "https://www.kwonrishop.com/franchise",
  },
  openGraph: {
    title: "프랜차이즈 브랜드 | 권리샵",
    description: "15,000개+ 프랜차이즈 브랜드 정보를 비교하세요. 가맹비, 매출, 가맹점 수 등 공정위 공시 데이터 기반 분석.",
    url: "https://www.kwonrishop.com/franchise",
  },
};

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
