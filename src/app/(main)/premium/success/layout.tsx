import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "결제 완료 - 권리샵",
};

export default function SuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
