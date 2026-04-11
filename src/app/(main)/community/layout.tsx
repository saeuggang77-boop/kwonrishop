import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티 | 권리샵",
  description: "창업 정보, 상가 거래 팁, 업종 트렌드 등 유용한 정보를 공유하는 커뮤니티입니다.",
  keywords: ["커뮤니티", "자유게시판", "양도후기", "사이트이용문의", "창업노하우", "운영팁", "사장님커뮤니티", "점포후기"],
  alternates: {
    canonical: "https://www.kwonrishop.com/community",
  },
  openGraph: {
    title: "커뮤니티 | 권리샵",
    description: "창업 정보, 상가 거래 팁, 업종 트렌드 등 유용한 정보를 공유하는 커뮤니티입니다.",
    url: "https://www.kwonrishop.com/community",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
