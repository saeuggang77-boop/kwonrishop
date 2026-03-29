"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const TAGS = ["전체", "자유", "양도후기", "창업팁", "질문", "상권정보"];

interface Post {
  id: string;
  title: string;
  tag: string | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  author: { name: string | null };
  _count: { comments: number };
}

function CommunityContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(searchParams.get("tag") || "전체");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (activeTag !== "전체") params.set("tag", activeTag);

    fetch(`/api/community?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts || []);
        setTotal(data.pagination?.total || 0);
        setLoading(false);
      });
  }, [activeTag, page]);

  return (
    <div>
      {/* 네이비 헤더 */}
      <div className="bg-gradient-to-br from-navy-dark to-navy px-6 pb-10 pt-10 text-center">
        <h1 className="text-2xl font-extrabold text-white mb-2">커뮤니티</h1>
        <p className="text-sm text-white/60">사장님들의 창업 이야기와 노하우를 공유하세요</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 글쓰기 버튼 */}
        {session && (
          <div className="flex justify-end mb-4">
            <Link
              href="/community/write"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              글쓰기
            </Link>
          </div>
        )}

        {/* 태그 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => { setActiveTag(tag); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTag === tag
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          게시글이 없습니다
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="block py-4 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-start gap-3">
                {post.tag && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded shrink-0 mt-0.5">
                    {post.tag}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{post.author.name || "익명"}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                    <span>조회 {post.viewCount}</span>
                    <span>댓글 {post._count.comments}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(Math.ceil(total / 20), 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm ${
                page === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityContent />
    </Suspense>
  );
}
