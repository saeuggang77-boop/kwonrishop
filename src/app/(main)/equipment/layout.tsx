import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "집기장터 | 권리샵",
  description: "중고 업소용 주방기기, 냉장고, 테이블, POS 등 집기를 저렴하게 거래하세요.",
  keywords: ["집기장터", "영업용 집기", "주방기기", "업소용 냉장고", "중고 영업 장비", "점포 집기", "상가 집기"],
  alternates: {
    canonical: "https://www.kwonrishop.com/equipment",
  },
  openGraph: {
    title: "집기장터 | 권리샵",
    description: "중고 업소용 주방기기, 냉장고, 테이블, POS 등 집기를 저렴하게 거래하세요.",
    url: "https://www.kwonrishop.com/equipment",
  },
};

export default function EquipmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
