"use client";

import { useRouter, usePathname } from "next/navigation";

interface LockedSectionProps {
  children: React.ReactNode;
  isLocked: boolean;
  message?: string;
  className?: string;
}

export default function LockedSection({
  children,
  isLocked,
  message = "로그인하고 상세 정보 확인하기",
  className = "",
}: LockedSectionProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isLocked) return <>{children}</>;

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div className="blur-[8px] pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 bg-white/85 dark:bg-gray-900/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-navy-100 dark:bg-navy-900 flex items-center justify-center">
          <svg className="w-6 h-6 text-navy-600 dark:text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{message}</p>
        <button
          onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)}
          className="px-6 py-2.5 bg-navy-700 text-white rounded-lg font-medium hover:bg-navy-600 transition-colors text-sm"
        >
          무료 회원가입
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500">3초만에 가입 완료</p>
      </div>
    </div>
  );
}
