"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyBusinessContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role") as "SELLER" | "FRANCHISE" | "PARTNER" | null;

  const [form, setForm] = useState({
    businessNumber: "",
    representativeName: "",
    openDate: "",
    businessName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [matchedBrandId, setMatchedBrandId] = useState<string | null>(null);

  // 역할별 메시지
  const roleMessages = {
    SELLER: "사장님으로 매물을 등록하려면 사업자인증이 필요합니다",
    FRANCHISE: "프랜차이즈 본사 인증을 위해 사업자등록이 필요합니다",
    PARTNER: "협력업체 등록을 위해 사업자인증이 필요합니다",
  };

  const roleMessage = requestedRole && roleMessages[requestedRole]
    ? roleMessages[requestedRole]
    : "매물을 등록하려면 사업자인증이 필요합니다";

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
          requestedRole: requestedRole || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      if (data.franchiseBrandId) {
        setMatchedBrandId(data.franchiseBrandId);
      }
      await update();
      setSuccess(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 역할별 성공 후 리다이렉트 URL
  const getSuccessRedirect = () => {
    if (requestedRole === "SELLER") return "/sell";
    if (requestedRole === "FRANCHISE" && matchedBrandId) return `/franchise/${matchedBrandId}`;
    if (requestedRole === "FRANCHISE") return "/franchise";
    if (requestedRole === "PARTNER") return "/partners/register";
    return "/sell";
  };

  if (success) {
    const successRedirect = getSuccessRedirect();
    const buttonText = requestedRole === "FRANCHISE" ? "브랜드 페이지로" :
                       requestedRole === "PARTNER" ? "협력업체 등록하기" :
                       "매물 등록하기";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">인증 완료</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            사업자인증이 완료되었습니다.<br />
            {requestedRole === "FRANCHISE" && "이제 브랜드 페이지를 관리할 수 있습니다."}
            {requestedRole === "PARTNER" && "이제 협력업체로 등록할 수 있습니다."}
            {requestedRole === "SELLER" && "이제 매물을 등록할 수 있습니다."}
            {!requestedRole && "이제 매물을 등록할 수 있습니다."}
          </p>
          <div className="space-y-2">
            <Link
              href={successRedirect}
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {buttonText}
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">사업자인증</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {roleMessage}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              대표자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="홍길동"
              value={form.representativeName}
              onChange={(e) =>
                setForm({ ...form, representativeName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              개업일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.openDate}
              onChange={(e) => setForm({ ...form, openDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              상호명 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              placeholder="상호명을 입력하세요"
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
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

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            국세청 사업자등록 진위확인 API를 통해 인증됩니다
          </p>

          {requestedRole === "FRANCHISE" && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-medium">프랜차이즈 본사 인증 안내</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>공정거래위원회 정보공개서에 등록된 브랜드만 가입 가능합니다</li>
                <li>사업자번호로 브랜드가 자동 매칭됩니다</li>
                <li>인증 완료 후 브랜드 페이지 편집 권한이 부여됩니다</li>
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function VerifyBusinessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    }>
      <VerifyBusinessContent />
    </Suspense>
  );
}
