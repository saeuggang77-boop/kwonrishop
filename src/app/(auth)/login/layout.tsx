import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 - 권리샵",
  description: "카카오, 네이버로 간편하게 로그인하세요.",
  openGraph: {
    title: "로그인 - 권리샵",
    description: "카카오, 네이버로 간편하게 로그인하세요.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
