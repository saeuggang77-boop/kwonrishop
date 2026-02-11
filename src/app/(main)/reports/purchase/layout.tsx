import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "리포트 구매 - 권리샵",
};

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
