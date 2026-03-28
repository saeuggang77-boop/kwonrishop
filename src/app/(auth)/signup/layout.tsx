import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 - 권리샵",
  description: "권리샵에 가입하세요. 중개수수료 없이 상가를 직거래할 수 있습니다. 카카오, 네이버, 이메일로 간편 가입.",
  openGraph: {
    title: "회원가입 - 권리샵",
    description: "권리샵에 가입하세요. 중개수수료 없이 상가를 직거래할 수 있습니다.",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
