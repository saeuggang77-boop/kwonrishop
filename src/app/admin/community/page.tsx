"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "@/lib/toast";

interface PostAuthor {
  id: string;
  name: string | null;
  image: string | null;
  isGhost: boolean;
}

interface Post {
  id: string;
  title: string;
  tag: string | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  author: PostAuthor;
  _count: { comments: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type UserTypeFilter = "ALL" | "ghost" | "normal";
type SortOption = "recent" | "oldest" | "views" | "comments";

const TAG_COLORS: Record<string, string> = {
  공지: "bg-red-100 text-red-700",
  자유: "bg-blue-100 text-blue-700",
  질문: "bg-yellow-100 text-yellow-700",
  정보: "bg-green-100 text-green-700",
  사이트이용문의: "bg-purple-100 text-purple-700",
};

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [inputKeyword, setInputKeyword] = useState("");
  const [userType, setUserType] = useState<UserTypeFilter>("ALL");
  const [sort, setSort] = useState<SortOption>("recent");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort,
      });
      if (keyword) params.set("keyword", keyword);
      if (userType !== "ALL") params.set("userType", userType);

      const res = await fetch(`/api/admin/community?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch {
      toast.error("게시글 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, keyword, userType, sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [keyword, userType, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(inputKeyword.trim());
    setPage(1);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 게시글을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("게시글이 삭제되었습니다.");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchPosts();
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}개의 게시글을 삭제하시겠습니까?`)) return;
    setBulkDeleting(true);
    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/community/${id}`, { method: "DELETE" }))
    );
    const failCount = results.filter(
      (r) => r.status === "rejected" || !(r.status === "fulfilled" && r.value.ok)
    ).length;
    setBulkDeleting(false);
    setSelectedIds(new Set());
    if (failCount > 0) {
      toast.error(`${failCount}개 삭제 실패했습니다.`);
    } else {
      toast.success(`${ids.length}개 삭제 완료`);
    }
    fetchPosts();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(posts.map((p) => p.id)));
    }
  };

  const userTypeOptions: { value: UserTypeFilter; label: string }[] = [
    { value: "ALL", label: "전체" },
    { value: "normal", label: "일반 사용자" },
    { value: "ghost", label: "고스트" },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "recent", label: "최신순" },
    { value: "oldest", label: "오래된순" },
    { value: "views", label: "조회수" },
    { value: "comments", label: "댓글수" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">커뮤니티 관리</h1>
        <p className="text-gray-600">게시글을 검색하고 관리하세요</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={inputKeyword}
            onChange={(e) => setInputKeyword(e.target.value)}
            placeholder="제목 또는 내용으로 검색"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            검색
          </button>
          {keyword && (
            <button
              type="button"
              onClick={() => {
                setInputKeyword("");
                setKeyword("");
              }}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              초기화
            </button>
          )}
        </form>

        {/* Filters row */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* User type */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">작성자:</span>
            <div className="flex gap-1">
              {userTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setUserType(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    userType === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">정렬:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {pagination && (
            <span className="text-sm text-gray-500 ml-auto">
              총 {pagination.total.toLocaleString()}개
            </span>
          )}
        </div>
      </div>

      {/* Bulk delete bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <span className="text-sm font-medium text-red-700">
            {selectedIds.size}개 선택됨
          </span>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {bulkDeleting ? "삭제 중..." : "일괄 삭제"}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-4 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            선택 해제
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-cream rounded-2xl border border-line overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 md:px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={posts.length > 0 && selectedIds.size === posts.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작성자
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                카테고리
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                댓글
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                조회
              </th>
              <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작성일
              </th>
              <th className="px-3 md:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  로딩 중...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  게시글이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <a
                      href={`/community/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1 max-w-[140px] md:max-w-[240px] block"
                      title={post.title}
                    >
                      {post.title}
                    </a>
                    <div className="md:hidden text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>{post.author.name || "익명"}{post.author.isGhost && " 🤖"}</span>
                      {post.tag && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${TAG_COLORS[post.tag] || "bg-gray-100 text-gray-600"}`}>
                          {post.tag}
                        </span>
                      )}
                      <span>댓 {post._count.comments} · 조 {post.viewCount}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-700">
                        {post.author.name || "알 수 없음"}
                      </span>
                      {post.author.isGhost && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                          🤖 고스트
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    {post.tag ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          TAG_COLORS[post.tag] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {post.tag}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                    {post._count.comments.toLocaleString()}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">
                    {post.viewCount.toLocaleString()}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-3 md:px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/community/${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        수정
                      </a>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            이전
          </button>
          <span className="px-4 py-2 text-gray-700 text-sm">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
