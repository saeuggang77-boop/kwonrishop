"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const TAGS = ["전체", "공지", "자유게시판", "양도후기", "사이트이용문의"];

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
      {/* 히어로 */}
      <div className="bg-green-700 px-6 pb-16 pt-14 text-center relative overflow-hidden">
        <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-terra-500/10 blur-3xl" />
        <div className="relative">
          <div className="text-xs font-semibold text-terra-300 tracking-[0.2em] uppercase mb-3">Community</div>
          <h1 className="font-extrabold text-cream text-3xl md:text-5xl tracking-tight mb-3 leading-tight">
            사장님들의 <span className="font-light text-terra-300">이야기</span>
          </h1>
          <p className="text-sm text-cream/60">창업 노하우·양도후기·궁금한 점을 나누세요</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 글쓰기 버튼 */}
        {session && (
          <div className="flex justify-end mb-4">
            <Link
              href={`/community/write${activeTag !== "전체" ? `?tag=${encodeURIComponent(activeTag)}` : ""}`}
              className="px-5 py-2.5 bg-terra-500 text-cream text-sm rounded-full font-semibold hover:bg-terra-600 transition-colors shadow-[0_4px_16px_rgba(217,108,79,0.3)]"
            >
              + 글쓰기
            </Link>
          </div>
        )}

        {/* 태그 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => { setActiveTag(tag); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTag === tag
                ? "bg-green-700 text-cream shadow-[0_4px_12px_rgba(31,63,46,0.2)]"
                : "bg-cream border border-line text-ink hover:border-green-700"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-cream-elev rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted">
          게시글이 없습니다
        </div>
      ) : (
        <div className="bg-cream border border-line rounded-3xl overflow-hidden">
          {posts.map((post, idx) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className={`block px-5 py-4 hover:bg-cream-elev transition-colors ${
                idx !== 0 ? "border-t border-line" : ""
              } ${post.tag === "공지" ? "bg-terra-50/50" : ""}`}
            >
              <div className="flex items-start gap-3">
                {post.tag && (
                  <span className={`px-2.5 py-0.5 text-xs rounded-full shrink-0 mt-0.5 font-bold tracking-wide ${
                    post.tag === "공지"
                      ? "bg-terra-500 text-cream"
                      : post.tag === "사이트이용문의"
                        ? "bg-green-700 text-cream"
                        : post.tag === "양도후기"
                          ? "bg-terra-100 text-terra-700"
                          : post.tag === "창업상담"
                            ? "bg-green-100 text-green-700"
                            : "bg-cream-elev text-muted"
                  }`}>
                    {post.tag}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ink truncate">
                    {post.title}
                    {post.tag === "사이트이용문의" && <span className="ml-1.5 text-muted">🔒</span>}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                    <span className="font-medium">{post.author.name || "익명"}</span>
                    <span className="text-line-deep">·</span>
                    <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                    <span className="text-line-deep">·</span>
                    <span>조회 {post.viewCount}</span>
                    {post._count.comments > 0 && (
                      <>
                        <span className="text-line-deep">·</span>
                        <span className="text-terra-500 font-semibold">댓글 {post._count.comments}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.min(Math.ceil(total / 20), 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                page === p ? "bg-green-700 text-cream" : "bg-cream border border-line text-muted hover:border-green-700"
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
