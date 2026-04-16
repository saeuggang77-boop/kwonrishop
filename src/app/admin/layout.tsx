"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

const ADMIN_MENU = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/paid-dashboard", label: "유료 현황", icon: "💎" },
  { href: "/admin/listings", label: "매물관리", icon: "🏪" },
  { href: "/admin/equipment", label: "집기장터", icon: "🛠️" },
  { href: "/admin/partners", label: "협력업체", icon: "🤝" },
  { href: "/admin/franchise", label: "프랜차이즈", icon: "🏢" },
  { href: "/admin/products", label: "광고상품", icon: "💎" },
  { href: "/admin/reports", label: "신고관리", icon: "⚠️" },
  { href: "/admin/inquiries", label: "문의관리", icon: "📧" },
  { href: "/admin/users", label: "회원관리", icon: "👥" },
  { href: "/admin/community", label: "커뮤니티 관리", icon: "💬" },
  { href: "/admin/notices", label: "공지사항", icon: "📢" },
  { href: "/admin/auto-content", label: "자동 콘텐츠", icon: "🤖" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user.role !== "ADMIN") {
      toast.error("관리자만 접근 가능합니다");
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">권리샵 관리자</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div className="flex">
        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 min-h-screen transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}>
          <div className="p-6 border-b border-gray-200 hidden lg:block">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              권리샵 관리자
            </Link>
          </div>
          <nav className="p-4">
            {ADMIN_MENU.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">🏠</span>
                <span>사이트 홈으로</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
