"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Bell, MapPin } from "lucide-react";

interface UserSettings {
  smsNotifications: boolean;
}

interface AlertSettings {
  enabled: boolean;
  cities: string[];
  categories: string[];
}

export default function SettingsPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, alertRes] = await Promise.all([
        fetch("/api/user/settings"),
        fetch("/api/my/alert-settings"),
      ]);
      const settingsJson = await settingsRes.json();
      const alertJson = await alertRes.json();

      if (settingsJson.data) {
        setSettings(settingsJson.data);
      }
      if (alertJson.data) {
        setAlertSettings(alertJson.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") fetchSettings();
  }, [authStatus, fetchSettings]);

  const handleToggleSms = async () => {
    if (!settings) return;
    const newValue = !settings.smsNotifications;
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smsNotifications: newValue }),
      });
      if (res.ok) {
        setSettings((prev) => (prev ? { ...prev, smsNotifications: newValue } : prev));
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAlerts = async () => {
    if (!alertSettings) return;
    const newValue = !alertSettings.enabled;
    setSavingAlerts(true);
    try {
      const res = await fetch("/api/my/alert-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: newValue,
          cities: alertSettings.cities,
          categories: alertSettings.categories,
        }),
      });
      if (res.ok) {
        setAlertSettings((prev) => (prev ? { ...prev, enabled: newValue } : prev));
      }
    } catch {
      // ignore
    } finally {
      setSavingAlerts(false);
    }
  };

  const handleCityToggle = (city: string) => {
    if (!alertSettings) return;
    const newCities = alertSettings.cities.includes(city)
      ? alertSettings.cities.filter((c) => c !== city)
      : [...alertSettings.cities, city];

    setAlertSettings((prev) => (prev ? { ...prev, cities: newCities } : prev));
  };

  const handleCategoryToggle = (category: string) => {
    if (!alertSettings) return;
    const newCategories = alertSettings.categories.includes(category)
      ? alertSettings.categories.filter((c) => c !== category)
      : [...alertSettings.categories, category];

    setAlertSettings((prev) => (prev ? { ...prev, categories: newCategories } : prev));
  };

  const handleSaveAlertPreferences = async () => {
    if (!alertSettings) return;
    setSavingAlerts(true);
    try {
      const res = await fetch("/api/my/alert-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alertSettings),
      });
      if (res.ok) {
        alert("알림 설정이 저장되었습니다.");
      } else {
        const json = await res.json();
        if (json.hint) {
          alert(`${json.error}\n\n${json.hint}`);
        } else {
          alert("저장에 실패했습니다.");
        }
      }
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSavingAlerts(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mt-6">
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-navy" />
        <h1 className="text-2xl font-bold text-navy">설정</h1>
      </div>

      {/* Notification Settings */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
            <Bell className="h-4 w-4" />
            알림 설정
          </h3>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">SMS 알림 수신</p>
              <p className="mt-0.5 text-xs text-gray-400">
                새 문의가 도착하면 SMS로 알려드립니다
              </p>
            </div>
            <button
              onClick={handleToggleSms}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                settings?.smsNotifications ? "bg-navy" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={settings?.smsNotifications ?? false}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                  settings?.smsNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Property Alert Settings */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
            <MapPin className="h-4 w-4" />
            관심 매물 알림
          </h3>
        </div>
        <div className="space-y-6 px-6 py-5">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">관심 매물 알림 수신</p>
              <p className="mt-0.5 text-xs text-gray-400">
                관심 지역/업종의 새 매물이 등록되면 알려드립니다
              </p>
            </div>
            <button
              onClick={handleToggleAlerts}
              disabled={savingAlerts}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                alertSettings?.enabled ? "bg-navy" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={alertSettings?.enabled ?? false}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                  alertSettings?.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {alertSettings?.enabled && (
            <>
              {/* City Selection */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-800">관심 지역</p>
                <div className="flex flex-wrap gap-2">
                  {["서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시", "대전광역시", "광주광역시", "울산광역시"].map(
                    (city) => (
                      <button
                        key={city}
                        onClick={() => handleCityToggle(city)}
                        className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                          alertSettings.cities.includes(city)
                            ? "bg-navy text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {city.replace("특별시", "").replace("광역시", "").replace("도", "")}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Category Selection */}
              <div>
                <p className="mb-3 text-sm font-medium text-gray-800">관심 업종</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "KOREAN_FOOD", label: "한식" },
                    { key: "CHINESE_FOOD", label: "중식" },
                    { key: "JAPANESE_FOOD", label: "일식" },
                    { key: "WESTERN_FOOD", label: "양식" },
                    { key: "CAFE_BAKERY", label: "카페" },
                    { key: "CHICKEN", label: "치킨" },
                    { key: "PIZZA", label: "피자" },
                    { key: "BAR_PUB", label: "술집" },
                    { key: "SERVICE", label: "서비스" },
                    { key: "RETAIL", label: "소매" },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleCategoryToggle(cat.key)}
                      className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                        alertSettings.categories.includes(cat.key)
                          ? "bg-navy text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={handleSaveAlertPreferences}
                  disabled={savingAlerts}
                  className="rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90 disabled:opacity-50"
                >
                  {savingAlerts ? "저장 중..." : "알림 설정 저장"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
