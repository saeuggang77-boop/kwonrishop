"use client";

import { useState, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import PushPromptCard from "@/components/PushPromptCard";

type RoleOption = {
  value: "BUYER" | "SELLER" | "FRANCHISE" | "PARTNER";
  label: string;
  description: string;
  note?: string;
  popular?: boolean;
  iconColor: string;
  hoverBorder: string;
  iconBg: string;
  icon: React.ReactNode;
};

const SearchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
  </svg>
);

const WrenchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ChevronRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);

const roles: RoleOption[] = [
  {
    value: "BUYER",
    label: "예비창업자",
    description: "매물을 찾고 창업을 준비하고 있어요",
    popular: true,
    iconColor: "text-green-500",
    hoverBorder: "hover:border-green-500",
    iconBg: "bg-gradient-to-br from-green-50 to-green-100",
    icon: <SearchIcon />,
  },
  {
    value: "SELLER",
    label: "사장님",
    description: "내 매물을 등록하고 싶어요",
    note: "사업자인증 필요",
    iconColor: "text-green-500",
    hoverBorder: "hover:border-green-500",
    iconBg: "bg-gradient-to-br from-green-50 to-green-100",
    icon: <HomeIcon />,
  },
  {
    value: "FRANCHISE",
    label: "프랜차이즈 본사",
    description: "우리 브랜드를 홍보하고 싶어요",
    note: "사업자인증 + 공정위 매칭",
    iconColor: "text-amber-500",
    hoverBorder: "hover:border-amber-500",
    iconBg: "bg-gradient-to-br from-orange-50 to-orange-100",
    icon: <BuildingIcon />,
  },
  {
    value: "PARTNER",
    label: "협력업체",
    description: "창업 관련 서비스를 제공해요",
    note: "사업자인증 필요",
    iconColor: "text-green-600",
    hoverBorder: "hover:border-green-500",
    iconBg: "bg-gradient-to-br from-green-50 to-green-100",
    icon: <WrenchIcon />,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-green-50/50 to-slate-50">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    router.replace("/login?callbackUrl=/select-role");
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
        // JWT 쿠키 갱신 대기
        await new Promise(resolve => setTimeout(resolve, 500));

        // 가입 직후 푸시 알림 권한 모달 노출 플래그
        if (typeof window !== "undefined") {
          localStorage.setItem("push-prompt-pending", "true");
        }

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-green-50/50 to-slate-50 px-4 py-8">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3.5 py-1.5 rounded-full text-xs font-semibold text-green-700 mb-4">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            STEP 1 / 2
          </div>
          <h1 className="text-[26px] font-black text-gray-900 tracking-tight">
            어떤 목적으로 오셨나요?
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            역할에 맞는 최적의 기능을 제공해 드립니다
          </p>

          {callbackUrl === "/sell" && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 text-center">
                매물을 등록하려면 <strong>사장님</strong> 역할을 선택해주세요
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
            <p>{error}</p>
            {error.includes("계정을 찾을 수 없습니다") && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="mt-3 inline-flex items-center gap-1.5 bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                로그아웃 후 다시 로그인
              </button>
            )}
          </div>
        )}

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => handleSelectRole(role.value)}
              disabled={loading}
              className={`
                relative bg-white rounded-2xl p-5 text-left
                border-2 border-transparent
                shadow-sm shadow-black/[0.03]
                transition-all
                ${loading ? "opacity-50 cursor-not-allowed" : `${role.hoverBorder} cursor-pointer hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]`}
              `}
            >
              {role.popular && (
                <span className="absolute -top-px right-4 bg-green-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-b-lg">
                  가장 많이 선택
                </span>
              )}

              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${role.iconBg}`}>
                {role.icon}
              </div>

              <h3 className="text-[15px] font-extrabold text-gray-900 mb-1">
                {role.label}
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {role.description}
              </p>

              {role.note && (
                <div className="inline-flex items-center gap-1 text-xs text-gray-400 mt-2.5 bg-gray-50 border border-line px-2.5 py-1 rounded-md">
                  <ShieldIcon />
                  {role.note}
                </div>
              )}

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight />
              </span>
            </button>
          ))}
        </div>

        {/* 푸시 알림 권한 유도 카드 (가입 직후 자연스러운 시점) */}
        <div className="mt-6">
          <PushPromptCard
            accentColor="green"
            customTitle="매물 문의 즉시 알림 받기"
            customDescription="채팅·댓글·결제, 1초라도 빠른 응답이 거래로 이어집니다"
          />
        </div>

        {/* Footer */}
        <div className="mt-5 flex flex-col items-center gap-1.5">
          <div className="inline-flex items-center gap-1.5 text-[13px] text-gray-500">
            <RefreshIcon />
            역할 변경이 필요하면 마이페이지 &gt; 사업자인증에서 진행할 수 있습니다
          </div>
          <p className="text-xs text-gray-300">
            선택한 역할에 따라 이용 가능한 기능이 달라집니다
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-green-50/50 to-slate-50">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    }>
      <SelectRoleContent />
    </Suspense>
  );
}
