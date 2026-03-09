"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function FailContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("message") || "결제에 실패했습니다.";
  const errorCode = searchParams.get("code");

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
        <p className="text-gray-700 mb-2">{errorMessage}</p>
        {errorCode && (
          <p className="text-xs text-gray-500 mb-6">오류 코드: {errorCode}</p>
        )}

        <div className="flex gap-3 mt-6">
          <Link
            href="/pricing"
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            다시 시도
          </Link>
          <Link
            href="/listings"
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            홈으로
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-2">
          문제가 계속되면 고객센터로 문의해주세요
        </p>
        <a
          href="mailto:support@kwonrishop.com"
          className="text-blue-600 text-sm hover:underline"
        >
          support@kwonrishop.com
        </a>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4" />
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      }
    >
      <FailContent />
    </Suspense>
  );
}
