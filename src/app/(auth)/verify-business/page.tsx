"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VerifyBusinessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    businessNumber: "",
    representativeName: "",
    openDate: "",
    businessName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/login?callbackUrl=/verify-business");
    return null;
  }

  function formatBusinessNumber(value: string) {
    const nums = value.replace(/\D/g, "").slice(0, 10);
    if (nums.length <= 3) return nums;
    if (nums.length <= 5) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 5)}-${nums.slice(5)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/business-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessNumber: form.businessNumber,
          representativeName: form.representativeName,
          openDate: form.openDate.replace(/-/g, ""),
          businessName: form.businessName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">인증 완료</h2>
          <p className="text-gray-500 mb-6">
            사업자인증이 완료되었습니다.<br />
            이제 매물을 등록할 수 있습니다.
          </p>
          <div className="space-y-2">
            <Link
              href="/sell"
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              매물 등록하기
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">사업자인증</h1>
          <p className="mt-1 text-sm text-gray-500">
            매물을 등록하려면 사업자인증이 필요합니다
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사업자등록번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="000-00-00000"
              value={form.businessNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  businessNumber: formatBusinessNumber(e.target.value),
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대표자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="홍길동"
              value={form.representativeName}
              onChange={(e) =>
                setForm({ ...form, representativeName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              개업일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.openDate}
              onChange={(e) => setForm({ ...form, openDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상호명 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              placeholder="상호명을 입력하세요"
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "인증 중..." : "사업자 인증하기"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            국세청 사업자등록 진위확인 API를 통해 인증됩니다
          </p>
        </form>
      </div>
    </div>
  );
}
