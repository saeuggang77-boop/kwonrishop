import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로회원 구독 - 권리샵",
  description: "프로회원이 되어 모든 기능을 이용하세요",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
