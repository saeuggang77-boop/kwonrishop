"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

const PASSWORD_CATEGORY_RULES = [
  { label: "영문", test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "숫자", test: (p: string) => /[0-9]/.test(p) },
  { label: "특수문자", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"|,.<>?/~`]/.test(p) },
];

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const passedCategories = PASSWORD_CATEGORY_RULES.filter((r) => r.test(password));
  const lengthOk = password.length >= 8;
  const allRulesPassed = lengthOk && passedCategories.length >= 2;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!allRulesPassed) {
      setError("비밀번호는 8자 이상, 영문/숫자/특수문자 중 2종 이상 조합이어야 합니다.");
      return;
    }
    if (!passwordsMatch) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError("이용약관과 개인정보처리방침에 동의해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.toLowerCase(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "회원가입에 실패했습니다.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });
      if (res.ok) {
        setResendSuccess(true);
      }
    } catch {
      // silent fail
    } finally {
      setResendLoading(false);
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">인증 이메일이 발송되었습니다</h2>
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-medium text-gray-900">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              메일함을 확인하고 인증 링크를 클릭해주세요.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={resendLoading || resendSuccess}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
              >
                {resendSuccess ? "재발송 완료" : resendLoading ? "발송 중..." : "인증 메일 재발송"}
              </button>
              <Link
                href="/login"
                className="block w-full py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm text-center"
              >
                로그인 페이지로
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">권리샵</h1>
          <p className="mt-1 text-gray-500">회원가입</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Social Login */}
          <div className="space-y-2.5 mb-5">
            <button
              onClick={() => signIn("kakao", { callbackUrl: "/" })}
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
              onClick={() => signIn("naver", { callbackUrl: "/" })}
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

            <p className="text-center text-[11px] text-gray-400 mt-2">
              소셜 로그인은 별도 가입 없이 바로 시작됩니다
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 shrink-0">또는 이메일로 회원가입</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                autoComplete="name"
                className="w-full px-4 py-3.5 min-h-[44px] border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                className="w-full px-4 py-3.5 min-h-[44px] border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 min-h-[44px] pr-12 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 -m-2"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  )}
                </button>
              </div>

              {/* Password Strength */}
              {password.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      lengthOk
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {lengthOk ? "✓" : "○"} 8자 이상
                  </span>
                  {PASSWORD_CATEGORY_RULES.map((rule) => {
                    const passed = rule.test(password);
                    return (
                      <span
                        key={rule.label}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          passed
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {passed ? "✓" : "○"} {rule.label}
                      </span>
                    );
                  })}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    passedCategories.length >= 2
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {passedCategories.length >= 2 ? "✓" : "○"} 2종 이상 조합
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3.5 min-h-[44px] pr-12 border bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-green-400"
                        : "border-red-400"
                      : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2 -m-2"
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>

            {/* Terms */}
            <div className="space-y-2 pt-2">
              <label className="flex items-start gap-2 cursor-pointer pb-2 border-b border-gray-200">
                <input
                  type="checkbox"
                  checked={agreeTerms && agreePrivacy}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    setAgreePrivacy(e.target.checked);
                  }}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-700 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  전체 동의합니다
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer pl-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-700 focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">
                  <Link href="/terms" className="text-green-700 underline" target="_blank">이용약관</Link> 동의 <span className="text-red-500">(필수)</span>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer pl-1">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-green-700 focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">
                  <Link href="/privacy" className="text-green-700 underline" target="_blank">개인정보처리방침</Link> 동의 <span className="text-red-500">(필수)</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-medium text-green-700 hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
