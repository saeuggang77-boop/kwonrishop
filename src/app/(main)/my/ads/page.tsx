"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Megaphone,
  Crown,
  Star,
  Clock,
  Eye,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PREMIUM_AD_CONFIG } from "@/lib/utils/constants";
import { formatNumber, formatDateKR } from "@/lib/utils/format";

// ── Types ──

type AdTier = "PREMIUM" | "VIP";
type AdStatus = "ACTIVE" | "EXPIRED" | "PENDING";

interface AdItem {
  id: string;
  listingTitle: string;
  tier: AdTier;
  status: AdStatus;
  startDate: string;
  endDate: string;
  totalDays: number;
  remainingDays: number;
  views: number;
  clicks: number;
  inquiries: number;
  ctr: number; // click-through rate %
}

// ── Status config ──

const STATUS_CONFIG: Record<
  AdStatus,
  { label: string; bg: string; text: string }
> = {
  ACTIVE: { label: "진행중", bg: "bg-green-100", text: "text-green-700" },
  EXPIRED: { label: "만료", bg: "bg-gray-100", text: "text-gray-500" },
  PENDING: { label: "대기중", bg: "bg-yellow-100", text: "text-yellow-700" },
};

// ── Component ──

export default function AdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchAds() {
      try {
        const res = await fetch("/api/premium/my");
        if (res.ok) {
          const data = await res.json();
          setAds(data.ads ?? []);
        } else {
          // API doesn't exist yet — show empty state
          setAds([]);
        }
      } catch {
        setAds([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAds();
  }, [status]);

  // ── Loading skeleton ──
  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const activeAds = ads.filter((ad) => ad.status === "ACTIVE");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">광고 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          진행중인 광고와 통계를 확인하세요
        </p>
      </div>

      {/* Current Ads Section */}
      {ads.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-bold text-navy">
            현재 진행중인 광고가 없습니다
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            오늘의 추천 매물 또는 프리미엄 매물 광고를 신청하면 매물이 상위에 노출됩니다.
          </p>
          <Link
            href="/premium/listing-ad"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-dark"
          >
            광고 신청하기
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        /* Ad Cards */
        <div className="space-y-4">
          {ads.map((ad) => {
            const tierConfig = PREMIUM_AD_CONFIG[ad.tier];
            const statusConfig = STATUS_CONFIG[ad.status];
            const progressPercent =
              ad.totalDays > 0
                ? Math.round(
                    ((ad.totalDays - ad.remainingDays) / ad.totalDays) * 100
                  )
                : 0;

            return (
              <div
                key={ad.id}
                className={cn(
                  "rounded-2xl border bg-white p-6 shadow-sm",
                  tierConfig?.border ?? "border-gray-200"
                )}
              >
                {/* Top row: title + badges */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {ad.tier === "VIP" ? (
                      <Crown className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Star className="h-5 w-5 text-blue-600" />
                    )}
                    <h3 className="text-base font-bold text-navy">
                      {ad.listingTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tier badge */}
                    <span
                      className={cn(
                        "rounded-md px-2.5 py-0.5 text-xs font-bold",
                        tierConfig?.bg ?? "bg-gray-100",
                        tierConfig?.color ?? "text-gray-600"
                      )}
                    >
                      {tierConfig?.badge ?? ad.tier}
                    </span>

                    {/* Status pill */}
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusConfig.bg,
                        statusConfig.text
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Dates & remaining days */}
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-500">시작일</p>
                    <p className="mt-0.5 text-sm font-medium text-navy">
                      {formatDateKR(ad.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">종료일</p>
                    <p className="mt-0.5 text-sm font-medium text-navy">
                      {formatDateKR(ad.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">남은 일수</p>
                    <p className="mt-0.5 text-sm font-medium text-navy">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      {ad.remainingDays}일
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>광고 기간</span>
                    <span>{progressPercent}% 경과</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        ad.tier === "VIP" ? "bg-amber-400" : "bg-blue-500"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* View count */}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    조회수 {formatNumber(ad.views)}
                  </span>
                  {ad.tier === "VIP" && (
                    <>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        클릭률 {ad.ctr.toFixed(1)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Megaphone className="h-4 w-4" />
                        문의 {ad.inquiries}건
                      </span>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                {ad.status === "ACTIVE" && (
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={`/premium/listing-ad?extend=${ad.id}`}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      연장하기
                    </Link>
                    {ad.tier === "PREMIUM" && (
                      <Link
                        href={`/premium/listing-ad?upgrade=${ad.id}`}
                        className="flex items-center gap-1 rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                      >
                        <Crown className="h-3.5 w-3.5" />
                        프리미엄 매물 업그레이드
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Section (active ads only) */}
      {activeAds.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-bold text-navy">광고 성과 통계</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {activeAds.map((ad) => (
              <div
                key={`stats-${ad.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <p className="mb-3 text-xs font-medium text-gray-500 truncate">
                  {ad.listingTitle}
                </p>

                <div className="space-y-3">
                  {/* Total views */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Eye className="h-3.5 w-3.5" />
                      총 조회수
                    </span>
                    <span className="text-sm font-bold text-navy">
                      {formatNumber(ad.views)}
                    </span>
                  </div>

                  {/* CTR */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <BarChart3 className="h-3.5 w-3.5" />
                      클릭률
                    </span>
                    <span className="text-sm font-bold text-navy">
                      {ad.ctr.toFixed(1)}%
                    </span>
                  </div>

                  {/* Inquiries */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Megaphone className="h-3.5 w-3.5" />
                      문의 수
                    </span>
                    <span className="text-sm font-bold text-navy">
                      {ad.inquiries}건
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8">
        <Link
          href="/premium/listing-ad"
          className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-navy/30 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Megaphone className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">새 광고 신청하기</p>
              <p className="text-xs text-gray-500">
                매물을 더 많은 매수자에게 노출하세요
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Price info */}
      <p className="mt-6 text-center text-xs text-gray-400">
        오늘의 추천 매물 광고 ₩{formatNumber(200_000)}/30일 · 프리미엄 매물 광고 ₩
        {formatNumber(300_000)}/30일 (부가세 별도)
      </p>
    </div>
  );
}
