import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "내 상담 내역 - 권리샵",
  description: "전문가 상담 신청 내역을 확인하세요",
};

export default function MyConsultationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
