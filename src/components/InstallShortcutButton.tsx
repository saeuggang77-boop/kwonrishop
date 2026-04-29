"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(ua) &&
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS/.test(ua)
  );
}

export default function InstallShortcutButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 이미 설치된 경우 노출하지 않음
    if (isStandalone()) return;

    // iOS Safari는 beforeinstallprompt가 없으므로 즉시 표시
    if (isIOSSafari()) {
      setVisible(true);
      return;
    }

    // Android/Chrome 계열: beforeinstallprompt가 한 번이라도 발생하면 표시
    function handleBIP(e: Event) {
      e.preventDefault();
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handleBIP);

    // 설치 완료 이벤트 발생 시 숨김
    function handleAppInstalled() {
      setVisible(false);
    }
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBIP);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!visible) return null;

  function handleClick() {
    window.dispatchEvent(new CustomEvent("pwa-install-trigger"));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="앱 설치"
      className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-terra-500 hover:bg-terra-700 text-cream text-xs font-semibold transition-colors shrink-0"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M12 8v7" />
        <path d="m9 12 3 3 3-3" />
      </svg>
      <span>앱 설치</span>
    </button>
  );
}
