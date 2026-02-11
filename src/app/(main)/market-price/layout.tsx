import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "시세 정보 - 권리샵",
  description: "지역별 업종별 상가 시세를 확인하세요",
};

export default function MarketPriceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
