"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CompareIcon } from "@/components/listings/compare-icon";
import { ChevronDown, User, LayoutDashboard, Settings, LogOut, Shield } from "lucide-react";

interface AuthNavItemsProps {
  variant?: "desktop" | "mobile";
}

export function AuthNavItems({ variant = "desktop" }: AuthNavItemsProps) {
  const { data: session, status } = useSession();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "loading") {
      const timer = setTimeout(() => setLoadingTimeout(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading" && !loadingTimeout) {
    if (variant === "mobile") {
      return <div className="h-10 w-full animate-pulse rounded-lg bg-gray-100" />;
    }
    return <div className="h-9 w-16 animate-pulse rounded-lg bg-gray-100" />;
  }

  // --- Mobile variant ---
  if (variant === "mobile") {
    if (!session) {
      return (
        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            회원가입
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="mb-2 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy">
            <User className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-800">
            {session.user.name || "사용자"}
          </span>
        </div>
        <Link
          href="/my"
          className="rounded-lg px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          마이페이지
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          대시보드
        </Link>
        {(session.user.role === "SELLER" || session.user.role === "ADMIN") && (
          <Link
            href="/listings/new"
            className="rounded-lg px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            점포 등록
          </Link>
        )}
        {session.user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="rounded-lg px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            관리자
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // --- Desktop variant ---
  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <CompareIcon />
        <Link
          href="/login"
          className="text-sm font-medium text-gray-600 transition-colors hover:text-navy"
        >
          로그인
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          회원가입
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <CompareIcon />
      <NotificationBell />

      {(session.user.role === "SELLER" || session.user.role === "ADMIN") && (
        <Link
          href="/listings/new"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
        >
          점포 등록
        </Link>
      )}

      {/* User Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1.5 rounded-full border border-gray-200 py-1.5 pl-1.5 pr-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-50 text-navy">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="max-w-[80px] truncate text-sm">
            {session.user.name || "사용자"}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg animate-fade-in-scale">
            <Link
              href="/my"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <User className="h-4 w-4 text-gray-400" />
              마이페이지
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <LayoutDashboard className="h-4 w-4 text-gray-400" />
              대시보드
            </Link>
            <Link
              href="/my/settings"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 text-gray-400" />
              설정
            </Link>
            {session.user.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Shield className="h-4 w-4 text-gray-400" />
                관리자
              </Link>
            )}
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
