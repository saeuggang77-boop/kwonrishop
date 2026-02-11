import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "게시판 - 권리샵",
  description: "공지사항과 창업 정보를 확인하세요",
};

export default function BbsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
