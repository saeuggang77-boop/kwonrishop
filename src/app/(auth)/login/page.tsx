"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(
    error === "CredentialsSignin" ? "이메일 또는 비밀번호가 올바르지 않습니다." : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setErrorMsg("이메일 또는 비밀번호가 올바르지 않습니다.");
      setIsLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleOAuth = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-center font-heading text-2xl font-bold text-navy">
        로그인
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        권리샵에 오신 것을 환영합니다
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
        <span className="text-xs text-gray-500">또는</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMsg && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">
            {errorMsg}
          </div>
        )}

        <Input
          label="이메일"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          label="비밀번호"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 입력"
        />

        <Button type="submit" loading={isLoading} size="lg" className="w-full bg-accent hover:bg-accent-dark">
          이메일로 로그인
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        아직 계정이 없으신가요?{" "}
        <Link href="/register" className="font-medium text-navy hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm animate-pulse h-96" />}>
      <LoginForm />
    </Suspense>
  );
}
