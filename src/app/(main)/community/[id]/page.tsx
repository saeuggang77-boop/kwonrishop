import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CommunityDetailClient from "./CommunityDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: { title: true, content: true, tag: true, author: { select: { name: true } } },
  });

  if (!post) {
    return { title: "게시글을 찾을 수 없습니다 - 권리샵" };
  }

  const description = post.tag === "사이트이용문의"
    ? "비공개 글입니다. 작성자와 관리자만 내용을 볼 수 있습니다."
    : post.content.slice(0, 160).replace(/\n/g, " ");

  return {
    title: `${post.title} - 커뮤니티 - 권리샵`,
    description,
    openGraph: {
      title: `${post.title} - 권리샵 커뮤니티`,
      description,
      type: "article",
      siteName: "권리샵",
    },
  };
}

export default function CommunityDetailPage() {
  return <CommunityDetailClient />;
}
