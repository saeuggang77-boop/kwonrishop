"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // 상세 페이지 및 특정 페이지에서 BottomNav 숨기기
  const hideOnPaths = ['/chat', '/payments', '/sell'];
  const hideOnDetailPaths = ['/listings/', '/equipment/', '/partners/'];

  const shouldHide = hideOnPaths.some(p => pathname.startsWith(p)) ||
    hideOnDetailPaths.some(p => pathname.startsWith(p) && pathname !== p.slice(0, -1));

  if (shouldHide) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-16 pb-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {/* 홈 */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] ${
            isActive("/") && pathname === "/" ? "text-blue-600" : "text-gray-400"
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
          <span className="text-[10px] mt-0.5 font-medium">홈</span>
        </Link>

        {/* 매물 */}
        <Link
          href="/listings"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] ${
            isActive("/listings") ? "text-blue-600" : "text-gray-400"
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
          <span className="text-[10px] mt-0.5 font-medium">매물</span>
        </Link>

        {/* 등록 (FAB 스타일) */}
        <Link
          href="/sell"
          className="flex flex-col items-center justify-center -mt-6"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <span className="text-[10px] mt-1 font-medium text-gray-600 dark:text-gray-400">등록</span>
        </Link>

        {/* 채팅 */}
        <Link
          href="/chat"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] relative ${
            isActive("/chat") ? "text-blue-600" : "text-gray-400"
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
          {/* 미읽음 뱃지 (UI만) */}
          <span className="absolute top-0 right-2 w-2 h-2 bg-red-500 rounded-full hidden" />
          <span className="text-[10px] mt-0.5 font-medium">채팅</span>
        </Link>

        {/* MY */}
        <Link
          href="/mypage"
          className={`flex flex-col items-center justify-center flex-1 min-w-[44px] min-h-[44px] ${
            isActive("/mypage") ? "text-blue-600" : "text-gray-400"
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
          <span className="text-[10px] mt-0.5 font-medium">MY</span>
        </Link>
      </div>
    </nav>
  );
}
