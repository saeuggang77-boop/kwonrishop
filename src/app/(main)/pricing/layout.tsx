import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제 | 권리샵",
  description: "매물 광고, 프랜차이즈 광고, 협력업체 광고 등 권리샵 유료 상품 요금 안내.",
  keywords: ["요금제", "광고상품", "프리미엄", "VIP", "끌어올리기", "급매", "매물광고", "상단노출", "프랜차이즈요금"],
  alternates: {
    canonical: "https://www.kwonrishop.com/pricing",
  },
  openGraph: {
    title: "요금제 | 권리샵",
    description: "매물 광고, 프랜차이즈 광고, 협력업체 광고 등 권리샵 유료 상품 요금 안내.",
    url: "https://www.kwonrishop.com/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
