import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 - 권리샵",
  description: "권리샵에 로그인하세요. 카카오, 네이버, 이메일로 간편하게 로그인할 수 있습니다.",
  openGraph: {
    title: "로그인 - 권리샵",
    description: "권리샵에 로그인하세요. 카카오, 네이버, 이메일로 간편 로그인.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
