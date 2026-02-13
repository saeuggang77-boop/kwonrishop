"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Banner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  subtitle: string | null;
  ctaText: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export default function AdminBannersPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    ctaText: "",
    imageUrl: "",
    linkUrl: "",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch("/api/admin/banners");
      const result = await response.json();
      setBanners(result.data || []);
    } catch {
      // silently fail on fetch
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      linkUrl: formData.linkUrl || null,
      sortOrder: parseInt(formData.sortOrder.toString()),
    };

    try {
      const url = editingId
        ? `/api/admin/banners/${editingId}`
        : "/api/admin/banners";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save banner");

      await fetchBanners();
      resetForm();
      toast("success", editingId ? "수정되었습니다." : "등록되었습니다.");
    } catch {
      toast("error", "저장에 실패했습니다.");
    }
  };

  const handleEdit = (banner: Banner) => {
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle || "",
      ctaText: banner.ctaText || "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setEditingId(banner.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      await fetchBanners();
      toast("success", "삭제되었습니다.");
    } catch {
      toast("error", "삭제에 실패했습니다.");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to toggle active");

      await fetchBanners();
    } catch {
      toast("error", "상태 변경에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      ctaText: "",
      imageUrl: "",
      linkUrl: "",
      sortOrder: 0,
      isActive: true,
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
          <h1 className="text-2xl font-bold text-gray-900">배너 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {banners.length}개
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
            {editingId ? "배너 수정" : "배너 추가"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  정렬 순서
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                배너 이미지 *
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer">
                    <ImageIcon className="w-4 h-4" />
                    이미지 업로드
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) { toast("error", "10MB 이하만 가능"); return; }
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("listingId", "banners");
                        try {
                          const res = await fetch("/api/upload/image", { method: "POST", body: fd });
                          const result = await res.json();
                          if (result.data?.url) {
                            setFormData(prev => ({ ...prev, imageUrl: result.data.url }));
                            toast("success", "업로드 완료");
                          } else { toast("error", "업로드 실패"); }
                        } catch { toast("error", "업로드 오류"); }
                      }}
                    />
                  </label>
                  <span className="text-xs text-gray-400">또는</span>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="이미지 URL 직접 입력"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {formData.imageUrl && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    {formData.imageUrl.startsWith("gradient:") ? (
                      <div className="w-full h-full" style={{ background: formData.imageUrl.replace("gradient:", "") }} />
                    ) : (
                      <img src={formData.imageUrl} alt="미리보기" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부제목
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="검증된 매물만 거래하는 프리미엄 플랫폼"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  버튼 텍스트
                </label>
                <input
                  type="text"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  placeholder="매물 보러가기"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                링크 URL
              </label>
              <input
                type="text"
                value={formData.linkUrl}
                onChange={(e) =>
                  setFormData({ ...formData, linkUrl: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  활성화
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
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  미리보기
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  제목
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  링크 URL
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  순서
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  활성
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banners.map((banner) => (
                <tr key={banner.id} className="even:bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="px-4 py-4">
                    {banner.imageUrl.startsWith("gradient:") ? (
                      <div
                        className="h-10 w-20 rounded"
                        style={{
                          background: banner.imageUrl.replace("gradient:", ""),
                        }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="h-10 w-20 object-cover rounded"
                      />
                    )}
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-900">
                    {banner.title}
                  </td>
                  <td className="px-4 py-4 text-gray-500 max-w-[200px] truncate">
                    {banner.linkUrl || "-"}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500">
                    {banner.sortOrder}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => toggleActive(banner.id, banner.isActive)}
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        banner.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {banner.isActive ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <p>배너가 없습니다.</p>
                    </div>
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
