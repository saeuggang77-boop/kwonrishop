import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "게시글 관리 - 권리샵",
};

export default function PostsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
