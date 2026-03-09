"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">권리샵</h1>
          <p className="mt-2 text-gray-500">상가직거래 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-center mb-6">로그인</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              로그인에 실패했습니다. 다시 시도해주세요.
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => signIn("kakao", { callbackUrl })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-[#191919] bg-[#FEE500] hover:bg-[#FDD800] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3C5.58 3 2 5.79 2 9.25c0 2.2 1.46 4.13 3.65 5.22-.16.56-.58 2.04-.66 2.36-.1.4.15.39.31.28.13-.08 2.04-1.38 2.86-1.95.6.09 1.21.13 1.84.13 4.42 0 8-2.79 8-6.25S14.42 3 10 3Z"
                  fill="#191919"
                />
              </svg>
              카카오로 시작하기
            </button>

            <button
              onClick={() => signIn("naver", { callbackUrl })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white bg-[#03C75A] hover:bg-[#02b351] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M13.16 10.64L6.54 3H3v14h3.84V9.36L13.46 17H17V3h-3.84v7.64Z"
                  fill="white"
                />
              </svg>
              네이버로 시작하기
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
            로그인 시{" "}
            <span className="underline cursor-pointer">이용약관</span> 및{" "}
            <span className="underline cursor-pointer">개인정보처리방침</span>에
            동의합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
