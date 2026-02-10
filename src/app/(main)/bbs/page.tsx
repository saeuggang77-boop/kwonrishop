"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";

interface BoardPostItem {
  id: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: string;
}

export default function BbsPage() {
  const [posts, setPosts] = useState<BoardPostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bbs")
      .then((res) => res.json())
      .then((json) => setPosts(json.data))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">창업정보</h1>
      <p className="mt-1 text-sm text-gray-500">창업에 도움이 되는 정보와 뉴스를 확인하세요</p>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">등록된 게시글이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition">
                <span className="inline-block rounded-full bg-mint/10 px-3 py-1 text-xs font-medium text-mint">
                  {post.category}
                </span>
                <h3 className="mt-3 text-lg font-bold text-navy line-clamp-2">{post.title}</h3>
                <p className="mt-2 text-sm text-gray-500 line-clamp-3">{post.content}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                  <span>조회 {post.viewCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
