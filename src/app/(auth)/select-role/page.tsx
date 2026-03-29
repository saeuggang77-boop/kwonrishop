"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type RoleOption = {
  value: "BUYER" | "SELLER" | "FRANCHISE" | "PARTNER";
  label: string;
  icon: string;
  description: string;
  note?: string;
  color: string;
  hoverColor: string;
  borderColor: string;
};

const roles: RoleOption[] = [
  {
    value: "BUYER",
    label: "예비창업자",
    icon: "🔍",
    description: "매물을 찾고 창업을 준비하고 있어요",
    color: "bg-blue-50 dark:bg-blue-950",
    hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  {
    value: "SELLER",
    label: "사장님",
    icon: "🏪",
    description: "내 매물을 등록하고 싶어요",
    note: "사업자인증 필요",
    color: "bg-green-50 dark:bg-green-950",
    hoverColor: "hover:bg-green-100 dark:hover:bg-green-900",
    borderColor: "border-green-200 dark:border-green-800",
  },
  {
    value: "FRANCHISE",
    label: "프랜차이즈 본사",
    icon: "🏢",
    description: "우리 브랜드를 홍보하고 싶어요",
    note: "사업자인증 + 공정위 매칭 필요",
    color: "bg-orange-50 dark:bg-orange-950",
    hoverColor: "hover:bg-orange-100 dark:hover:bg-orange-900",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  {
    value: "PARTNER",
    label: "협력업체",
    icon: "🔧",
    description: "창업 관련 서비스를 제공해요",
    note: "사업자인증 필요",
    color: "bg-purple-50 dark:bg-purple-950",
    hoverColor: "hover:bg-purple-100 dark:hover:bg-purple-900",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
];

function SelectRoleContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/login?callbackUrl=/select-role");
    return null;
  }

  async function handleSelectRole(role: string) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "역할 선택에 실패했습니다.");
        setLoading(false);
        return;
      }

      if (data.redirect) {
        await update();

        // callbackUrl이 있고 안전한 경로면 verify-business에 전달
        if (callbackUrl && callbackUrl.startsWith("/")) {
          const redirectUrl = new URL(data.redirect, window.location.origin);
          redirectUrl.searchParams.set("callbackUrl", callbackUrl);
          router.push(redirectUrl.pathname + redirectUrl.search);
        } else {
          router.push(data.redirect);
        }
        router.refresh();
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            환영합니다!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            어떤 목적으로 권리샵을 이용하시나요?
          </p>

          {callbackUrl === "/sell" && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
                매물을 등록하려면 <strong>사장님</strong> 역할을 선택해주세요
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => handleSelectRole(role.value)}
              disabled={loading}
              className={`
                relative p-6 rounded-2xl border-2 transition-all
                ${role.color} ${role.borderColor}
                ${loading ? "opacity-50 cursor-not-allowed" : `${role.hoverColor} cursor-pointer`}
                text-left
              `}
            >
              <div className="text-4xl mb-3">{role.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {role.label}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {role.description}
              </p>
              {role.note && (
                <div className="text-xs text-gray-500 dark:text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded inline-block">
                  {role.note}
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
          선택한 역할에 따라 이용 가능한 기능이 달라집니다
        </p>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    }>
      <SelectRoleContent />
    </Suspense>
  );
}
