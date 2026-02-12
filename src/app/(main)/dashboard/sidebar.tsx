"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  FileText,
  DollarSign,
  Bell,
  MessageSquare,
  FolderOpen,
  User,
  Star,
  Users,
  X,
  Sparkles,
  Calculator,
  Crown,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, roles: ["SELLER", "ADMIN"] },
  { href: "/dashboard/listings", label: "매물 관리", icon: Package, roles: ["SELLER", "ADMIN"] },
  { href: "/dashboard/analytics", label: "분석", icon: BarChart3, roles: ["SELLER", "ADMIN"] },
  { href: "/dashboard/inquiries", label: "문의 관리", icon: MessageSquare, roles: ["SELLER", "ADMIN", "BUYER"] },
  { href: "/dashboard/notifications", label: "알림", icon: Bell, roles: ["SELLER", "ADMIN", "BUYER"] },
  { href: "/dashboard/documents", label: "문서", icon: FolderOpen, roles: ["SELLER", "ADMIN"] },
  { href: "/dashboard/reports", label: "리포트", icon: FileText, roles: ["SELLER", "ADMIN", "BUYER"] },
  { href: "/my/consultations", label: "상담 내역", icon: Users, roles: ["SELLER", "ADMIN", "BUYER"] },
  { href: "/my/simulations", label: "시뮬레이션", icon: Calculator, roles: ["SELLER", "ADMIN", "BUYER"] },
  { href: "/my/subscription", label: "구독 관리", icon: Crown, roles: ["SELLER", "ADMIN", "BUYER"] },
  { href: "/dashboard/premium", label: "프리미엄 광고", icon: Star, roles: ["SELLER", "ADMIN"] },
  { href: "/dashboard/settlements", label: "정산 내역", icon: DollarSign, roles: ["SELLER", "ADMIN"] },
  { href: "/profile", label: "프로필", icon: User, roles: ["SELLER", "ADMIN", "BUYER"] },
];

const DISMISS_KEY = "kwonrishop_upgrade_banner_dismissed";

function isWithin24Hours(timestamp: number): boolean {
  return Date.now() - timestamp < 24 * 60 * 60 * 1000;
}

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [bannerDismissed, setBannerDismissed] = useState(true);

  const tier = session?.user?.subscriptionTier ?? "FREE";
  const isFree = tier === "FREE";

  useEffect(() => {
    if (!isFree) return;
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY);
      if (dismissed) {
        const ts = parseInt(dismissed, 10);
        setBannerDismissed(isWithin24Hours(ts));
      } else {
        setBannerDismissed(false);
      }
    } catch {
      setBannerDismissed(false);
    }
  }, [isFree]);

  function handleDismissBanner() {
    setBannerDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 space-y-4">
        {/* Upgrade Banner for FREE users */}
        {isFree && !bannerDismissed && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1B3A5C] to-[#0F2440] p-4 text-white shadow-lg">
            <button
              onClick={handleDismissBanner}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white/80 transition-colors hover:bg-white/30 hover:text-white"
              aria-label="배너 닫기"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <Sparkles className="mb-2 h-5 w-5 text-white/90" />
            <h3 className="text-sm font-bold">PRO로 업그레이드하세요!</h3>
            <p className="mt-1 text-xs text-white/80 leading-relaxed">
              무제한 매물 등록, 시세 비교, 시뮬레이터 등 모든 기능을 이용하세요
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center rounded-lg bg-[#F59E0B] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#D97706]"
            >
              업그레이드
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-mint/10 font-medium text-mint"
                    : "text-gray-600 hover:bg-gray-100 hover:text-navy"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
