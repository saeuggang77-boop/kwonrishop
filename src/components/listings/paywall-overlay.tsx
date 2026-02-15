"use client";

import Link from "next/link";
import { Lock, Check, Eye } from "lucide-react";
import { VIEWER_PLANS, PAID_FEATURES, GRADE_A_FEATURES } from "@/lib/utils/subscription";

interface PaywallOverlayProps {
  listingId: string;
  safetyGrade: string | null;
  children: React.ReactNode;
  hasAccess: boolean;
}

export function PaywallOverlay({
  listingId,
  safetyGrade,
  children,
  hasAccess,
}: PaywallOverlayProps) {
  // C/D grade or no grade: no paywall needed (no data to show)
  if (!safetyGrade || safetyGrade === "C" || safetyGrade === "D") {
    return <>{children}</>;
  }

  // User has access: show content normally
  if (hasAccess) {
    return <>{children}</>;
  }

  // Locked: show blurred content with overlay
  const features = safetyGrade === "A"
    ? [...PAID_FEATURES, ...GRADE_A_FEATURES]
    : PAID_FEATURES;

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none select-none" aria-hidden="true">
        <div className="blur-md opacity-60">
          {children}
        </div>
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
        <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
          {/* Lock icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy/10">
            <Lock className="h-7 w-7 text-navy" />
          </div>

          <h3 className="mt-4 text-center text-lg font-bold text-navy">
            수익 분석 데이터 열람
          </h3>
          <p className="mt-1 text-center text-sm text-gray-500">
            이 매물의 상세 수익 데이터를 확인하세요
          </p>

          {/* Feature checklist */}
          <ul className="mt-5 space-y-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA buttons */}
          <div className="mt-6 space-y-2.5">
            <Link
              href={`/api/payments/single?listingId=${listingId}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-navy bg-white px-4 py-3 text-sm font-bold text-navy transition-colors hover:bg-navy/5"
            >
              <Eye className="h-4 w-4" />
              건별 열람 {VIEWER_PLANS.SINGLE.price.toLocaleString()}원
            </Link>
            <Link
              href="/pricing#viewer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-navy/90"
            >
              월 구독 {VIEWER_PLANS.MONTHLY.price.toLocaleString()}원
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">
                추천
              </span>
            </Link>
          </div>

          {/* Footnote */}
          <p className="mt-3 text-center text-[11px] text-gray-400">
            건별 열람은 구매 후 {VIEWER_PLANS.SINGLE.durationDays}일간 유효합니다
          </p>
        </div>
      </div>
    </div>
  );
}
