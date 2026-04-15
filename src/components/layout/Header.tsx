"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  createdAt: string;
  read: boolean;
}

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      fetchNotifications();
      fetchChatUnread();
    }
  }, [status]);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=5");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }

  async function fetchChatUnread() {
    try {
      const res = await fetch("/api/chat/unread");
      const data = await res.json();
      setChatUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch chat unread count", err);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  }

  function timeAgo(date: string) {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  }

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-line">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Logo size="md" />

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600" aria-label="주요 메뉴">
          <Link
            href="/listings"
            className={`hover:text-green-700 outline-none transition-colors relative pb-1 ${
              pathname === "/listings" ? "text-green-700" : ""
            }`}
            aria-current={pathname === "/listings" ? "page" : undefined}
          >
            매물검색
            {pathname === "/listings" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700" />
            )}
          </Link>
          <Link
            href="/franchise"
            className={`hover:text-green-700 outline-none transition-colors relative pb-1 ${
              pathname === "/franchise" ? "text-green-700" : ""
            }`}
            aria-current={pathname === "/franchise" ? "page" : undefined}
          >
            프랜차이즈
            {pathname === "/franchise" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700" />
            )}
          </Link>
          <Link
            href="/partners"
            className={`hover:text-green-700 outline-none transition-colors relative pb-1 ${
              pathname === "/partners" ? "text-green-700" : ""
            }`}
            aria-current={pathname === "/partners" ? "page" : undefined}
          >
            협력업체
            {pathname === "/partners" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700" />
            )}
          </Link>
          <Link
            href="/equipment"
            className={`hover:text-green-700 outline-none transition-colors relative pb-1 ${
              pathname === "/equipment" ? "text-green-700" : ""
            }`}
            aria-current={pathname === "/equipment" ? "page" : undefined}
          >
            집기장터
            {pathname === "/equipment" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700" />
            )}
          </Link>
          <Link
            href="/community"
            className={`hover:text-green-700 outline-none transition-colors relative pb-1 ${
              pathname === "/community" ? "text-green-700" : ""
            }`}
            aria-current={pathname === "/community" ? "page" : undefined}
          >
            커뮤니티
            {pathname === "/community" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700" />
            )}
          </Link>
          {session && (
            <Link
              href="/chat"
              className={`hover:text-green-700 outline-none transition-colors relative pb-1 ${
                pathname === "/chat" ? "text-green-700" : ""
              }`}
              aria-current={pathname === "/chat" ? "page" : undefined}
            >
              채팅
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full inline-flex items-center justify-center">
                  {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                </span>
              )}
              {pathname === "/chat" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-700" />
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
          ) : session ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-3 text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}건` : "알림"}
                  aria-expanded={notifOpen}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center" aria-label={`읽지 않은 알림 ${unreadCount}개`}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0"
                      onClick={() => setNotifOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto" role="menu">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">알림</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-green-700 hover:text-green-600"
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-gray-400 text-center">
                          알림이 없습니다
                        </p>
                      ) : (
                        <>
                          {notifications.map((notif) => (
                            <Link
                              key={notif.id}
                              href={notif.link || "#"}
                              onClick={() => setNotifOpen(false)}
                              className={`block px-4 py-3 hover:bg-gray-50 border-b border-gray-50 ${
                                !notif.read ? "bg-green-50/50" : ""
                              }`}
                            >
                              <p className="text-sm font-medium text-gray-900">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {timeAgo(notif.createdAt)}
                              </p>
                            </Link>
                          ))}
                          <Link
                            href="/notifications"
                            onClick={() => setNotifOpen(false)}
                            className="block px-4 py-2 text-center text-sm font-medium text-green-700 hover:text-green-600 border-t border-gray-100"
                          >
                            모든 알림 보기
                          </Link>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                aria-expanded={menuOpen}
                aria-label="사용자 메뉴"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={`${session.user.name || '사용자'} 프로필 사진`}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                    {session.user.name?.[0] || "U"}
                  </div>
                )}
                <span className="hidden sm:inline">
                  {session.user.name || "사용자"}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50" role="menu">
                    {session.user.role === "ADMIN" ? (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        관리자페이지
                      </Link>
                    ) : (
                      <Link
                        href="/sell"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        매물등록
                      </Link>
                    )}
                    <Link
                      href="/mypage"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-600 transition-colors"
            >
              로그인
            </Link>
          )}

          {/* 모바일 메뉴 버튼 */}
          <button
            className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="모바일 메뉴"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-14 left-0 right-0 bg-white border-b border-gray-200 z-50 md:hidden">
            <nav className="px-4 py-3 space-y-1">
              <Link
                href="/listings"
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                매물검색
              </Link>
              <Link
                href="/franchise"
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                프랜차이즈
              </Link>
              <Link
                href="/partners"
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                협력업체
              </Link>
              <Link
                href="/equipment"
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                집기장터
              </Link>
              <Link
                href="/community"
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                커뮤니티
              </Link>
              {session && (
                <>
                  <Link
                    href="/chat"
                    className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>채팅</span>
                    {chatUnreadCount > 0 && (
                      <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full inline-flex items-center justify-center">
                        {chatUnreadCount > 9 ? "9+" : chatUnreadCount}
                      </span>
                    )}
                  </Link>
                  <hr className="my-2 border-gray-200" />
                  {session.user.role === "ADMIN" ? (
                    <Link
                      href="/admin"
                      className="block px-4 py-3 text-sm font-bold text-blue-600 hover:bg-gray-50 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      관리자페이지
                    </Link>
                  ) : (
                    <Link
                      href="/sell"
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      매물등록
                    </Link>
                  )}
                  <Link
                    href="/mypage"
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    마이페이지
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-gray-50 rounded-lg"
                  >
                    로그아웃
                  </button>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
