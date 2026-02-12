import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  BarChart3,
  ListChecks,
  Users,
  Building,
  FileText,
  Image as ImageIcon,
  Shield,
  DollarSign,
  ScrollText,
  ExternalLink,
  LogOut,
  Bell,
  TrendingUp,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const menuGroups = [
    {
      label: "주요 관리",
      items: [
        { href: "/admin", icon: BarChart3, label: "대시보드" },
        { href: "/admin/analytics", icon: TrendingUp, label: "통계/분석" },
        { href: "/admin/listings", icon: ListChecks, label: "매물 관리" },
        { href: "/admin/users", icon: Users, label: "회원 관리" },
      ],
    },
    {
      label: "콘텐츠",
      items: [
        { href: "/admin/franchises", icon: Building, label: "프랜차이즈 관리" },
        { href: "/admin/posts", icon: FileText, label: "게시판 관리" },
        { href: "/admin/banners", icon: ImageIcon, label: "배너 관리" },
      ],
    },
    {
      label: "보안 / 재무",
      items: [
        { href: "/admin/queue", icon: Shield, label: "사기탐지 큐" },
        { href: "/admin/settlements", icon: DollarSign, label: "정산" },
        { href: "/admin/audit", icon: ScrollText, label: "감사 로그" },
      ],
    },
  ];

  return (
    <div className="flex h-screen">
      {/* Dark Sidebar */}
      <aside className="flex w-[260px] flex-col bg-[var(--admin-sidebar-bg)]">
        {/* Logo Area */}
        <div className="flex h-[70px] items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-sm font-bold text-white">
            K
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            권리샵 Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--admin-text-dim)]">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-[var(--admin-text-muted)] transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0 text-[var(--admin-text-dim)] transition-colors group-hover:text-navy" />
                      <span className="text-[13px] font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* External Link */}
          <div className="mt-2 border-t border-white/10 pt-4">
            <Link
              href="/"
              target="_blank"
              className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-[var(--admin-text-muted)] transition-colors hover:bg-white/5 hover:text-white"
            >
              <ExternalLink className="h-[18px] w-[18px] shrink-0 text-[var(--admin-text-dim)] transition-colors group-hover:text-navy" />
              <span className="text-[13px] font-medium">사이트 바로가기</span>
            </Link>
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/20 text-sm font-bold text-navy">
              {session.user.name?.charAt(0) ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{session.user.name}</p>
              <p className="truncate text-xs text-[var(--admin-text-dim)]">{session.user.email}</p>
            </div>
            <Link
              href="/api/auth/signout"
              className="rounded-md p-1.5 text-[var(--admin-text-dim)] transition-colors hover:bg-white/5 hover:text-red-400"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        {/* Top Header Bar */}
        <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="text-sm text-gray-500">
            <span className="text-gray-400">관리자</span>
            <span className="mx-2 text-gray-300">/</span>
            <span className="font-medium text-gray-700">대시보드</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <Link
              href="/"
              target="_blank"
              className="text-sm text-gray-500 transition-colors hover:text-blue-600"
            >
              사이트 이동
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-sm font-medium text-gray-700">{session.user.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
