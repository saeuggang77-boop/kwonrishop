import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티 - 권리샵",
  description: "양도 후기, 자유게시판, 사이트 이용문의 등 사장님들의 생생한 이야기를 나눠보세요. 상가 창업, 매매, 운영 노하우를 공유하는 커뮤니티.",
  keywords: ["커뮤니티", "자유게시판", "양도후기", "사이트이용문의", "창업노하우", "운영팁", "사장님커뮤니티", "점포후기"],
  openGraph: {
    title: "커뮤니티 - 권리샵",
    description: "양도 후기, 자유게시판, 사이트 이용문의 등 사장님들의 이야기. 상가 창업, 매매, 운영 노하우 공유.",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
