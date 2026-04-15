"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  return (
    <footer className="bg-cream-elev border-t border-line pt-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* 상단: 로고 + 핵심 링크 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <Logo size="sm" href={null} />
          <div className="flex flex-wrap gap-5">
            <Link href="/terms" className="text-xs text-muted hover:text-green-700 transition-colors py-2 px-1">이용약관</Link>
            <Link href="/privacy" className="text-xs font-bold text-ink hover:text-green-700 transition-colors py-2 px-1">개인정보처리방침</Link>
            <Link href="/guide" className="text-xs text-muted hover:text-green-700 transition-colors py-2 px-1">이용가이드</Link>
            <Link href="/pricing" className="text-xs text-muted hover:text-green-700 transition-colors py-2 px-1">요금안내</Link>
            <Link href="/about" className="text-xs text-muted hover:text-green-700 transition-colors py-2 px-1">회사소개</Link>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="text-xs text-muted leading-[1.8]">
          <span className="mr-3">씨이오</span>
          <span className="mr-3">대표: 박상만</span>
          <span className="mr-3">사업자등록번호: 408-70-43230</span>
          <span>통신판매업: 제2023-서울동작-1252호</span>
          <br />
          <span className="mr-3">서울특별시 동작구 장승배기로4길 9</span>
          <span>운영시간: 평일 09:00 - 18:00</span>
        </div>

        {/* 하단 */}
        <div className="mt-5 pt-4 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-[11px] text-muted">
            © {new Date().getFullYear()} 권리샵. 중개수수료 없는 상가 직거래 플랫폼.
          </span>
          <div className="text-xs text-muted">
            고객센터 <strong className="text-green-700 text-sm font-serif italic">1588-7928</strong>
            <span className="mx-1.5 text-line-deep">|</span>
            samsungcu@naver.com
          </div>
        </div>
      </div>
    </footer>
  );
}
