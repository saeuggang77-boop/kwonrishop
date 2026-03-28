import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매물 검색 - 권리샵",
  description: "전국 상가 매물을 검색하세요. 업종별, 지역별, 가격대별 필터로 원하는 매물을 쉽게 찾을 수 있습니다. 권리금, 보증금, 월세 정보를 한눈에 비교하세요.",
  keywords: ["상가매물", "점포매물", "상가검색", "권리금", "보증금", "월세", "업종별매물", "지역별매물", "상가매매", "점포매매"],
  openGraph: {
    title: "매물 검색 - 권리샵",
    description: "전국 상가 매물을 검색하세요. 업종별, 지역별, 가격대별 필터로 원하는 매물을 쉽게 찾을 수 있습니다.",
  },
};

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
