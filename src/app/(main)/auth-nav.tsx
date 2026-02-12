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
    return <div className="h-9 w-16 animate-pulse rounded-lg bg-white/10" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-4">
        <CompareIcon />
        <Link href="/login" className="text-sm text-white/80 hover:text-accent-light">
          로그인
        </Link>
        <Link href="/register" className="text-sm font-medium text-white hover:text-accent-light">
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
        <Link href="/listings/new" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
          점포 등록
        </Link>
      )}
      <Link href="/dashboard" className="text-sm text-white/80 hover:text-accent-light">
        대시보드
      </Link>
      {session.user.role === "ADMIN" && (
        <Link href="/admin" className="text-sm text-white/80 hover:text-accent-light">
          관리자
        </Link>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
      >
        로그아웃
      </button>
    </div>
  );
}
