"use client";

import { useEffect, useState } from "react";

interface AdProduct {
  id: string;
  name: string;
  type: string;
  categoryScope: string;
  price: number;
  duration: number | null;
  features: any;
  active: boolean;
  sortOrder: number;
}

const CATEGORY_SCOPE_LABEL: Record<string, string> = {
  LISTING: "매물",
  FRANCHISE: "프랜차이즈",
  PARTNER: "협력업체",
  EQUIPMENT: "집기장터",
  COMMON: "공통",
};

const AD_TYPE_LABEL: Record<string, string> = {
  PACKAGE: "패키지",
  SINGLE: "단건",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdProduct>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<AdProduct>>({
    name: "",
    type: "PACKAGE",
    categoryScope: "LISTING",
    price: 0,
    duration: 30,
    features: {},
    active: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (res.ok) {
      alert("수정되었습니다");
      setEditingId(null);
      setEditForm({});
      fetchProducts();
    } else {
      alert("수정에 실패했습니다");
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !currentActive }),
    });

    if (res.ok) {
      fetchProducts();
    } else {
      alert("상태 변경에 실패했습니다");
    }
  }

  async function handleCreate() {
    if (!newProduct.name || !newProduct.price) {
      alert("필수 정보를 입력해주세요");
      return;
    }

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });

    if (res.ok) {
      alert("상품이 추가되었습니다");
      setShowAddForm(false);
      setNewProduct({
        name: "",
        type: "PACKAGE",
        categoryScope: "LISTING",
        price: 0,
        duration: 30,
        features: {},
        active: true,
        sortOrder: 0,
      });
      fetchProducts();
    } else {
      alert("추가에 실패했습니다");
    }
  }

  function startEdit(product: AdProduct) {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      price: product.price,
      duration: product.duration,
      active: product.active,
    });
  }

  // Group products by categoryScope
  const groupedProducts = products.reduce(
    (acc, product) => {
      if (!acc[product.categoryScope]) {
        acc[product.categoryScope] = [];
      }
      acc[product.categoryScope].push(product);
      return acc;
    },
    {} as Record<string, AdProduct[]>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">광고상품 관리</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? "취소" : "+ 새 상품 추가"}
        </button>
      </div>

      {/* Add New Product Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">새 상품 추가</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품명</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                placeholder="예: 프리미엄 패키지"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가격 (원)</label>
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상품 유형</label>
              <select
                value={newProduct.type}
                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
              >
                <option value="PACKAGE">패키지</option>
                <option value="SINGLE">단건</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={newProduct.categoryScope}
                onChange={(e) => setNewProduct({ ...newProduct, categoryScope: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
              >
                <option value="LISTING">매물</option>
                <option value="FRANCHISE">프랜차이즈</option>
                <option value="PARTNER">협력업체</option>
                <option value="EQUIPMENT">집기장터</option>
                <option value="COMMON">공통</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">기간 (일)</label>
              <input
                type="number"
                value={newProduct.duration || ""}
                onChange={(e) => setNewProduct({ ...newProduct, duration: parseInt(e.target.value) || null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                placeholder="없으면 비워두세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정렬순서</label>
              <input
                type="number"
                value={newProduct.sortOrder}
                onChange={(e) => setNewProduct({ ...newProduct, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {/* Products Table by Category */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedProducts).map(([scope, scopeProducts]) => (
            <div key={scope} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  {CATEGORY_SCOPE_LABEL[scope] || scope} 상품
                </h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">상품명</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">유형</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">가격</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">기간</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">활성</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">정렬</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {scopeProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {editingId === product.id ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded outline-none text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 font-medium">{product.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {AD_TYPE_LABEL[product.type] || product.type}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === product.id ? (
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 border border-gray-300 rounded outline-none text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{product.price.toLocaleString()}원</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === product.id ? (
                          <input
                            type="number"
                            value={editForm.duration || ""}
                            onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || null })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded outline-none text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{product.duration ? `${product.duration}일` : "-"}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(product.id, product.active)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.active ? "활성" : "비활성"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.sortOrder}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === product.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(product.id)}
                              className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditForm({});
                              }}
                              className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(product)}
                            className="text-sm px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            수정
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
