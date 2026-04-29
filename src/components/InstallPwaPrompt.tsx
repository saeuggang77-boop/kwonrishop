"use client";

import { useEffect, useRef, useState } from "react";

const VISIT_COUNT_KEY = "pwa-visit-count";
const SESSION_GUARD_KEY = "pwa-visit-counted";
const DISMISS_KEY = "pwa-install-dismissed";
const VISIT_THRESHOLD = 3;
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

type Platform = "ios" | "android" | "other";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS =
    /iPhone|iPad|iPod/.test(ua) &&
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS/.test(ua);
  if (isIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function shouldRespectDismiss(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const elapsed = Date.now() - Number(ts);
    return elapsed < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function bumpVisitCount(): number {
  try {
    if (sessionStorage.getItem(SESSION_GUARD_KEY)) {
      return Number(localStorage.getItem(VISIT_COUNT_KEY) || "0");
    }
    sessionStorage.setItem(SESSION_GUARD_KEY, "1");
    const current = Number(localStorage.getItem(VISIT_COUNT_KEY) || "0");
    const next = current + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(next));
    return next;
  } catch {
    return 0;
  }
}

export default function InstallPwaPrompt() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 플랫폼 감지는 항상 수행 (외부 트리거 시에도 필요)
    const p = detectPlatform();
    setPlatform(p);

    // 자동 노출 가드: 이미 설치된 경우엔 자동 노출도 외부 트리거도 의미 없음
    const installed = isStandalone();

    function handleBIP(e: Event) {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      // 방문 횟수 임계 도달 + dismiss 쿨다운 미해당 시에만 자동 노출
      if (!installed && !shouldRespectDismiss()) {
        const v = Number(localStorage.getItem(VISIT_COUNT_KEY) || "0");
        if (v >= VISIT_THRESHOLD) setOpen(true);
      }
    }
    window.addEventListener("beforeinstallprompt", handleBIP);

    // 외부 트리거: 사용자가 직접 버튼을 누른 경우 → dismiss 쿨다운 무시, 설치 안된 경우에만
    function handleExternalTrigger() {
      if (isStandalone()) return;
      setOpen(true);
    }
    window.addEventListener("pwa-install-trigger", handleExternalTrigger);

    // 자동 노출 평가
    if (!installed && !shouldRespectDismiss()) {
      const visits = bumpVisitCount();
      // iOS는 beforeinstallprompt가 발생하지 않음 → 방문 횟수만으로 노출
      if (p === "ios" && visits >= VISIT_THRESHOLD) {
        setOpen(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBIP);
      window.removeEventListener("pwa-install-trigger", handleExternalTrigger);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setOpen(false);
  }

  async function handleInstallAndroid() {
    const evt = deferredPromptRef.current;
    if (!evt) {
      setOpen(false);
      return;
    }
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch {
      // ignore
    } finally {
      deferredPromptRef.current = null;
      setOpen(false);
    }
  }

  if (!open) return null;

  if (platform === "ios") {
    return (
      <div
        className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
        onClick={handleDismiss}
        role="dialog"
        aria-modal="true"
        aria-label="홈 화면에 추가"
      >
        <div
          className="w-full sm:max-w-md bg-cream rounded-t-3xl sm:rounded-3xl shadow-card-hover border border-line p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-terra-500 flex items-center justify-center shrink-0">
              <span className="block w-3.5 h-3.5 rounded-full bg-cream" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-green-700 tracking-tight">
                권리샵을 홈 화면에 추가하세요
              </h2>
              <p className="text-xs text-muted mt-0.5">
                한 번에 들어와 매물·알림을 확인할 수 있어요
              </p>
            </div>
          </div>

          <ol className="mt-5 space-y-3 bg-cream-elev rounded-2xl p-4 border border-line">
            <li className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-cream border border-line flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                1
              </span>
              <span className="text-sm text-ink-2 flex items-center gap-2">
                Safari 하단의
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-cream border border-line">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1F3F2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4" />
                    <path d="m8 8 4-4 4 4" />
                    <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                  </svg>
                </span>
                공유 버튼 누르기
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-cream border border-line flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                2
              </span>
              <span className="text-sm text-ink-2">
                <strong className="font-semibold">홈 화면에 추가</strong> 선택
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-cream border border-line flex items-center justify-center text-xs font-bold text-green-700 shrink-0">
                3
              </span>
              <span className="text-sm text-ink-2">
                우측 상단 <strong className="font-semibold">추가</strong> 버튼 탭
              </span>
            </li>
          </ol>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              onClick={handleDismiss}
              className="text-sm text-muted hover:text-ink-2 transition-colors px-2 py-2"
              type="button"
            >
              다음에
            </button>
            <button
              onClick={handleDismiss}
              className="px-6 py-2.5 bg-terra-500 hover:bg-terra-700 text-cream rounded-full font-semibold text-sm transition-colors"
              type="button"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android / Chrome 등: 화면 하단 고정 배너
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[9998] flex justify-center px-3 pb-3 sm:pb-4 pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-label="홈 화면에 추가"
    >
      <div className="w-full sm:max-w-md bg-cream border border-line rounded-2xl shadow-card-hover p-4 flex items-center gap-3 pointer-events-auto">
        <div className="w-10 h-10 rounded-full bg-terra-500 flex items-center justify-center shrink-0">
          <span className="block w-3.5 h-3.5 rounded-full bg-cream" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-green-700 truncate">
            권리샵을 홈 화면에 추가
          </p>
          <p className="text-xs text-muted truncate">
            빠르게 매물·알림 확인
          </p>
        </div>
        <button
          onClick={handleInstallAndroid}
          className="shrink-0 px-4 py-2 bg-terra-500 hover:bg-terra-700 text-cream rounded-full font-semibold text-sm transition-colors"
          type="button"
        >
          설치
        </button>
        <button
          onClick={handleDismiss}
          aria-label="닫기"
          className="shrink-0 w-8 h-8 flex items-center justify-center text-muted hover:text-ink-2 transition-colors"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
