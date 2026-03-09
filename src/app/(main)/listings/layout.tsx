import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "매물 목록 - 권리샵",
  description: "전국 상가 매물을 한눈에 비교하세요. 권리금, 보증금, 월세 정보와 함께 내 조건에 맞는 매물을 찾아보세요.",
  openGraph: {
    title: "매물 목록 - 권리샵",
    description: "전국 상가 매물을 한눈에 비교하세요. 권리금, 보증금, 월세 정보와 함께 내 조건에 맞는 매물을 찾아보세요.",
  },
};

export default function ListingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
