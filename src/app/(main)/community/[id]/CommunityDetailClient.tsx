"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Breadcrumb from "@/components/ui/Breadcrumb";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  replies?: Comment[];
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  tag: string | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  comments: Comment[];
  isRestricted?: boolean;
}

export default function CommunityDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/community/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/community"); return; }
        setPost(data);
        setLoading(false);
      });
  }, [params.id, router]);

  async function deleteComment(commentId: string) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/community/${params.id}/comments?commentId=${commentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      const data = await fetch(`/api/community/${params.id}`).then((r) => r.json());
      setPost(data);
    }
  }

  async function submitComment(parentId?: string) {
    const content = parentId ? replyContent : comment;
    if (!content.trim()) return;

    const res = await fetch(`/api/community/${params.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    });

    if (res.ok) {
      // 새로고침으로 댓글 반영
      const data = await fetch(`/api/community/${params.id}`).then((r) => r.json());
      setPost(data);
      setComment("");
      setReplyContent("");
      setReplyTo(null);
    }
  }

  if (loading || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumb
        items={[
          { label: "커뮤니티", href: "/community" },
          { label: post.title }
        ]}
      />

      {/* 헤더 */}
      <div className="mb-6">
        {post.tag && (
          <span className={`px-2 py-0.5 text-xs rounded mb-2 inline-block font-medium ${
            post.tag === "공지"
              ? "bg-green-100 text-green-700"
              : post.tag === "사이트이용문의"
                ? "bg-green-100 text-green-700"
                : post.tag === "양도후기"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
          }`}>
            {post.tag === "공지" && "📌 "}{post.tag}
            {post.tag === "사이트이용문의" && " 🔒"}
          </span>
        )}
        <h1 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h1>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>{post.author.name || "익명"}</span>
            <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
            <span>조회 {post.viewCount}</span>
          </div>
          {session?.user?.id === post.author.id && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/community/${params.id}/edit`)}
                className="text-sm text-gray-500 hover:text-green-700"
              >
                수정
              </button>
              <button
                onClick={async () => {
                  if (!confirm("정말 삭제하시겠습니까?")) return;
                  const res = await fetch(`/api/community/${params.id}`, { method: "DELETE" });
                  if (res.ok) router.push("/community");
                }}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 본문 */}
      {post.isRestricted ? (
        <div className="mb-8 py-12 text-center bg-gray-50 rounded-xl border border-gray-200">
          <span className="text-3xl mb-3 block">&#128274;</span>
          <p className="text-gray-500 font-medium">비공개 글입니다</p>
          <p className="text-sm text-gray-400 mt-1">작성자와 관리자만 내용을 볼 수 있습니다</p>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none mb-8 whitespace-pre-wrap text-gray-700 leading-relaxed">
          {post.content}
        </div>
      )}

      {/* 댓글 */}
      {!post.isRestricted && <div className="border-t pt-6">
        <h2 className="font-bold text-gray-900 mb-4">
          댓글 {post.comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)}
        </h2>

        {/* 댓글 입력 */}
        {session ? (
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="댓글을 입력하세요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              maxLength={500}
              className="flex-1 px-3 md:px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-700"
            />
            <button
              onClick={() => submitComment()}
              className="px-3 md:px-4 py-2.5 bg-green-700 text-white text-sm rounded-lg font-medium hover:bg-green-600 active:bg-green-800 min-w-[60px]"
            >
              등록
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-6">댓글을 작성하려면 로그인이 필요합니다</p>
        )}

        {/* 댓글 목록 */}
        <div className="space-y-4">
          {post.comments.map((c) => (
            <div key={c.id}>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                  {c.author.name?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">{c.author.name || "익명"}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{c.content}</p>
                  {session && (
                    <div className="flex gap-3 mt-1">
                      <button
                        onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                        className="text-xs text-gray-400 hover:text-green-500"
                      >
                        답글
                      </button>
                      {session.user?.id === c.author.id && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  )}

                  {/* 답글 입력 */}
                  {replyTo === c.id && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="답글을 입력하세요"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submitComment(c.id)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-700"
                        autoFocus
                      />
                      <button
                        onClick={() => submitComment(c.id)}
                        className="px-3 py-2 bg-green-700 text-white text-xs rounded-lg"
                      >
                        등록
                      </button>
                    </div>
                  )}

                  {/* 대댓글 */}
                  {c.replies?.map((r) => (
                    <div key={r.id} className="flex gap-2 md:gap-3 mt-3 ml-2 md:ml-4 pl-2 md:pl-3 border-l-2 border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0">
                        {r.author.name?.[0] || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-900 truncate">{r.author.name || "익명"}</span>
                          <span className="text-xs text-gray-400 shrink-0">
                            {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5 break-words">{r.content}</p>
                        {session?.user?.id === r.author.id && (
                          <button
                            onClick={() => deleteComment(r.id)}
                            className="text-xs text-gray-400 mt-1 hover:text-red-500"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}
