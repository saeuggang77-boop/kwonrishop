"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const DISMISS_KEY = "pwa-banner-dismissed";
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // standalone 모드면 표시 안 함
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // @ts-expect-error — iOS Safari standalone property
    if (window.navigator.standalone === true) return;

    // 7일 이내 닫은 적 있으면 표시 안 함
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const elapsed = Date.now() - Number(dismissed);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // iOS 판별
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua);
    setIsIos(ios);

    setShowBanner(true);

    // Android: beforeinstallprompt 이벤트 캐치
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowBanner(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      // Android: 네이티브 설치 프롬프트
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS 또는 기타: 수동 안내 모달
      setShowIosModal(true);
    }
  }, [deferredPrompt]);

  // 특정 페이지에서 배너 숨김
  const hiddenPaths = ["/listings", "/login", "/register", "/verify"];
  if (hiddenPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  if (!showBanner) return null;

  return (
    <>
      {/* 설치 안내 배너 */}
      <div
        className="fixed bottom-14 left-0 right-0 z-40 border-t border-gray-100 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="banner"
        aria-label="앱 설치 안내"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* 아이콘 */}
          <Image
            src="/logos/krw_shop_favicon.png"
            alt="권리샵"
            width={36}
            height={36}
            className="shrink-0 rounded-lg"
          />

          {/* 텍스트 */}
          <p className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-gray-800">
            권리샵을 홈 화면에
            <br />
            추가하세요
          </p>

          {/* 추가하기 버튼 */}
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-lg bg-[#1B3A5C] px-3.5 py-2 text-[13px] font-semibold text-white active:bg-[#15304D]"
          >
            추가하기
          </button>

          {/* 닫기 버튼 */}
          <button
            onClick={handleDismiss}
            className="shrink-0 p-1 text-gray-400 active:text-gray-600"
            aria-label="닫기"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* iOS 안내 모달 */}
      {showIosModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 md:hidden"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl bg-white px-6 pb-8 pt-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 핸들바 */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-300" />

            <h3 className="text-center text-lg font-bold text-gray-900">
              홈 화면에 추가하기
            </h3>

            <div className="mt-6 space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B3A5C] text-sm font-bold text-white">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {isIos
                      ? "하단 공유 버튼을 탭하세요"
                      : "브라우저 메뉴(⋮)를 탭하세요"}
                  </p>
                  {isIos && (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#1B3A5C"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      <span className="text-xs text-gray-600">
                        공유 버튼
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B3A5C] text-sm font-bold text-white">
                  2
                </span>
                <p className="text-sm font-medium text-gray-800">
                  &quot;홈 화면에 추가&quot;를 선택하세요
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="mt-6 w-full rounded-xl bg-[#1B3A5C] py-3 text-sm font-bold text-white active:bg-[#15304D]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
