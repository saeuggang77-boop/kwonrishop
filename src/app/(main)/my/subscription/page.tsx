"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crown,
  Star,
  Sparkles,
  CreditCard,
  ArrowUpRight,
  FileText,
  Megaphone,
  Users,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import {
  SUBSCRIPTION_TIER_LABELS,
  SUBSCRIPTION_PRICES,
  SUBSCRIPTION_PLAN_FEATURES,
} from "@/lib/utils/constants";
import { formatNumber, formatDateKR } from "@/lib/utils/format";

type Tier = "FREE" | "PRO" | "EXPERT";

interface SessionUser {
  id: string;
  name?: string | null;
  subscriptionTier: string;
}

const TIER_CONFIG: Record<Tier, { icon: React.ReactNode; color: string; bg: string; border: string; badgeBg: string; badgeText: string }> = {
  FREE: {
    icon: <Star className="h-6 w-6 text-gray-400" />,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    badgeBg: "bg-gray-100",
    badgeText: "text-gray-600",
  },
  PRO: {
    icon: <Crown className="h-6 w-6 text-mint" />,
    color: "text-mint",
    bg: "bg-mint/5",
    border: "border-mint/30",
    badgeBg: "bg-mint/10",
    badgeText: "text-mint",
  },
  EXPERT: {
    icon: <Sparkles className="h-6 w-6 text-navy" />,
    color: "text-navy",
    bg: "bg-navy/5",
    border: "border-navy/30",
    badgeBg: "bg-navy/10",
    badgeText: "text-navy",
  },
};

// Mock subscription data for demo
function getMockSubscriptionData(tier: Tier) {
  if (tier === "FREE") return null;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const totalDays = Math.ceil(
    (nextBillingDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const elapsedDays = Math.ceil(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const remainingDays = totalDays - elapsedDays;

  return {
    startDate,
    nextBillingDate,
    totalDays,
    remainingDays,
    progressPercent: Math.round((elapsedDays / totalDays) * 100),
    autoRenew: true,
  };
}

function getUsageData(tier: Tier) {
  if (tier === "FREE") return [];

  const items: { label: string; icon: React.ReactNode; used: number; total: number }[] = [];

  if (tier === "PRO") {
    items.push(
      { label: "BASIC 리포트", icon: <FileText className="h-4 w-4" />, used: 0, total: 1 },
      { label: "BASIC 광고", icon: <Megaphone className="h-4 w-4" />, used: 0, total: 1 }
    );
  }

  if (tier === "EXPERT") {
    items.push(
      { label: "PREMIUM 리포트", icon: <FileText className="h-4 w-4" />, used: 0, total: 2 },
      { label: "PREMIUM 광고", icon: <Megaphone className="h-4 w-4" />, used: 0, total: 1 },
      { label: "전문가 상담", icon: <Users className="h-4 w-4" />, used: 0, total: 2 }
    );
  }

  return items;
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [autoRenew, setAutoRenew] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const user = session?.user as SessionUser | undefined;
  const currentTier = (user?.subscriptionTier ?? "FREE") as Tier;
  const tierConfig = TIER_CONFIG[currentTier];
  const subscriptionData = getMockSubscriptionData(currentTier);
  const usageData = getUsageData(currentTier);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  function handleAutoRenewToggle() {
    const newValue = !autoRenew;
    setAutoRenew(newValue);
    toast(
      "info",
      newValue
        ? "자동 갱신이 활성화되었습니다."
        : "자동 갱신이 비활성화되었습니다. 현 결제 기간 종료 후 무료 플랜으로 전환됩니다."
    );
  }

  function handleCancelSubscription() {
    setCancelling(true);
    // Simulate API call
    setTimeout(() => {
      setCancelling(false);
      setShowCancelDialog(false);
      toast("info", "구독 취소가 접수되었습니다. 현재 결제 기간이 끝난 후 무료 플랜으로 전환됩니다.");
    }, 1000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">구독 관리</h1>
        <p className="mt-1 text-sm text-gray-500">현재 구독 플랜과 혜택을 확인하세요</p>
      </div>

      {/* Current Plan Card */}
      <div
        className={cn(
          "rounded-2xl border p-6 shadow-sm",
          tierConfig.border,
          tierConfig.bg
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", tierConfig.bg)}>
              {tierConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-md px-2.5 py-0.5 text-xs font-bold", tierConfig.badgeBg, tierConfig.badgeText)}>
                  {currentTier}
                </span>
                <h2 className="text-lg font-bold text-navy">
                  {SUBSCRIPTION_TIER_LABELS[currentTier]} 플랜
                </h2>
              </div>
              {currentTier === "FREE" ? (
                <p className="mt-1 text-sm text-gray-500">무료 플랜 이용중</p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  월 {formatNumber(SUBSCRIPTION_PRICES[currentTier])}원
                </p>
              )}
            </div>
          </div>

          <Link
            href="/pricing"
            className={cn(
              "flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              currentTier === "FREE"
                ? "bg-accent text-white hover:bg-accent-dark"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {currentTier === "FREE" ? "업그레이드" : "플랜 변경"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Subscription Details (paid only) */}
        {subscriptionData && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">시작일</p>
                <p className="mt-0.5 text-sm font-medium text-navy">
                  {formatDateKR(subscriptionData.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">다음 결제일</p>
                <p className="mt-0.5 text-sm font-medium text-navy">
                  {formatDateKR(subscriptionData.nextBillingDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">남은 일수</p>
                <p className="mt-0.5 text-sm font-medium text-navy">
                  {subscriptionData.remainingDays}일
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>결제 주기</span>
                <span>{subscriptionData.progressPercent}% 경과</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    currentTier === "PRO" ? "bg-mint" : "bg-navy"
                  )}
                  style={{ width: `${subscriptionData.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Auto Renew Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-white p-4">
              <div>
                <p className="text-sm font-medium text-navy">자동 갱신</p>
                <p className="text-xs text-gray-500">
                  {autoRenew
                    ? "다음 결제일에 자동으로 갱신됩니다"
                    : "현 기간 종료 후 무료 플랜으로 전환됩니다"}
                </p>
              </div>
              <button
                onClick={handleAutoRenewToggle}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  autoRenew ? "bg-mint" : "bg-gray-300"
                )}
                aria-label={autoRenew ? "자동 갱신 비활성화" : "자동 갱신 활성화"}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    autoRenew ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Usage Section (paid only) */}
      {usageData.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-4 text-sm font-bold text-navy">이번 달 무료 혜택 사용량</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usageData.map((item) => {
              const percent = item.total > 0 ? Math.round((item.used / item.total) * 100) : 0;
              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", tierConfig.bg, tierConfig.color)}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-navy">{item.label}</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-navy">{item.used}</span>
                      <span className="text-sm text-gray-500">/ {item.total}회</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          percent >= 100
                            ? "bg-red-400"
                            : percent >= 50
                            ? "bg-yellow-400"
                            : currentTier === "PRO"
                            ? "bg-mint"
                            : "bg-navy"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{item.used}/{item.total}회 사용</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Free Plan - Empty State */}
      {currentTier === "FREE" && (
        <div className="mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <Crown className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-bold text-navy">프리미엄 혜택을 이용해보세요</h3>
            <p className="mt-2 text-sm text-gray-500">
              PRO 또는 EXPERT 플랜으로 업그레이드하면 더 많은 기능을 이용할 수 있습니다.
            </p>

            {/* Mini comparison cards */}
            <div className="mx-auto mt-6 grid max-w-md gap-4 sm:grid-cols-2">
              <Link
                href="/pricing"
                className="group rounded-xl border border-mint/30 bg-mint/5 p-4 text-left transition-all hover:border-mint hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <Crown className="h-5 w-5 text-mint" />
                  <ChevronRight className="h-4 w-4 text-mint opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-2 text-sm font-bold text-navy">PRO 플랜</p>
                <p className="mt-0.5 text-xs text-gray-500">월 {formatNumber(SUBSCRIPTION_PRICES.PRO)}원</p>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-gray-600">무제한 매물 등록</li>
                  <li className="text-xs text-gray-600">시세 비교 위젯</li>
                  <li className="text-xs text-gray-600">창업 시뮬레이터</li>
                </ul>
              </Link>

              <Link
                href="/pricing"
                className="group rounded-xl border border-navy/20 bg-navy/5 p-4 text-left transition-all hover:border-navy/50 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="h-5 w-5 text-navy" />
                  <ChevronRight className="h-4 w-4 text-navy opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-2 text-sm font-bold text-navy">EXPERT 플랜</p>
                <p className="mt-0.5 text-xs text-gray-500">월 {formatNumber(SUBSCRIPTION_PRICES.EXPERT)}원</p>
                <ul className="mt-2 space-y-1">
                  <li className="text-xs text-gray-600">프리미엄 리포트</li>
                  <li className="text-xs text-gray-600">전문가 상담 무료</li>
                  <li className="text-xs text-gray-600">전담 매니저 배정</li>
                </ul>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Actions (paid only) */}
      {currentTier !== "FREE" && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-700">구독 취소</p>
            <p className="text-xs text-gray-500">
              현재 결제 기간이 끝난 후 무료 플랜으로 전환됩니다
            </p>
          </div>
          <button
            onClick={() => setShowCancelDialog(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            구독 취소
          </button>
        </div>
      )}

      {/* Billing Info */}
      {currentTier !== "FREE" && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <CreditCard className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-navy">결제 정보</p>
              <p className="text-xs text-gray-500">카드 **** **** **** 1234</p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowCancelDialog(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-navy">구독 취소</h3>
            <p className="mt-2 text-sm text-gray-600">
              정말 구독을 취소하시겠습니까? 현재 결제 기간이 끝난 후 무료 플랜으로 전환됩니다.
            </p>

            {/* Current plan info */}
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                {tierConfig.icon}
                <span className="text-sm font-bold text-navy">
                  {SUBSCRIPTION_TIER_LABELS[currentTier]} 플랜
                </span>
                <span className="text-xs text-gray-500">
                  월 {formatNumber(SUBSCRIPTION_PRICES[currentTier])}원
                </span>
              </div>
            </div>

            {/* Cancel reason */}
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-500">
                취소 사유 (선택)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="불편했던 점이나 개선 사항을 알려주시면 서비스 개선에 참고하겠습니다."
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-mint focus:ring-1 focus:ring-mint"
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                유지하기
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    처리중...
                  </span>
                ) : (
                  "구독 취소"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
