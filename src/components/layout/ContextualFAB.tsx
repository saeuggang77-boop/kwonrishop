"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

const FAB_MAP: { match: string; href: string; label: string }[] = [
  { match: "/listings",  href: "/sell",                label: "매물 등록" },
  { match: "/community", href: "/community/write",     label: "글쓰기" },
  { match: "/equipment", href: "/equipment/register",  label: "집기 등록" },
  { match: "/franchise", href: "/franchise/edit",      label: "브랜드 등록" },
  { match: "/partners",  href: "/partners/register",   label: "서비스 등록" },
];

type RegisterItem = {
  href: string;
  label: string;
  desc: string;
  iconBg: string;
  iconColor: string;
  iconPath: string;
  // 빈 배열 = 로그인만 되어 있으면 누구나
  roles: string[];
  roleLabel: string;
};

const HOME_REGISTER_ITEMS: RegisterItem[] = [
  {
    href: "/sell",
    label: "매물 등록",
    desc: "권리금 매물 직거래",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    iconPath: "M3 21V8l9-5 9 5v13H3zm6-7h6v7H9v-7z",
    roles: ["SELLER", "ADMIN"],
    roleLabel: "사장님",
  },
  {
    href: "/equipment/register",
    label: "집기 등록",
    desc: "중고 영업 집기 판매",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    iconPath: "M20 7h-3V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM9 5h6v2H9V5z",
    roles: ["SELLER", "FRANCHISE", "PARTNER", "ADMIN"],
    roleLabel: "사업자 회원",
  },
  {
    href: "/franchise/edit",
    label: "브랜드 등록",
    desc: "프랜차이즈 가맹 모집",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    iconPath: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5",
    roles: ["FRANCHISE", "ADMIN"],
    roleLabel: "프랜차이즈 본사",
  },
  {
    href: "/partners/register",
    label: "서비스 등록",
    desc: "인테리어/세무/법무 등",
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    iconPath: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
    roles: ["PARTNER", "ADMIN"],
    roleLabel: "협력업체",
  },
  {
    href: "/community/write",
    label: "커뮤니티 글쓰기",
    desc: "정보 공유, Q&A",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    iconPath: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    roles: [], // 로그인만 되어 있으면 누구나
    roleLabel: "",
  },
];

const HIDE_ON_PATHS = ["/chat", "/payments", "/sell", "/login", "/signup"];

function isItemAllowed(item: RegisterItem, role: string | undefined): boolean {
  // 비로그인은 모두 허용 (클릭 시 가드가 로그인 페이지로 보냄)
  if (!role) return true;
  // 빈 roles = 로그인 누구나
  if (item.roles.length === 0) return true;
  return item.roles.includes(role);
}

export default function ContextualFAB() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  const role = (session?.user as { role?: string } | undefined)?.role;

  // 시트 열린 동안 body 스크롤 잠금 + ESC 닫기
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  // 명시적 숨김 경로
  if (HIDE_ON_PATHS.some((p) => pathname.startsWith(p))) return null;
  // 자기 자신(=등록/쓰기) 페이지에서는 숨김
  if (FAB_MAP.some((f) => pathname.startsWith(f.href))) return null;

  // 홈: 액션시트 트리거 FAB
  if (pathname === "/") {
    return (
      <>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="md:hidden fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-terra-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(217,108,79,0.4)] transition-all hover:shadow-[0_12px_32px_rgba(217,108,79,0.5)] hover:bg-terra-600 active:scale-95"
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
          aria-label="등록 메뉴 열기"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>등록</span>
        </button>

        {sheetOpen && (
          <div
            className="md:hidden fixed inset-0 z-[60] bg-black/45 flex items-end"
            onClick={() => setSheetOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="등록 메뉴"
          >
            <div
              className="w-full bg-white rounded-t-3xl pt-4 pb-6 shadow-[0_-8px_24px_rgba(0,0,0,0.15)]"
              style={{ marginBottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="text-center text-base font-bold text-gray-900 mb-4">등록하기</div>
              <ul>
                {HOME_REGISTER_ITEMS.map((item) => {
                  const allowed = isItemAllowed(item, role);
                  if (allowed) {
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center gap-3.5 px-5 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.iconBg} ${item.iconColor} shrink-0`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                          </div>
                          <span className="text-gray-400 text-lg leading-none">›</span>
                        </Link>
                      </li>
                    );
                  }
                  // 권한 없음 → 잠금 표시 + 클릭 시 안내 토스트
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => toast.info(`${item.label}은 ${item.roleLabel} 회원만 이용할 수 있습니다.`)}
                        className="w-full flex items-center gap-3.5 px-5 py-3.5 border-b border-gray-100 last:border-b-0 cursor-not-allowed opacity-60"
                        aria-disabled="true"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 shrink-0 relative">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
                            {item.label}
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{item.roleLabel} 회원만 가능</div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </>
    );
  }

  // 목록 페이지에서만 노출 — 상세 페이지는 숨김
  const matched = FAB_MAP.find((f) => pathname.startsWith(f.match));
  if (!matched) return null;

  const rest = pathname.slice(matched.match.length);
  const isListPage = rest === "" || rest === "/" || rest.startsWith("?");
  if (!isListPage) return null;

  return (
    <Link
      href={matched.href}
      className="md:hidden fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-terra-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(217,108,79,0.4)] transition-all hover:shadow-[0_12px_32px_rgba(217,108,79,0.5)] hover:bg-terra-600 active:scale-95"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label={matched.label}
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
      <span>{matched.label}</span>
    </Link>
  );
}
