import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "전문가 상담 - 권리샵",
  description: "검증된 법률, 인테리어, 철거, 세무 전문가에게 상담받으세요",
};

export default function ExpertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
