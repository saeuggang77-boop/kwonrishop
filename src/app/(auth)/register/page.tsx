"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "BUYER" as "BUYER" | "SELLER",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (form.password.length < 8) {
      setErrorMsg("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setErrorMsg("이용약관과 개인정보 수집·이용에 모두 동의해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: form.role,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "회원가입에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setErrorMsg("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-center font-heading text-2xl font-bold text-navy">
        회원가입
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        권리샵과 함께 안전한 부동산 거래를 시작하세요
      </p>

      {/* OAuth Buttons */}
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => handleOAuth("kakao")}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#191919] transition-all duration-150 hover:bg-[#FDD800] active:scale-[0.97]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold">K</span>
          카카오로 시작하기
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("naver")}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#03C75A] px-4 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-[#02b351] active:scale-[0.97]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold">N</span>
          네이버로 시작하기
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 active:scale-[0.97]"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-blue-500">G</span>
          Google로 시작하기
        </button>
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-500">또는 이메일로 가입</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMsg && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {errorMsg}
          </div>
        )}

        <Input
          label="이름"
          type="text"
          required
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="홍길동"
        />

        <Input
          label="이메일"
          type="email"
          required
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          label="전화번호"
          type="tel"
          required
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="010-1234-5678"
        />

        <Input
          label="비밀번호"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          placeholder="8자 이상"
        />

        <Input
          label="비밀번호 확인"
          type="password"
          required
          value={form.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
          placeholder="비밀번호 재입력"
        />

        {/* Role Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-navy">
            가입 유형
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateField("role", "BUYER")}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-150 ${
                form.role === "BUYER"
                  ? "border-mint bg-mint/5 text-mint"
                  : "border-gray-300 text-gray-500 hover:border-gray-400"
              }`}
            >
              임차인
            </button>
            <button
              type="button"
              onClick={() => updateField("role", "SELLER")}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-150 ${
                form.role === "SELLER"
                  ? "border-mint bg-mint/5 text-mint"
                  : "border-gray-300 text-gray-500 hover:border-gray-400"
              }`}
            >
              임대인
            </button>
          </div>
        </div>

        {/* Terms Checkboxes */}
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 accent-mint"
            />
            <span className="text-sm text-gray-700">
              <Link href="/legal/terms" target="_blank" className="font-medium text-mint hover:underline">
                이용약관
              </Link>
              에 동의합니다 (필수)
            </span>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 accent-mint"
            />
            <span className="text-sm text-gray-700">
              <Link href="/legal/privacy" target="_blank" className="font-medium text-mint hover:underline">
                개인정보 수집·이용
              </Link>
              에 동의합니다 (필수)
            </span>
          </label>
        </div>

        <Button type="submit" loading={isLoading} size="lg" className="mt-2 w-full">
          회원가입
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-mint hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
