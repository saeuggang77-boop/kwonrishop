import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프랜차이즈 - 권리샵",
  description: "공정거래위원회 등록 프랜차이즈 브랜드 정보. 가맹비, 로열티, 매장수, 평균매출 등 공식 데이터를 확인하세요. 검증된 브랜드로 안전하게 창업하세요.",
  keywords: ["프랜차이즈", "가맹점", "창업", "가맹비", "로열티", "공정위", "프랜차이즈정보", "브랜드창업", "가맹점창업"],
  openGraph: {
    title: "프랜차이즈 - 권리샵",
    description: "공정거래위원회 등록 프랜차이즈 브랜드 정보를 확인하세요. 가맹비, 로열티, 평균매출 등 공식 데이터 기반.",
  },
};

export default function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
