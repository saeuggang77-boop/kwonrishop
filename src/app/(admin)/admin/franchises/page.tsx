"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatKRW, formatNumber } from "@/lib/utils/format";
import { FRANCHISE_CATEGORIES } from "@/lib/utils/constants";
import { useToast } from "@/components/ui/toast";

type Franchise = {
  id: string;
  brandName: string;
  category: string;
  subcategory: string;
  logoUrl: string | null;
  monthlyAvgSales: string | null;
  startupCost: string | null;
  storeCount: number | null;
  dataYear: number | null;
  description: string | null;
  isPromoting: boolean;
  createdAt: string;
};

export default function AdminFranchisesPage() {
  const { toast } = useToast();
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brandName: "",
    category: "외식",
    subcategory: "",
    logoUrl: "",
    monthlyAvgSales: "",
    startupCost: "",
    storeCount: "",
    dataYear: new Date().getFullYear().toString(),
    description: "",
    isPromoting: false,
  });

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    try {
      const response = await fetch("/api/admin/franchises");
      const result = await response.json();
      setFranchises(result.data || []);
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
      monthlyAvgSales: formData.monthlyAvgSales
        ? parseInt(formData.monthlyAvgSales)
        : null,
      startupCost: formData.startupCost ? parseInt(formData.startupCost) : null,
      storeCount: formData.storeCount ? parseInt(formData.storeCount) : null,
      dataYear: formData.dataYear ? parseInt(formData.dataYear) : null,
      logoUrl: formData.logoUrl || null,
      description: formData.description || null,
    };

    try {
      const url = editingId
        ? `/api/admin/franchises/${editingId}`
        : "/api/admin/franchises";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save franchise");

      await fetchFranchises();
      resetForm();
      toast("success", editingId ? "수정되었습니다." : "등록되었습니다.");
    } catch {
      toast("error", "저장에 실패했습니다.");
    }
  };

  const handleEdit = (franchise: Franchise) => {
    setFormData({
      brandName: franchise.brandName,
      category: franchise.category,
      subcategory: franchise.subcategory,
      logoUrl: franchise.logoUrl || "",
      monthlyAvgSales: franchise.monthlyAvgSales || "",
      startupCost: franchise.startupCost || "",
      storeCount: franchise.storeCount?.toString() || "",
      dataYear: franchise.dataYear?.toString() || "",
      description: franchise.description || "",
      isPromoting: franchise.isPromoting,
    });
    setEditingId(franchise.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/admin/franchises/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      await fetchFranchises();
      toast("success", "삭제되었습니다.");
    } catch {
      toast("error", "삭제에 실패했습니다.");
    }
  };

  const togglePromoting = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/franchises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPromoting: !currentStatus }),
      });

      if (!response.ok) throw new Error("Failed to toggle promoting");

      await fetchFranchises();
    } catch {
      toast("error", "상태 변경에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({
      brandName: "",
      category: "외식",
      subcategory: "",
      logoUrl: "",
      monthlyAvgSales: "",
      startupCost: "",
      storeCount: "",
      dataYear: new Date().getFullYear().toString(),
      description: "",
      isPromoting: false,
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
          <h1 className="text-2xl font-bold text-gray-900">프랜차이즈 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {formatNumber(franchises.length)}개
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
            {editingId ? "프랜차이즈 수정" : "프랜차이즈 추가"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                브랜드명 *
              </label>
              <input
                type="text"
                required
                value={formData.brandName}
                onChange={(e) =>
                  setFormData({ ...formData, brandName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

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
                {FRANCHISE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                세부 카테고리 *
              </label>
              <input
                type="text"
                required
                value={formData.subcategory}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory: e.target.value })
                }
                placeholder="예: 한식, 커피, 치킨 등"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                월평균 매출
              </label>
              <input
                type="number"
                value={formData.monthlyAvgSales}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyAvgSales: e.target.value })
                }
                placeholder="원"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                창업비용
              </label>
              <input
                type="number"
                value={formData.startupCost}
                onChange={(e) =>
                  setFormData({ ...formData, startupCost: e.target.value })
                }
                placeholder="원"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                가맹점 수
              </label>
              <input
                type="number"
                value={formData.storeCount}
                onChange={(e) =>
                  setFormData({ ...formData, storeCount: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                데이터 기준년도
              </label>
              <input
                type="number"
                value={formData.dataYear}
                onChange={(e) =>
                  setFormData({ ...formData, dataYear: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                로고 URL
              </label>
              <input
                type="text"
                value={formData.logoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, logoUrl: e.target.value })
                }
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPromoting}
                  onChange={(e) =>
                    setFormData({ ...formData, isPromoting: e.target.checked })
                  }
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  프로모션 표시
                </span>
              </label>
            </div>

            <div className="md:col-span-2 flex gap-2">
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
                  브랜드명
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                  세부 카테고리
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-right">
                  월평균 매출
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-right">
                  창업비용
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  가맹점수
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  프로모션
                </th>
                <th className="px-4 py-3 text-xs text-gray-500 font-medium uppercase tracking-wider text-center">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {franchises.map((franchise) => (
                <tr key={franchise.id} className="even:bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {franchise.brandName}
                  </td>
                  <td className="px-4 py-4 text-gray-500">
                    {franchise.category}
                  </td>
                  <td className="px-4 py-4 text-gray-500">
                    {franchise.subcategory}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-700">
                    {franchise.monthlyAvgSales
                      ? formatKRW(BigInt(franchise.monthlyAvgSales))
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-right text-gray-700">
                    {franchise.startupCost
                      ? formatKRW(BigInt(franchise.startupCost))
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500">
                    {franchise.storeCount
                      ? formatNumber(franchise.storeCount)
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => togglePromoting(franchise.id, franchise.isPromoting)}
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors ${
                        franchise.isPromoting
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {franchise.isPromoting ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(franchise)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(franchise.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {franchises.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    프랜차이즈가 없습니다.
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
