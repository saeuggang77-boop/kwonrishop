"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  FileText,
  DollarSign,
  Bell,
  MessageSquare,
  User,
  Users,
  Calculator,
  Megaphone,
  Heart,
  Settings,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "매물 관리",
    items: [
      { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, roles: ["SELLER", "ADMIN"] },
      { href: "/dashboard/listings", label: "매물 관리", icon: Package, roles: ["SELLER", "ADMIN"] },
      { href: "/my/ads", label: "광고 관리", icon: Megaphone, roles: ["SELLER", "ADMIN", "BUYER"] },
      { href: "/my/likes", label: "찜한 매물", icon: Heart, roles: ["SELLER", "ADMIN", "BUYER"] },
    ],
  },
  {
    label: "분석/진단",
    items: [
      { href: "/dashboard/analytics", label: "분석", icon: BarChart3, roles: ["SELLER", "ADMIN"] },
      { href: "/dashboard/reports", label: "권리진단서", icon: FileText, roles: ["SELLER", "ADMIN", "BUYER"] },
      { href: "/my/simulations", label: "시뮬레이션", icon: Calculator, roles: ["SELLER", "ADMIN", "BUYER"] },
    ],
  },
  {
    label: "문의/상담",
    items: [
      { href: "/my/inquiries", label: "문의 관리", icon: MessageSquare, roles: ["SELLER", "ADMIN", "BUYER"] },
      { href: "/my/consultations", label: "상담 내역", icon: Users, roles: ["SELLER", "ADMIN", "BUYER"] },
      { href: "/dashboard/notifications", label: "알림", icon: Bell, roles: ["SELLER", "ADMIN", "BUYER"] },
    ],
  },
  {
    label: "계정",
    items: [
      { href: "/profile", label: "프로필", icon: User, roles: ["SELLER", "ADMIN", "BUYER"] },
      { href: "/my/settings", label: "설정", icon: Settings, roles: ["SELLER", "ADMIN", "BUYER"] },
      { href: "/dashboard/settlements", label: "정산 내역", icon: DollarSign, roles: ["SELLER", "ADMIN"] },
    ],
  },
];

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 space-y-4">
        {/* Navigation */}
        <nav>
          {visibleGroups.map((group, groupIndex) => (
            <div key={group.label}>
              <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
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
                          ? "bg-navy/10 font-medium text-navy"
                          : "text-gray-600 hover:bg-gray-100 hover:text-navy"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              {groupIndex < visibleGroups.length - 1 && (
                <div className="my-2 border-t border-gray-200" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
