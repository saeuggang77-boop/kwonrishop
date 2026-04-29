"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

const PENDING_KEY = "push-prompt-pending";
const SHOWN_KEY = "push-prompt-shown";

export default function PushPermissionPrompt() {
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const pending = localStorage.getItem(PENDING_KEY);
    if (!pending) return;

    // 이미 한 번 본 사용자에게는 다시 띄우지 않음
    if (localStorage.getItem(SHOWN_KEY)) {
      localStorage.removeItem(PENDING_KEY);
      return;
    }

    // 이미 결정한 권한(granted/denied) 사용자에게는 띄우지 않음
    if (Notification.permission !== "default") {
      localStorage.removeItem(PENDING_KEY);
      return;
    }

    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function markShownAndClose() {
    try {
      localStorage.setItem(SHOWN_KEY, String(Date.now()));
      localStorage.removeItem(PENDING_KEY);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  function handleClose() {
    markShownAndClose();
  }

  async function handleEnable() {
    setRequesting(true);
    try {
      const { enablePushNotification } = await import(
        "@/components/PushNotificationManager"
      );
      const result = await enablePushNotification();
      if (result === "granted") {
        toast.success("알림이 활성화됐어요");
      } else if (result === "denied") {
        toast.info("마이페이지에서 언제든 켤 수 있어요");
      }
      // unsupported는 토스트 없이 조용히 닫기
    } finally {
      setRequesting(false);
      markShownAndClose();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/50 backdrop-blur-sm px-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="알림 권한 요청"
    >
      <div
        className="w-full max-w-sm bg-cream rounded-3xl shadow-card-hover border border-line p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-terra-50 flex items-center justify-center mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D96C4F"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-green-700 tracking-tight">
            새 매물 알림을 받아보시겠어요?
          </h2>
          <p className="text-xs text-muted mt-1.5">
            중요한 순간을 놓치지 마세요
          </p>
        </div>

        <ul className="mt-5 space-y-2.5 bg-cream-elev rounded-2xl p-4 border border-line">
          <BenefitRow text="관심 조건과 맞는 새 매물 알림" />
          <BenefitRow text="내 매물에 문의 채팅 도착 시 즉시" />
          <BenefitRow text="거래 진행 상황 실시간 알림" />
        </ul>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            disabled={requesting}
            className="text-sm text-muted hover:text-ink-2 transition-colors px-2 py-2 disabled:opacity-50"
            type="button"
          >
            나중에
          </button>
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="flex-1 px-6 py-3 bg-terra-500 hover:bg-terra-700 text-cream rounded-full font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            type="button"
          >
            {requesting ? "설정 중..." : "알림 받기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function BenefitRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="w-5 h-5 rounded-full bg-green-700 flex items-center justify-center shrink-0 mt-0.5">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FBF8F3"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="text-sm text-ink-2 leading-snug">{text}</span>
    </li>
  );
}
