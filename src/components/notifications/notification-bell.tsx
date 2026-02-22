"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  sourceType?: string;
}

function sourceTypeEmoji(sourceType?: string): string {
  switch (sourceType) {
    case "comment":
    case "comment_reply":
      return "\uD83D\uDCAC";
    case "like":
      return "\u2764\uFE0F";
    case "inquiry":
      return "\uD83D\uDCE9";
    case "grade_upgrade":
      return "\uD83D\uDEE1\uFE0F";
    default:
      return "\uD83D\uDD14";
  }
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "방금 전";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

// ─── Module-level fetch deduplication (여러 인스턴스 중복 호출 방지) ───
let _cachedCounts: { unread: number; inquiry: number } | null = null;
let _pendingFetch: Promise<{ unread: number; inquiry: number }> | null = null;
let _lastFetchAt = 0;
const DEDUP_WINDOW_MS = 5000;

async function fetchCountsShared(): Promise<{ unread: number; inquiry: number }> {
  const now = Date.now();
  if (_pendingFetch && now - _lastFetchAt < DEDUP_WINDOW_MS) {
    return _pendingFetch;
  }
  _lastFetchAt = now;
  _pendingFetch = (async () => {
    try {
      const [notifRes, inquiryRes] = await Promise.allSettled([
        fetch("/api/notifications?limit=1&unread=true"),
        fetch("/api/inquiries/unread-count"),
      ]);
      const unread =
        notifRes.status === "fulfilled" && notifRes.value.ok
          ? ((await notifRes.value.json()).meta?.unreadCount ?? 0)
          : (_cachedCounts?.unread ?? 0);
      const inquiry =
        inquiryRes.status === "fulfilled" && inquiryRes.value.ok
          ? ((await inquiryRes.value.json()).unreadCount ?? 0)
          : (_cachedCounts?.inquiry ?? 0);
      _cachedCounts = { unread, inquiry };
      return _cachedCounts;
    } catch {
      return _cachedCounts ?? { unread: 0, inquiry: 0 };
    }
  })();
  return _pendingFetch;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [inquiryUnreadCount, setInquiryUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const totalCount = unreadCount + inquiryUnreadCount;

  // Fetch unread counts (module-level 중복 제거)
  useEffect(() => {
    let mounted = true;

    async function refresh() {
      const counts = await fetchCountsShared();
      if (mounted) {
        setUnreadCount(counts.unread);
        setInquiryUnreadCount(counts.inquiry);
      }
    }

    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Fetch recent notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? data.data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  function handleToggle() {
    setIsOpen((prev) => !prev);
  }

  function handleMarkAllRead() {
    // Fire-and-forget
    fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function handleNotificationClick(notification: Notification) {
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-1 text-gray-600 hover:text-navy cursor-pointer"
        aria-label="알림"
      >
        <Bell className="h-5 w-5" />
        {totalCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">알림</h3>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-navy hover:text-navy/80 cursor-pointer"
            >
              <Check className="h-3 w-3" />
              모두 읽음
            </button>
          </div>

          {/* Notifications list */}
          <div className="divide-y divide-gray-50">
            {loadingNotifications ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                불러오는 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                알림이 없습니다
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? "border-l-2 border-l-navy" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {sourceTypeEmoji(notification.sourceType)} {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {relativeTime(notification.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Separator & Footer links */}
          <div className="border-t border-gray-100">
            {inquiryUnreadCount > 0 && (
              <Link
                href="/my/inquiries"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2.5 text-sm text-navy hover:bg-gray-50 transition-colors"
              >
                새 문의 {inquiryUnreadCount}건
              </Link>
            )}
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2.5 text-center text-sm font-medium text-navy hover:bg-gray-50 transition-colors rounded-b-xl"
            >
              전체 알림 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
