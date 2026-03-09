"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FranchiseBrand {
  id: string;
  ftcId: string | null;
  brandName: string;
  companyName: string;
  businessNumber: string | null;
  industry: string | null;
  totalStores: number | null;
  tier: string;
  createdAt: string;
  updatedAt: string;
}

interface FTCSearchResult {
  ftcId: string;
  brandName: string;
  companyName: string;
  businessNumber: string;
  industry: string;
}

export default function AdminFranchisePage() {
  const router = useRouter();
  const [brands, setBrands] = useState<FranchiseBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FTCSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    setLoading(true);
    const res = await fetch("/api/franchise?limit=100");
    const data = await res.json();
    setBrands(data.brands || []);
    setLoading(false);
  }

  async function handleFTCSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    const res = await fetch(`/api/franchise/search?q=${encodeURIComponent(searchQuery)}`);
    const data = await res.json();
    setSearchResults(data.brands || []);
    setSearching(false);
  }

  async function handleImportBrand(ftcId: string) {
    if (!confirm("이 브랜드를 가져오시겠습니까?")) return;

    setSyncing(true);
    const res = await fetch("/api/admin/franchise/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ftcId }),
    });

    if (res.ok) {
      alert("브랜드를 성공적으로 가져왔습니다");
      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      fetchBrands();
    } else {
      alert("브랜드 가져오기에 실패했습니다");
    }
    setSyncing(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">프랜차이즈 관리</h1>
        <p className="text-gray-600">프랜차이즈 브랜드를 관리하고 공정위 데이터를 동기화합니다</p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setShowSearchModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          🔍 공정위 검색
        </button>
      </div>

      {/* Brand Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  브랜드명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  회사명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  업종
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  매장수
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  등급
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  공정위 등록
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  등록일
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    등록된 브랜드가 없습니다
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/franchise/${brand.id}`)}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {brand.brandName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{brand.companyName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{brand.industry || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {brand.totalStores ? `${brand.totalStores.toLocaleString()}개` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          brand.tier === "GOLD"
                            ? "bg-yellow-100 text-yellow-800"
                            : brand.tier === "SILVER"
                              ? "bg-gray-100 text-gray-800"
                              : brand.tier === "BRONZE"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {brand.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {brand.ftcId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ 등록됨
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(brand.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FTC Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">공정위 프랜차이즈 검색</h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Search Form */}
            <div className="px-6 py-4 border-b border-gray-200">
              <form onSubmit={handleFTCSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="브랜드명 입력"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                >
                  {searching ? "검색 중..." : "검색"}
                </button>
              </form>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {searchResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>검색 결과가 없습니다</p>
                  <p className="text-sm mt-1">브랜드명을 입력하고 검색해주세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result) => (
                    <div
                      key={result.ftcId}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{result.brandName}</h3>
                          <p className="text-sm text-gray-600 mt-1">{result.companyName}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            <span>업종: {result.industry}</span>
                            <span>사업자번호: {result.businessNumber}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleImportBrand(result.ftcId)}
                          disabled={syncing}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 shrink-0"
                        >
                          {syncing ? "..." : "가져오기"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
