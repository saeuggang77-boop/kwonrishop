"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const errorParam = searchParams.get("error");
  const errorMethod = searchParams.get("method");
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
      // ADMIN 역할이면 관리자페이지로 리다이렉트
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push(callbackUrl);
        }
      } catch {
        router.push(callbackUrl);
      }
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
    <div className="min-h-screen flex items-center justify-center bg-cream px-4 py-10 relative overflow-hidden">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-terra-500/5 blur-3xl" />
      <div aria-hidden className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-green-700/5 blur-3xl" />
      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-3">
            <Logo size="lg" href={null} />
          </div>
          <p className="text-xs text-muted tracking-wide">상가 직거래 플랫폼</p>
        </div>

        {/* Success Banners */}
        {verified && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
            이메일 인증이 완료되었습니다. 로그인해주세요!
          </div>
        )}
        {reset && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 text-center">
            비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.
          </div>
        )}

        {/* Error Banners */}
        {errorParam === "InvalidToken" && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            유효하지 않은 인증 링크입니다.
          </div>
        )}
        {errorParam === "TokenExpired" && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 text-center">
            인증 링크가 만료되었습니다. 다시 시도해주세요.
          </div>
        )}
        {errorParam === "OAuthAccountNotLinked" && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 text-center">
            <p className="font-medium mb-1">이미 다른 방법으로 가입된 이메일입니다</p>
            <p className="text-xs text-orange-600">
              해당 이메일은 <span className="font-semibold">{errorMethod || "다른 방법"}</span>으로 가입되어 있습니다.
              기존 방법으로 로그인해주세요.
            </p>
          </div>
        )}
        {errorParam === "WithdrawnAccount" && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            <p className="font-medium mb-1">탈퇴된 계정입니다</p>
            <p className="text-xs text-red-500">
              해당 계정은 이미 탈퇴 처리되었습니다. 새로 가입해주세요.
            </p>
          </div>
        )}
        {errorParam === "BannedAccount" && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            <p className="font-medium mb-1">이용이 중지된 계정입니다</p>
            <p className="text-xs text-red-500">
              해당 계정은 강제탈퇴 처리되었습니다. 고객센터에 문의해주세요.
            </p>
          </div>
        )}
        {errorParam && !["InvalidToken", "TokenExpired", "RateLimit", "OAuthAccountNotLinked", "WithdrawnAccount", "BannedAccount"].includes(errorParam) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            로그인에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        {/* Main Card */}
        <div className="bg-cream rounded-3xl shadow-[0_8px_32px_rgba(31,63,46,0.08)] border border-line p-8">
          <h2 className="text-2xl font-extrabold text-green-700 tracking-tight mb-1">
            돌아오신 걸 <span className="font-light text-terra-500">환영</span>해요
          </h2>
          <p className="text-sm text-muted mb-6">권리샵에 로그인해주세요</p>

          {/* Social Login */}
          <div className="space-y-2.5">
            <button
              onClick={() => signIn("kakao", { callbackUrl })}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-[15px] text-[#191919] bg-[#FEE500] hover:bg-[#FDD800] active:scale-[0.98] transition-all"
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
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-[15px] text-white bg-[#03C75A] hover:bg-[#02b351] active:scale-[0.98] transition-all"
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

          <p className="text-center text-xs text-muted mt-3">
            소셜 로그인은 별도 가입 없이 바로 시작됩니다
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-muted shrink-0">또는 이메일로 로그인</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <p>{error}</p>
                {showResend && !resendSuccess && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="mt-2 text-sm font-medium text-green-700 hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? "발송 중..." : "인증 메일 재발송"}
                  </button>
                )}
                {resendSuccess && (
                  <p className="mt-2 text-sm text-green-600">인증 메일이 재발송되었습니다.</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[13px] font-semibold text-gray-600 mb-1.5">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                className="w-full px-4 py-3.5 min-h-[44px] border border-line bg-cream-elev text-ink rounded-2xl focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:bg-cream outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-semibold text-gray-600 mb-1.5">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                className="w-full px-4 py-3.5 min-h-[44px] border border-line bg-cream-elev text-ink rounded-2xl focus:ring-2 focus:ring-green-700/20 focus:border-green-700 focus:bg-cream outline-none text-sm transition-all"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[13px] text-muted cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-green-700 rounded" />
                로그인 유지
              </label>
              <Link
                href="/forgot-password"
                className="text-[13px] text-green-700 font-semibold hover:text-terra-500 transition-colors"
              >
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-green-700 text-cream rounded-full font-bold text-[15px] hover:bg-green-800 active:scale-[0.98] transition-all disabled:bg-line-deep disabled:cursor-not-allowed"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* Signup Link */}
          <p className="mt-6 text-center text-sm text-muted">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="font-bold text-terra-500 hover:text-terra-600 underline underline-offset-4 decoration-terra-300">
              회원가입
            </Link>
          </p>
        </div>

        {/* Footer Links */}
        <p className="mt-6 text-xs text-muted text-center leading-relaxed">
          로그인 시{" "}
          <Link href="/terms" className="underline hover:text-green-700">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline hover:text-green-700">개인정보처리방침</Link>에
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
