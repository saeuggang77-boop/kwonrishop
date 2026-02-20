"use client";

import { useEffect } from "react";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MainError boundary]", error.message, error.stack);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy/10">
          <span className="text-3xl text-navy">!</span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-navy">오류가 발생했습니다</h2>
        <p className="mt-2 text-sm text-gray-500">
          페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-gray-400">오류 코드: {error.digest}</p>
        )}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 max-w-md rounded-lg bg-red-50 p-3 text-left">
            <p className="text-xs font-bold text-red-700">{error.name}: {error.message}</p>
            <pre className="mt-1 max-h-32 overflow-auto text-[10px] text-red-500">
              {error.stack}
            </pre>
          </div>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-dark"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
