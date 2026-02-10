import Image from "next/image";
import Link from "next/link";
import { Home, Search, FileEdit, Building, User } from "lucide-react";
import { AuthNavItems } from "./auth-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/krw_shop_logo_symbol_transparent.png"
              alt="권리샵"
              width={32}
              height={32}
            />
            <span className="font-heading text-lg font-bold text-navy">권리샵</span>
          </Link>

          {/* Center: Nav Links (hidden on mobile) */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/listings" className="text-sm text-gray-600 hover:text-navy">
              점포 찾기
            </Link>
            <Link href="/listings/new" className="text-sm text-gray-600 hover:text-navy">
              점포 팔기
            </Link>
            <Link href="/franchise" className="text-sm text-gray-600 hover:text-navy">
              프랜차이즈
            </Link>
            <Link href="/bbs" className="text-sm text-gray-600 hover:text-navy">
              이용가이드
            </Link>
          </nav>

          {/* Right: Auth */}
          <AuthNavItems />
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-16 md:pb-0">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Image
                src="/logos/krw_shop_logo_symbol_transparent.png"
                alt="권리샵"
                width={20}
                height={20}
              />
              <span className="text-xs font-bold text-navy">권리샵</span>
            </div>
            <nav className="flex gap-4 text-xs text-gray-500">
              <Link href="/legal/terms" className="hover:text-navy">이용약관</Link>
              <Link href="/legal/privacy" className="hover:text-navy">개인정보처리방침</Link>
              <Link href="/legal/disclaimer" className="hover:text-navy">면책조항</Link>
            </nav>
            <p className="text-xs text-gray-400">&copy; 2026 권리샵</p>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">
            본 서비스에서 제공하는 정보는 참고용이며, 플랫폼은 매물의 정확성을 보증하지 않습니다.
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white md:hidden">
        {[
          { href: "/", icon: Home, label: "홈" },
          { href: "/listings", icon: Search, label: "점포찾기" },
          { href: "/listings/new", icon: FileEdit, label: "점포팔기" },
          { href: "/franchise", icon: Building, label: "프랜차이즈" },
          { href: "/dashboard", icon: User, label: "내정보" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-gray-500 hover:text-mint"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
