"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";
import { BBS_CATEGORIES } from "@/lib/utils/constants";

interface BoardPostItem {
  id: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function BbsPage() {
  const [posts, setPosts] = useState<BoardPostItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = (category: string, page: number) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("page", page.toString());
    params.set("limit", "10");

    fetch(`/api/bbs?${params}`)
      .then((res) => res.json())
      .then((json) => {
        setPosts(json.data || []);
        setMeta(json.meta || { total: 0, page: 1, limit: 10, totalPages: 0 });
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts(activeCategory, 1);
  }, [activeCategory]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const handlePageChange = (page: number) => {
    fetchPosts(activeCategory, page);
  };

  const categories = ["전체", ...BBS_CATEGORIES];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">게시판</h1>
      <p className="mt-1 text-sm text-gray-500">공지사항과 유용한 정보를 확인하세요</p>

      {/* Category Tabs */}
      <div className="mt-6 flex gap-2 border-b border-gray-200">
        {categories.map((cat) => {
          const catValue = cat === "전체" ? "" : cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChange(catValue)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
                activeCategory === catValue
                  ? "border-mint text-mint"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Posts List */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">등록된 게시글이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/bbs/${post.id}`}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition"
              >
                {post.thumbnailUrl && (
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded object-cover flex-shrink-0"
                    unoptimized
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-full bg-mint/10 px-2.5 py-0.5 text-xs font-medium text-mint">
                      [{post.category}]
                    </span>
                    <h3 className="text-base font-bold text-navy truncate">{post.title}</h3>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                    <span>조회 {post.viewCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 0 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={meta.page === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>

          {[...Array(meta.totalPages)].map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  meta.page === pageNum
                    ? "bg-mint text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={meta.page === meta.totalPages}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
