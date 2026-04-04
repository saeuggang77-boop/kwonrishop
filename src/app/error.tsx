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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-2xl">
          !
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          오류가 발생했습니다
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          일시적인 문제가 발생했습니다. 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-navy-700 text-white rounded-lg font-medium hover:bg-navy-600 transition-colors text-sm"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
