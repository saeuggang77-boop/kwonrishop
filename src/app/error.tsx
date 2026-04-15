"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-cream">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-terra-100 rounded-full flex items-center justify-center">
          <span className="font-serif italic font-light text-4xl text-terra-500">!</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight mb-3">
          잠시 <span className="font-serif italic font-light text-terra-500">문제</span>가 발생했어요
        </h2>
        <p className="text-sm text-muted mb-8">
          일시적인 오류입니다. 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-green-700 text-cream rounded-full font-semibold hover:bg-green-800 transition-colors text-sm"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
