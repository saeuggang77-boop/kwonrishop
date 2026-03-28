import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "집기장터 - 권리샵",
  description: "사업자 인증된 판매자의 영업용 집기를 사고파세요. 주방기기, 냉장고, 테이블 등 중고 영업 장비 전문 마켓.",
  keywords: ["집기장터", "영업용 집기", "주방기기", "업소용 냉장고", "중고 영업 장비", "점포 집기", "상가 집기"],
  openGraph: {
    title: "집기장터 - 권리샵",
    description: "사업자 인증된 판매자의 영업용 집기를 사고파세요. 주방기기, 냉장고, 테이블 등 중고 영업 장비 전문 마켓.",
  },
};

export default function EquipmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
