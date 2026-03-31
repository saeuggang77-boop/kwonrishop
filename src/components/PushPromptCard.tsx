"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "pwa-push-prompt";

interface DismissState {
  dismissCount: number;
  lastDismissed: string;
}

interface PushPromptCardProps {
  /** 색상 테마 */
  accentColor?: "blue" | "purple" | "green" | "amber";
  /** granted+설치 완료 시 "이미 활성화" 텍스트 표시 */
  showGrantedText?: boolean;
}

function getDismissState(): DismissState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function shouldShowByDismiss(): boolean {
  const state = getDismissState();
  if (!state) return true;
  // 2차 거절 → 영구 미표시
  if (state.dismissCount >= 2) return false;
  // 1차 거절 → 30일 쿨다운
  if (state.dismissCount === 1) {
    const elapsed = Date.now() - new Date(state.lastDismissed).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (elapsed < thirtyDays) return false;
  }
  return true;
}

export default function PushPromptCard({
  accentColor = "blue",
  showGrantedText = false,
}: PushPromptCardProps) {
  const [pushPermission, setPushPermission] = useState<string>("default");
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 쿨다운 체크
    if (!shouldShowByDismiss()) return;

    // 푸시 지원 & 상태
    const pushSupported = "Notification" in window && "serviceWorker" in navigator;
    const currentPermission = pushSupported ? Notification.permission : "denied";
    setPushPermission(currentPermission);

    // PWA 설치 여부
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // iOS 체크
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // 푸시 미허용 OR PWA 미설치 → 표시
    const pushNeeded = currentPermission === "default";
    const pwaNeeded = !standalone;
    if (pushNeeded || pwaNeeded) {
      setVisible(true);
    }

    // beforeinstallprompt 캡처 (Android Chrome 등)
    function handleBIP(e: Event) {
      e.preventDefault();
      deferredPromptRef.current = e;
    }
    window.addEventListener("beforeinstallprompt", handleBIP);
    return () => window.removeEventListener("beforeinstallprompt", handleBIP);
  }, []);

  // 비표시
  if (!visible) {
    if (showGrantedText && pushPermission === "granted") {
      return (
        <p className="text-xs text-green-500 dark:text-green-400 mt-3 flex items-center justify-center gap-1">
          <BellIcon className="w-4 h-4" />
          알림이 이미 활성화되어 있습니다
        </p>
      );
    }
    return null;
  }

  // 상태별 메시지
  const pushNeeded = pushPermission === "default";
  const pwaNeeded = !isStandalone;

  let title: string;
  let desc: string;
  let buttonText: string;

  if (pwaNeeded && pushNeeded) {
    title = "권리샵을 홈 화면에 추가하세요";
    desc = "앱처럼 빠르게 접속하고, 새 문의·채팅 알림도 바로 받아보세요";
    buttonText = "추가하기";
  } else if (pushNeeded) {
    title = "알림을 켜면 소식을 바로 받을 수 있어요";
    desc = "새 문의, 채팅 답장, 관심 매물 변동을 놓치지 마세요";
    buttonText = "알림 켜기";
  } else {
    title = "권리샵을 홈 화면에 추가하세요";
    desc = "앱처럼 빠르게 접속할 수 있어요";
    buttonText = "홈 화면 추가";
  }

  const colors = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconText: "text-blue-600 dark:text-blue-400",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-800",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconText: "text-purple-600 dark:text-purple-400",
      button: "bg-purple-600 hover:bg-purple-700",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      iconBg: "bg-green-100 dark:bg-green-900/50",
      iconText: "text-green-600 dark:text-green-400",
      button: "bg-green-600 hover:bg-green-700",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-200 dark:border-amber-800",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconText: "text-amber-600 dark:text-amber-400",
      button: "bg-amber-600 hover:bg-amber-700",
    },
  };
  const c = colors[accentColor];

  async function handleEnable() {
    setRequesting(true);
    try {
      // 1. 푸시 알림 권한 요청
      if (pushNeeded) {
        const { enablePushNotification } = await import("@/components/PushNotificationManager");
        const result = await enablePushNotification();
        setPushPermission(result === "granted" ? "granted" : result === "denied" ? "denied" : "default");
      }

      // 2. PWA 설치
      if (pwaNeeded) {
        if (deferredPromptRef.current) {
          deferredPromptRef.current.prompt();
          const choice = await deferredPromptRef.current.userChoice;
          if (choice.outcome === "accepted") {
            setIsStandalone(true);
          }
          deferredPromptRef.current = null;
        } else if (isIOS) {
          // iOS는 수동 설치만 가능 → 가이드 표시
          setShowIOSGuide(true);
          setRequesting(false);
          return;
        }
      }

      setVisible(false);
    } catch {
      // ignore
    } finally {
      setRequesting(false);
    }
  }

  function handleDismiss() {
    const state = getDismissState();
    const newState: DismissState = {
      dismissCount: (state?.dismissCount || 0) + 1,
      lastDismissed: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    setVisible(false);
  }

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5`}>
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 ${c.iconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}
        >
          <BellIcon className={`w-5 h-5 ${c.iconText}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>

          {showIOSGuide && (
            <div className="mt-2 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                Safari 하단의 <strong>공유(□↑)</strong> 버튼을 누른 후{" "}
                <strong>&quot;홈 화면에 추가&quot;</strong>를 선택해주세요
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={requesting}
              className={`px-4 py-2 ${c.button} text-white text-sm rounded-lg font-medium disabled:opacity-50 transition-colors`}
            >
              {requesting ? "설정 중..." : buttonText}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-400 dark:text-gray-500 text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
