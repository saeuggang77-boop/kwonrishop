import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티 - 권리샵",
  description: "상가 창업, 매매, 운영 노하우를 공유하는 커뮤니티. 경험담과 정보를 나눠보세요.",
  openGraph: {
    title: "커뮤니티 - 권리샵",
    description: "상가 창업, 매매, 운영 노하우를 공유하는 커뮤니티. 경험담과 정보를 나눠보세요.",
  },
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
