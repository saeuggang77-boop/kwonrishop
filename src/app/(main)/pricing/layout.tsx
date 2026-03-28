import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제 - 권리샵",
  description: "매물 광고, 프랜차이즈, 협력업체 프리미엄 서비스 요금 안내. 목적에 맞는 요금제를 선택하세요. 프리미엄, VIP 패키지, 끌어올리기, 급매 태그 등 다양한 광고 상품.",
  keywords: ["요금제", "광고상품", "프리미엄", "VIP", "끌어올리기", "급매", "매물광고", "상단노출", "프랜차이즈요금"],
  openGraph: {
    title: "요금제 - 권리샵",
    description: "권리샵 프리미엄 서비스 요금 안내. 매물 광고, 프랜차이즈, 협력업체 서비스.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
