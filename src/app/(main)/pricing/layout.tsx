import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제 안내 - 권리샵",
  description: "권리샵 구독 요금제를 확인하고 적합한 플랜을 선택하세요",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
