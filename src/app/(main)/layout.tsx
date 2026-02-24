"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AuthNavItems } from "./auth-nav";
import { MobileTabBar } from "./mobile-tab-bar";
import { CompareFloatingBar } from "@/components/listings/compare-floating-bar";

const navLinks = [
  { href: "/listings", label: "점포 찾기" },
  { href: "/sell", label: "점포 팔기" },
  { href: "/wanted", label: "점포 의뢰" },
  { href: "/franchise", label: "프랜차이즈" },
  { href: "/experts", label: "전문가" },
  { href: "/simulator", label: "시뮬레이터" },
  { href: "/area-analysis", label: "상권분석" },
  { href: "/bbs", label: "이용가이드" },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Scroll detection for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/krw_shop_logo_symbol_transparent.png"
              alt="권리샵"
              width={32}
              height={32}
            />
            <span className="font-heading text-xl font-bold text-navy">권리샵</span>
          </Link>

          {/* Center: Nav Links (desktop only) */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-navy font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-navy"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Auth (desktop) + Mobile menu button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex">
              <AuthNavItems />
            </div>

            {/* Mobile: Hamburger menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
              aria-label="메뉴 열기"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image
              src="/logos/krw_shop_logo_symbol_transparent.png"
              alt="권리샵"
              width={28}
              height={28}
            />
            <span className="font-heading text-lg font-bold text-navy">권리샵</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="메뉴 닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <nav className="flex flex-col px-2 py-3">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-navy-50 text-navy font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Auth */}
        <div className="border-t border-gray-100 px-4 py-4">
          <AuthNavItems variant="mobile" />
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-16 md:pb-0">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-navy-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Column 1: Logo + Business Info */}
            <div>
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logos/krw_shop_logo_symbol_transparent.png"
                  alt="권리샵"
                  width={24}
                  height={24}
                />
                <span className="font-heading text-sm font-bold text-white">권리샵</span>
              </Link>
              <p className="mt-2 text-sm text-white/50">점포 권리금 거래 플랫폼</p>
              <div className="mt-4 space-y-1 text-xs text-white/40">
                <p>대표: 박상만</p>
                <p>사업자등록번호: 408-70-43230</p>
                <p>서울특별시 동작구 장승배기로4길 9</p>
              </div>
              <div className="mt-4 space-y-1.5">
                <p className="text-base font-bold text-white/90">1588-7928</p>
                <p className="text-xs text-white/40">평일 09:00 ~ 18:00 (주말/공휴일 휴무)</p>
                <p className="text-xs text-white/40">samsungcu@naver.com</p>
              </div>
            </div>

            {/* Column 2: 서비스 */}
            <div>
              <h3 className="text-sm font-bold text-white/70">서비스</h3>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link href="/listings" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    점포 찾기
                  </Link>
                </li>
                <li>
                  <Link href="/sell" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    점포 팔기
                  </Link>
                </li>
                <li>
                  <Link href="/franchise" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    프랜차이즈
                  </Link>
                </li>
                <li>
                  <Link href="/experts" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    전문가 상담
                  </Link>
                </li>
                <li>
                  <Link href="/simulator" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    시뮬레이터
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: 고객지원 */}
            <div>
              <h3 className="text-sm font-bold text-white/70">고객지원</h3>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link href="/bbs" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    이용가이드
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-gray-400 transition-colors hover:text-white/80">
                    서비스 요금
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-center text-[10px] text-white/30 md:text-left md:text-xs">
              본 서비스에서 제공하는 정보는 참고용이며, 플랫폼은 매물의 정확성을 보증하지 않습니다.
            </p>
            <p className="mt-2 text-center text-[10px] text-white/30 md:text-left md:text-xs">
              &copy; 2026 권리샵. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Compare Floating Bar */}
      <CompareFloatingBar />

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />
    </div>
  );
}
