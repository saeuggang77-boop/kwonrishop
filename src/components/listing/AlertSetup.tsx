"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";

interface AlertPreference {
  region: string;
  categoryId: string;
  maxPremium: string;
}

interface CategoryOption {
  id: string;
  name: string;
  icon: string | null;
}

export default function AlertSetup() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [preferences, setPreferences] = useState<AlertPreference>({
    region: "",
    categoryId: "",
    maxPremium: "",
  });
  const [savedPreferences, setSavedPreferences] = useState<AlertPreference | null>(null);
  const [newListingsCount, setNewListingsCount] = useState(0);

  useEffect(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem("alertPreferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedPreferences(parsed);
        setPreferences(parsed);
      } catch (err) {
        console.error("Failed to parse alert preferences", err);
      }
    }

    // Load categories from API
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data: CategoryOption[]) => setCategories(data))
      .catch(() => {});

    // Check for new listings
    checkNewListings();
  }, []);

  async function checkNewListings() {
    const saved = localStorage.getItem("alertPreferences");
    const lastCheck = localStorage.getItem("alertLastCheck");

    if (!saved) return;

    try {
      const prefs = JSON.parse(saved);
      const params = new URLSearchParams();

      if (prefs.region) params.set("region", prefs.region);
      if (prefs.categoryId) params.set("categoryId", prefs.categoryId);
      if (prefs.maxPremium) params.set("maxPremium", prefs.maxPremium);
      if (lastCheck) params.set("since", lastCheck);

      const res = await fetch(`/api/listings/new-count?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNewListingsCount(data.count || 0);
      }
    } catch (err) {
      console.error("Failed to check new listings", err);
    }
  }

  function handleSave() {
    if (!preferences.region && !preferences.categoryId && !preferences.maxPremium) {
      toast.info("최소 하나 이상의 조건을 설정해주세요");
      return;
    }

    localStorage.setItem("alertPreferences", JSON.stringify(preferences));
    localStorage.setItem("alertLastCheck", new Date().toISOString());
    setSavedPreferences(preferences);
    setNewListingsCount(0);
    setIsOpen(false);
    toast.success("관심 지역 알림이 설정되었습니다");
  }

  function handleClear() {
    localStorage.removeItem("alertPreferences");
    localStorage.removeItem("alertLastCheck");
    setPreferences({ region: "", categoryId: "", maxPremium: "" });
    setSavedPreferences(null);
    setNewListingsCount(0);
    setIsOpen(false);
  }

  return (
    <>
      {/* Alert Badge */}
      {newListingsCount > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm font-medium text-green-900">
              새 매물 {newListingsCount}건이 등록되었습니다
            </span>
          </div>
          <button
            onClick={() => {
              setNewListingsCount(0);
              localStorage.setItem("alertLastCheck", new Date().toISOString());
            }}
            className="text-xs text-green-700 hover:text-green-700 font-medium"
          >
            확인
          </button>
        </div>
      )}

      {/* Alert Setup Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        관심 지역 알림 설정
        {savedPreferences && (
          <span className="w-2 h-2 bg-green-700 rounded-full"></span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">관심 지역 알림 설정</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                조건에 맞는 새 매물이 등록되면 알림을 받을 수 있습니다
              </p>

              <div className="space-y-4">
                {/* 지역 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    지역
                  </label>
                  <input
                    type="text"
                    value={preferences.region}
                    onChange={(e) => setPreferences({ ...preferences, region: e.target.value })}
                    placeholder="예: 강남구, 홍대, 신촌"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* 업종 카테고리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업종 카테고리
                  </label>
                  <select
                    value={preferences.categoryId}
                    onChange={(e) => setPreferences({ ...preferences, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">전체</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 최대 권리금 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최대 권리금 (만원)
                  </label>
                  <input
                    type="number"
                    value={preferences.maxPremium}
                    onChange={(e) => setPreferences({ ...preferences, maxPremium: e.target.value })}
                    placeholder="예: 5000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                {savedPreferences && (
                  <button
                    onClick={handleClear}
                    className="flex-1 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    알림 해제
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-600 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
