"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // 30초마다 갱신
      return () => clearInterval(interval);
    }
  }, [status]);

  async function fetchUnreadCount() {
    try {
      const res = await fetch("/api/chat/unread");
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch chat unread count", err);
    }
  }

  // 상세 페이지 및 특정 페이지에서 BottomNav 숨기기
  const hideOnPaths = ['/chat', '/payments', '/sell'];
  const hideOnDetailPaths = ['/listings/', '/equipment/', '/partners/', '/franchise/', '/community/'];

  const shouldHide = hideOnPaths.some(p => pathname.startsWith(p)) ||
    hideOnDetailPaths.some(p => pathname.startsWith(p) && pathname !== p.slice(0, -1));

  if (shouldHide) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-t border-line h-16 pb-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="하단 메뉴"
    >
      <div className="flex items-center justify-around h-full px-2">
        {/* 홈 */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${
            isActive("/") && pathname === "/" ? "text-green-700" : "text-muted"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs mt-0.5 font-medium">홈</span>
        </Link>

        {/* 매물 */}
        <Link
          href="/listings"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${
            isActive("/listings") ? "text-green-700" : "text-muted"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-xs mt-0.5 font-medium">매물</span>
        </Link>

        {/* 커뮤니티 */}
        <Link
          href="/community"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${
            isActive("/community") ? "text-green-700" : "text-muted"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
            />
          </svg>
          <span className="text-xs mt-0.5 font-medium">커뮤니티</span>
        </Link>

        {/* 채팅 */}
        <Link
          href="/chat"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] relative transition-colors ${
            isActive("/chat") ? "text-green-700" : "text-muted"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {/* 미읽음 뱃지 */}
          {unreadCount > 0 && (
            <>
              <span className="absolute top-2 right-[calc(50%-18px)] w-2 h-2 bg-terra-500 rounded-full" aria-hidden="true" />
              <span className="sr-only">읽지 않은 채팅 {unreadCount}건</span>
            </>
          )}
          <span className="text-xs mt-0.5 font-medium">채팅</span>
        </Link>

        {/* MY */}
        <Link
          href="/mypage"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] transition-colors ${
            isActive("/mypage") ? "text-green-700" : "text-muted"
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="text-xs mt-0.5 font-medium">MY</span>
        </Link>
      </div>
    </nav>
  );
}
