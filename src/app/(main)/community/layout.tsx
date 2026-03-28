import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티 - 권리샵",
  description: "창업 팁, 양도 후기, 상권 정보 등 사장님들의 생생한 이야기를 나눠보세요. 상가 창업, 매매, 운영 노하우를 공유하는 커뮤니티.",
  keywords: ["커뮤니티", "창업팁", "양도후기", "상권정보", "창업노하우", "운영팁", "사장님커뮤니티", "점포후기"],
  openGraph: {
    title: "커뮤니티 - 권리샵",
    description: "창업 팁, 양도 후기, 상권 정보 등 사장님들의 이야기. 상가 창업, 매매, 운영 노하우 공유.",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
