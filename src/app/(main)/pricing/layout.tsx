import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 요금 안내 - 권리샵",
  description: "권리샵 서비스 요금을 확인하고 적합한 플랜을 선택하세요",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
