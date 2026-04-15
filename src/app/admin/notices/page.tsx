"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
    role: string;
  };
}

export default function AdminNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/admin/notices");
      if (!res.ok) throw new Error("공지사항 불러오기 실패");
      const data = await res.json();
      setNotices(data);
    } catch (error) {
      console.error(error);
      toast.error("공지사항을 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.info("제목과 내용을 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("공지사항 작성 실패");

      toast.success("공지사항이 등록되었습니다");
      setFormData({ title: "", content: "" });
      setShowForm(false);
      fetchNotices();
    } catch (error) {
      console.error(error);
      toast.error("공지사항 등록에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/notices/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("삭제 실패");

      toast.success("공지사항이 삭제되었습니다");
      fetchNotices();
    } catch (error) {
      console.error(error);
      toast.error("공지사항 삭제에 실패했습니다");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "취소" : "공지 작성"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">새 공지사항</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="공지사항 제목"
                disabled={submitting}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="공지사항 내용"
                disabled={submitting}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {submitting ? "등록 중..." : "등록"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-cream rounded-2xl border border-line overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작성자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작성일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {notices.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  등록된 공지사항이 없습니다
                </td>
              </tr>
            ) : (
              notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {notice.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {notice.content}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {notice.author.name || "관리자"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(notice.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(notice.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
