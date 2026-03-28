import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용가이드 - 권리샵",
  description: "권리샵 이용방법을 단계별로 안내합니다. 매수자, 매도자, 프랜차이즈, 협력업체별 가이드를 확인하세요.",
  keywords: ["이용가이드", "사용방법", "매물등록방법", "거래방법", "회원가입", "매수가이드", "매도가이드"],
  openGraph: {
    title: "이용가이드 - 권리샵",
    description: "권리샵 이용방법을 단계별로 안내합니다. 매수자, 매도자, 프랜차이즈, 협력업체별 가이드.",
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
