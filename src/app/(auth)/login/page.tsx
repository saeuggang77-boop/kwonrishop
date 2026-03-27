"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";

const VALUE_PROPS = [
  { icon: "🔍", label: "예비창업자", desc: "검증된 매물로 똑똑한 창업" },
  { icon: "🏪", label: "사장님", desc: "수수료 없는 직거래" },
  { icon: "🏢", label: "프랜차이즈", desc: "예비 가맹점주에게 브랜드 홍보" },
  { icon: "🔧", label: "협력업체", desc: "창업 전문 서비스 연결" },
];

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");
  const verified = searchParams.get("verified") === "true";
  const reset = searchParams.get("reset") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setShowResend(false);

    const result = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (result.error === "EMAIL_NOT_VERIFIED") {
        setError("이메일 인증이 완료되지 않았습니다. 인증 메일을 확인해주세요.");
        setShowResend(true);
      } else {
        setError(result.error);
      }
    } else if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleResendVerification() {
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendSuccess(true);
      } else {
        setError(data.error || "재발송에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">권리샵</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">상가직거래 플랫폼</p>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {VALUE_PROPS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5"
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.label}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Success Banners */}
        {verified && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 text-center">
            이메일 인증이 완료되었습니다. 로그인해주세요!
          </div>
        )}
        {reset && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 text-center">
            비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.
          </div>
        )}

        {/* Error Banners */}
        {errorParam === "InvalidToken" && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center">
            유효하지 않은 인증 링크입니다.
          </div>
        )}
        {errorParam === "TokenExpired" && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300 text-center">
            인증 링크가 만료되었습니다. 다시 시도해주세요.
          </div>
        )}
        {errorParam && !["InvalidToken", "TokenExpired", "RateLimit"].includes(errorParam) && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center">
            로그인에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-5">로그인 / 회원가입</h2>

          {/* Social Login */}
          <div className="space-y-2.5">
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

          <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 mt-2.5">
            소셜 로그인은 별도 가입 없이 바로 시작됩니다
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">또는 이메일로 로그인</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                <p>{error}</p>
                {showResend && !resendSuccess && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? "발송 중..." : "인증 메일 재발송"}
                  </button>
                )}
                {resendSuccess && (
                  <p className="mt-2 text-sm text-green-600 dark:text-green-400">인증 메일이 재발송되었습니다.</p>
                )}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "로그인 중..." : "이메일로 로그인"}
            </button>
          </form>

          {/* Signup Link */}
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
              이메일로 회원가입
            </Link>
          </p>
        </div>

        {/* Footer Links */}
        <p className="mt-5 text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
          로그인 시{" "}
          <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">개인정보처리방침</Link>에
          동의합니다.
        </p>
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
