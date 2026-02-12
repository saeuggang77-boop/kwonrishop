"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Bell } from "lucide-react";

interface UserSettings {
  smsNotifications: boolean;
}

export default function SettingsPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/user/settings");
      const json = await res.json();
      if (json.data) {
        setSettings(json.data);
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
    </div>
  );
}
