import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문 - 권리샵",
  description: "권리샵 이용 시 자주 묻는 질문과 답변을 확인하세요. 회원가입, 매물등록, 결제, 거래 등 다양한 주제의 FAQ.",
  keywords: ["FAQ", "자주묻는질문", "고객센터", "질문답변", "이용문의", "매물등록문의", "결제문의"],
  openGraph: {
    title: "자주 묻는 질문 - 권리샵",
    description: "권리샵 이용 시 자주 묻는 질문과 답변을 확인하세요.",
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
