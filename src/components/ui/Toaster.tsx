"use client";

import { useEffect, useState } from "react";
import { subscribe, getToasts, dismissToast } from "@/lib/toast";

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const COLORS = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-blue-600",
};

const ICONS = {
  success: "\u2713",
  error: "\u2717",
  info: "\u24D8",
};

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>(getToasts);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${COLORS[t.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in pointer-events-auto`}
          role="alert"
        >
          <span className="font-bold text-sm shrink-0">{ICONS[t.type]}</span>
          <p className="text-sm flex-1">{t.message}</p>
          <button
            onClick={() => dismissToast(t.id)}
            className="text-white/70 hover:text-white shrink-0 ml-2"
            aria-label="닫기"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
