"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CompareIcon } from "@/components/listings/compare-icon";

export function AuthNavItems() {
  const { data: session, status } = useSession();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      const timer = setTimeout(() => setLoadingTimeout(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (status === "loading" && !loadingTimeout) {
    return <div className="h-9 w-16 animate-pulse rounded-lg bg-gray-100" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <CompareIcon />
        <Link href="/login" className="text-sm text-gray-600 hover:text-navy">
          로그인
        </Link>
        <Link href="/register" className="text-sm font-medium text-mint hover:text-mint-dark">
          회원가입
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <CompareIcon />
      <NotificationBell />
      {(session.user.role === "SELLER" || session.user.role === "ADMIN") && (
        <Link href="/listings/new" className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint-dark">
          점포 등록
        </Link>
      )}
      <Link href="/dashboard" className="text-sm text-gray-600 hover:text-navy">
        대시보드
      </Link>
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className="text-sm text-gray-600 hover:text-navy">
          관리자
        </Link>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        로그아웃
      </button>
    </div>
  );
}
