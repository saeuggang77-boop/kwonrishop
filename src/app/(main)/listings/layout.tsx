import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매물 검색 | 권리샵",
  description: "전국 상가 매물을 검색하세요. 업종, 지역, 보증금, 권리금으로 필터링하여 원하는 매물을 찾을 수 있습니다.",
  keywords: ["상가매물", "점포매물", "상가검색", "권리금", "보증금", "월세", "업종별매물", "지역별매물", "상가매매", "점포매매"],
  alternates: {
    canonical: "https://www.kwonrishop.com/listings",
  },
  openGraph: {
    title: "매물 검색 | 권리샵",
    description: "전국 상가 매물을 검색하세요. 업종, 지역, 보증금, 권리금으로 필터링하여 원하는 매물을 찾을 수 있습니다.",
    url: "https://www.kwonrishop.com/listings",
  },
};

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
