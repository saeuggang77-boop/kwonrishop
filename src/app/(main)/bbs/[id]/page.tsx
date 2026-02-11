import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateKR } from "@/lib/utils/format";

export default async function BbsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const post = await prisma.boardPost.findUnique({
    where: { id },
  });

  if (!post || !post.isPublished) {
    notFound();
  }

  // Increment view count (fire-and-forget)
  prisma.boardPost
    .update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-[#2EC4B6]/10 px-3 py-1 text-sm font-medium text-[#2EC4B6]">
              {post.category}
            </span>
            <span className="text-sm text-gray-500">{formatDateKR(post.createdAt)}</span>
            <span className="text-sm text-gray-500">조회 {post.viewCount + 1}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-[#0B3B57]">{post.title}</h1>
        </div>

        {/* Thumbnail */}
        {post.thumbnailUrl && (
          <div className="mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              className="w-full rounded-lg object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="mt-6 whitespace-pre-wrap text-gray-700 leading-relaxed">
          {post.content}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/bbs"
            className="inline-block rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
          >
            목록으로
          </Link>
        </div>
      </div>
    </div>
  );
}
