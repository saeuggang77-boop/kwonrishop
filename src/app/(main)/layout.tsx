import Image from "next/image";
import Link from "next/link";
import { AuthNavItems } from "./auth-nav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/krw_shop_logo_symbol_transparent.png"
              alt="권리샵"
              width={32}
              height={32}
            />
            <span className="font-heading text-lg font-bold text-navy">권리샵</span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link href="/listings" className="text-sm text-gray-600 hover:text-navy">
              매물 검색
            </Link>
            <Link href="/legal/terms" className="hidden text-sm text-gray-600 hover:text-navy sm:block">
              이용약관
            </Link>
            <AuthNavItems />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

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
            본 서비스에서 제공하는 분석 정보는 참고용이며, 플랫폼은 매물의 정확성을 보증하지 않습니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
