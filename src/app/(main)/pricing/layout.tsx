import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "광고 상품 - 권리샵",
  description: "매물 노출을 높이는 광고 상품. 상단 고정, 끌어올리기, VIP 패키지 등.",
  openGraph: {
    title: "광고 상품 - 권리샵",
    description: "매물 노출을 높이는 광고 상품. 상단 고정, 끌어올리기, VIP 패키지 등.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
