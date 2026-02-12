import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "구독 관리 - 권리샵",
  description: "구독 플랜 관리 및 결제 정보를 확인하세요",
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
