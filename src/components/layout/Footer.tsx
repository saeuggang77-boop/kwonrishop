"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-12">
        {/* Top Section - Company Info */}
        <div className="mb-8 pb-8 border-b border-gray-300 dark:border-gray-600">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            주식회사 권리샵
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>대표이사: [대표자명]</p>
            <p>사업자등록번호: [000-00-00000]</p>
            <p>통신판매업신고번호: 제0000-서울강남-00000호</p>
            <p>주소: 서울특별시 강남구 [상세주소]</p>
            <p>고객센터: 1234-5678 | 이메일: support@kwonrishop.com</p>
            <p>운영시간: 평일 09:00 - 18:00 (주말 및 공휴일 휴무)</p>
          </div>
        </div>

        {/* Middle Section - Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* 서비스 */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">서비스</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="/listings"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  매물검색
                </Link>
              </li>
              <li>
                <Link
                  href="/sell"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  매물등록
                </Link>
              </li>
              <li>
                <Link
                  href="/franchise"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  프랜차이즈
                </Link>
              </li>
              <li>
                <Link
                  href="/partners"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  협력업체
                </Link>
              </li>
              <li>
                <Link
                  href="/equipment"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  집기장터
                </Link>
              </li>
              <li>
                <Link
                  href="/community"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  커뮤니티
                </Link>
              </li>
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">고객지원</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="/guide"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  이용가이드
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  자주 묻는 질문
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  고객센터
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  요금안내
                </Link>
              </li>
            </ul>
          </div>

          {/* 회사 */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">회사</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link
                  href="/about"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  회사소개
                </Link>
              </li>
              <li>
                <a
                  href="mailto:recruit@kwonrishop.com"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  채용
                </a>
              </li>
              <li>
                <a
                  href="mailto:partnership@kwonrishop.com"
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  제휴문의
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="pt-8 border-t border-gray-300 dark:border-gray-600 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 권리샵. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
