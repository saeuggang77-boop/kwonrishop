"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

const BASE_TAGS = ["자유게시판", "양도후기", "사이트이용문의"];

export default function CommunityEditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("자유게시판");
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";
  const TAGS = isAdmin ? ["공지", ...BASE_TAGS] : BASE_TAGS;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/community/${postId}/edit`);
      return;
    }
    if (status === "authenticated") {
      fetch(`/api/community/${postId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.author?.id !== session?.user?.id) {
            setError("본인이 작성한 글만 수정할 수 있습니다.");
            setFetching(false);
            return;
          }
          setTitle(data.title || "");
          setContent(data.content || "");
          // 기존 태그 호환: 삭제된 태그는 자유게시판으로 매핑
          const oldTag = data.tag || "자유게시판";
          const validTags = ["공지", "자유게시판", "양도후기", "사이트이용문의"];
          setTag(validTags.includes(oldTag) ? oldTag : "자유게시판");
          setFetching(false);
        })
        .catch(() => {
          setError("게시글을 불러올 수 없습니다.");
          setFetching(false);
        });
    }
  }, [status, router, postId, session?.user?.id]);

  if (status === "loading" || fetching) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse">로딩 중...</div>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          돌아가기
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/community/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, tag }),
    });

    const data = await res.json();
    if (res.ok) {
      router.push(`/community/${postId}`);
    } else {
      setError(data.error || "수정에 실패했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">글 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tag === t
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg text-lg outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "수정 중..." : "수정"}
          </button>
        </div>
      </form>
    </div>
  );
}
