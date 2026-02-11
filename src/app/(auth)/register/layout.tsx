import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 - 권리샵",
  description: "권리샵 회원가입",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
