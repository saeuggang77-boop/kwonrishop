import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프랜차이즈 관리 - 권리샵",
};

export default function FranchisesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
