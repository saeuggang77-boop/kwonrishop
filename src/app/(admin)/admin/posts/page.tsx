"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatNumber, formatDateKR } from "@/lib/utils/format";

const POST_CATEGORIES = ["공지사항", "이용가이드", "창업정보", "알림공지"] as const;

type Post = {
  id: string;
  category: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  viewCount: number;
  isPublished: boolean;
  createdAt: string;
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "공지사항",
    title: "",
    content: "",
    thumbnailUrl: "",
    isPublished: true,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts");
      const result = await response.json();
      setPosts(result.data || []);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      thumbnailUrl: formData.thumbnailUrl || null,
    };

    try {
      const url = editingId
        ? `/api/admin/posts/${editingId}`
        : "/api/admin/posts";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save post");

      await fetchPosts();
      resetForm();
      alert(editingId ? "수정되었습니다." : "등록되었습니다.");
    } catch (error) {
      console.error("Save failed:", error);
      alert("저장에 실패했습니다.");
    }
  };

  const handleEdit = (post: Post) => {
    setFormData({
      category: post.category,
      title: post.title,
      content: post.content,
      thumbnailUrl: post.thumbnailUrl || "",
      isPublished: post.isPublished,
    });
    setEditingId(post.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      await fetchPosts();
      alert("삭제되었습니다.");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to toggle publish");

      await fetchPosts();
    } catch (error) {
      console.error("Toggle failed:", error);
      alert("상태 변경에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({
      category: "공지사항",
      title: "",
      content: "",
      thumbnailUrl: "",
      isPublished: true,
    });
    setEditingId(null);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">게시판 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {formatNumber(posts.length)}개
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {/* Form */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "게시글 수정" : "게시글 추가"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {POST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  썸네일 URL
                </label>
                <input
                  type="text"
                  value={formData.thumbnailUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnailUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용 *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  바로 발행
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {editingId ? "수정" : "등록"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-6 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  제목
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  조회수
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  발행상태
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-right">
                  작성일
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="even:bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {post.title}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500">
                    {formatNumber(post.viewCount)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => togglePublish(post.id, post.isPublished)}
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        post.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {post.isPublished ? "발행됨" : "비공개"}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right text-gray-500">
                    {formatDateKR(new Date(post.createdAt))}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(post)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    게시글이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
