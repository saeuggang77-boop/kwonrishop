"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-7">
      <div className="max-w-7xl mx-auto px-6">
        {/* 상단: 로고 + 핵심 링크 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <span className="text-lg font-extrabold text-blue-600">권리샵</span>
          <div className="flex flex-wrap gap-5">
            <Link href="/terms" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">이용약관</Link>
            <Link href="/privacy" className="text-xs font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 transition-colors">개인정보처리방침</Link>
            <Link href="/guide" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">이용가이드</Link>
            <Link href="/pricing" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">요금안내</Link>
            <Link href="/about" className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors">회사소개</Link>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="text-[11px] text-gray-400 dark:text-gray-500 leading-[1.8]">
          <span className="mr-3">씨이오</span>
          <span className="mr-3">대표: 박상만</span>
          <span className="mr-3">사업자등록번호: 408-70-43230</span>
          <span>통신판매업: 제2023-서울동작-1252호</span>
          <br />
          <span className="mr-3">서울특별시 동작구 장승배기로4길 9</span>
          <span>운영시간: 평일 09:00 - 18:00</span>
        </div>

        {/* 하단: 카피라이트 + 고객센터 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} 권리샵. All rights reserved.
          </span>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            고객센터 <strong className="text-blue-600 text-sm">1588-7928</strong>
            <span className="mx-1">|</span>
            samsungcu@naver.com
          </div>
        </div>
      </div>
    </footer>
  );
}
