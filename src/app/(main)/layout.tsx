import Image from "next/image";
import Link from "next/link";
import { AuthNavItems } from "./auth-nav";
import { MobileTabBar } from "./mobile-tab-bar";
import { CompareFloatingBar } from "@/components/listings/compare-floating-bar";


export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-navy-dark bg-navy backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logos/krw_shop_logo_symbol_transparent.png"
              alt="권리샵"
              width={32}
              height={32}
            />
            <span className="font-heading text-lg font-bold text-white">권리샵</span>
          </Link>

          {/* Center: Nav Links (hidden on mobile) */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/listings" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">
              점포 찾기
            </Link>
            <Link href="/sell" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">
              점포 팔기
            </Link>
            <Link href="/wanted" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">
              점포 의뢰
            </Link>
            <Link href="/franchise" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">
              프랜차이즈
            </Link>
            <Link href="/experts" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">
              전문가
            </Link>
            <Link href="/simulator" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">
              시뮬레이터
            </Link>
            <Link href="/area-analysis" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">
              상권분석
            </Link>
            <Link href="/bbs" className="text-sm font-medium text-white/80 transition-colors hover:text-accent-light">
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
      <footer className="border-t border-gray-200 bg-[#111827] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Column 1: Logo + Business Info */}
            <div>
              <Link href="/" className="flex items-center gap-1.5">
                <Image src="/logos/krw_shop_logo_symbol_transparent.png" alt="권리샵" width={24} height={24} />
                <span className="font-heading text-sm font-bold text-white">권리샵</span>
              </Link>
              <div className="mt-4 space-y-1 text-xs text-white/50">
                <p>대표: 박상만</p>
                <p>사업자등록번호: 408-70-43230</p>
                <p>서울특별시 동작구 장승배기로4길 9</p>
              </div>
            </div>

            {/* Column 2: 서비스 */}
            <div>
              <h3 className="text-sm font-bold text-white/90">서비스</h3>
              <ul className="mt-3 space-y-2">
                <li><Link href="/listings" className="text-sm text-white/50 transition-colors hover:text-white/80">점포 찾기</Link></li>
                <li><Link href="/sell" className="text-sm text-white/50 transition-colors hover:text-white/80">점포 팔기</Link></li>
                <li><Link href="/franchise" className="text-sm text-white/50 transition-colors hover:text-white/80">프랜차이즈</Link></li>
                <li><Link href="/reports/request" className="text-sm text-white/50 transition-colors hover:text-white/80">권리진단서</Link></li>
              </ul>
            </div>

            {/* Column 3: 고객지원 */}
            <div>
              <h3 className="text-sm font-bold text-white/90">고객지원</h3>
              <ul className="mt-3 space-y-2">
                <li><Link href="/bbs" className="text-sm text-white/50 transition-colors hover:text-white/80">이용가이드</Link></li>
                <li><Link href="/pricing" className="text-sm text-white/50 transition-colors hover:text-white/80">서비스 요금</Link></li>
                <li><Link href="/legal/terms" className="text-sm text-white/50 transition-colors hover:text-white/80">이용약관</Link></li>
                <li><Link href="/legal/privacy" className="text-sm text-white/50 transition-colors hover:text-white/80">개인정보처리방침</Link></li>
              </ul>
            </div>

            {/* Column 4: 고객센터 */}
            <div>
              <h3 className="text-sm font-bold text-white/90">고객센터</h3>
              <div className="mt-3 space-y-2.5">
                <p className="text-lg font-bold text-white">📞 1588-7928</p>
                <p className="text-xs text-white/50">평일 09:00 ~ 18:00 (주말/공휴일 휴무)</p>
                <p className="text-xs text-white/50">✉ samsungcu@naver.com</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
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
