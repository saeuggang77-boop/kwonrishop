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
  FolderOpen,
  User,
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
  { href: "/dashboard/settlements", label: "정산 내역", icon: DollarSign, roles: ["SELLER", "ADMIN"] },
  { href: "/profile", label: "프로필", icon: User, roles: ["SELLER", "ADMIN", "BUYER"] },
];

export function DashboardSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav className="sticky top-20 space-y-1">
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
    </aside>
  );
}
