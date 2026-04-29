"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FAB_MAP: { match: string; href: string; label: string }[] = [
  { match: "/listings",  href: "/sell",                label: "매물 등록" },
  { match: "/community", href: "/community/write",     label: "글쓰기" },
  { match: "/equipment", href: "/equipment/register",  label: "집기 등록" },
  { match: "/franchise", href: "/franchise/edit",      label: "브랜드 등록" },
  { match: "/partners",  href: "/partners/register",   label: "서비스 등록" },
];

const HIDE_ON_PATHS = ["/chat", "/payments", "/sell", "/login", "/signup"];

export default function ContextualFAB() {
  const pathname = usePathname();

  // 명시적 숨김 경로
  if (HIDE_ON_PATHS.some((p) => pathname.startsWith(p))) return null;

  // 자기 자신(=등록/쓰기) 페이지에서는 숨김
  if (FAB_MAP.some((f) => pathname.startsWith(f.href))) return null;

  // 상세 페이지(/.../[id])에서는 숨김 — 목록 페이지에서만 노출
  // 매칭 후보 찾기
  const matched = FAB_MAP.find((f) => pathname.startsWith(f.match));
  if (!matched) return null;

  // 상세 페이지 검증: pathname이 정확히 match이거나 그 끝에 슬러그 없는 직속 자식만 허용
  // ex) "/listings" OK, "/listings/abc123" → 숨김 / "/community" OK, "/community/abc" → 숨김 (write 제외)
  const rest = pathname.slice(matched.match.length);
  // 빈 문자열, "/", "?..." 만 허용 (목록 페이지)
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
