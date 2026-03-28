import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의하기 - 권리샵",
  description: "권리샵에 문의사항이 있으신가요? 이메일, 전화, 카카오톡으로 문의하실 수 있습니다.",
  openGraph: {
    title: "문의하기 - 권리샵",
    description: "권리샵에 문의사항이 있으신가요? 이메일, 전화, 카카오톡으로 문의하세요.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
