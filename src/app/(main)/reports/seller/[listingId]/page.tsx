"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "@/lib/toast";
import type { SellerReportData } from "@/lib/report-generator";

export default function SellerReportPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [report, setReport] = useState<SellerReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listingId = params.listingId as string;

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(`/reports/seller/${listingId}`));
      return;
    }
    if (authStatus !== "authenticated") return;

    fetch(`/api/reports/seller-analysis?listingId=${listingId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.hasReport && data.report?.reportData) {
          setReport(data.report.reportData as SellerReportData);
        } else if (data.needsPurchase) {
          setError("NEED_PURCHASE");
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("리포트를 찾을 수 없습니다");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("리포트를 불러오는 중 오류가 발생했습니다");
        setLoading(false);
      });
  }, [authStatus, listingId, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error === "NEED_PURCHASE") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">시장분석 리포트</h1>
        <p className="text-gray-500 mb-6">아직 구매한 리포트가 없습니다</p>
        <Link
          href={`/pricing?listingId=${listingId}&scope=seller-report`}
          className="inline-block px-6 py-3 bg-green-700 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
        >
          리포트 구매하기 (15,000원)
        </Link>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error || "리포트를 불러올 수 없습니다"}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href={`/listings/${listingId}`} className="hover:text-green-700">내 매물</Link>
          <span>/</span>
          <span>시장분석 리포트</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">매도자 시장분석 리포트</h1>
        <p className="text-sm text-gray-500 mt-1">
          {report.listing.address} | {report.listing.category}
          {report.listing.subCategory && ` > ${report.listing.subCategory}`}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          생성일: {new Date(report.generatedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* 섹션 1: 내 매물 포지셔닝 */}
      <ReportCard title="내 매물 포지셔닝" icon="📍">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            이 지역 <span className="font-medium text-gray-900">{report.listing.category}</span> 매물{" "}
            <span className="font-bold text-green-700">{report.positioning.totalCompetitors}개</span> 중{" "}
            가격 <span className="font-bold text-green-700">{report.positioning.pricePosition} {report.positioning.percentile}%</span>입니다.
          </p>

          {/* 포지셔닝 바 */}
          <div className="relative">
            <div className="h-8 bg-gradient-to-r from-green-100 via-yellow-100 to-red-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 w-1 bg-green-700 rounded z-10"
                style={{ left: `${Math.min(Math.max(report.positioning.percentile, 2), 98)}%` }}
              />
              <div
                className="absolute -top-6 transform -translate-x-1/2 text-xs font-bold text-green-700 whitespace-nowrap"
                style={{ left: `${Math.min(Math.max(report.positioning.percentile, 5), 95)}%` }}
              >
                내 매물
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>저가</span>
              <span>평균</span>
              <span>고가</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <MiniStat label="경쟁 매물" value={`${report.positioning.totalCompetitors}건`} />
            <MiniStat label="가격 순위" value={`${report.positioning.rank}위`} />
            <MiniStat label="가격 위치" value={report.positioning.pricePosition} />
          </div>
        </div>
      </ReportCard>

      {/* 섹션 2: 가격 적정성 진단 */}
      <ReportCard title="가격 적정성 진단" icon="💰">
        <div className="space-y-4">
          {/* 판정 배지 */}
          <div className="text-center">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
              report.priceAdequacy.verdictColor === "green"
                ? "bg-green-100 text-green-700"
                : report.priceAdequacy.verdictColor === "orange"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
            }`}>
              {report.priceAdequacy.verdict}
            </span>
          </div>

          {/* 개별 가격 비교 */}
          <PriceCompareBar
            label="보증금"
            mine={report.listing.deposit}
            avg={report.priceAdequacy.avgDeposit}
            diff={report.priceAdequacy.depositDiff}
          />
          <PriceCompareBar
            label="월세"
            mine={report.listing.monthlyRent}
            avg={report.priceAdequacy.avgMonthlyRent}
            diff={report.priceAdequacy.rentDiff}
          />
          {!report.listing.premiumNone && report.priceAdequacy.premiumDiff !== null && (
            <PriceCompareBar
              label="권리금"
              mine={report.listing.premium}
              avg={report.priceAdequacy.avgPremium}
              diff={report.priceAdequacy.premiumDiff}
            />
          )}
        </div>
      </ReportCard>

      {/* 섹션 3: 경쟁 현황 */}
      <ReportCard title="경쟁 현황" icon="🏪">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="동일 지역·업종 매물" value={`${report.competition.count}건`} sub="" />
            <StatCard
              label="경쟁 강도"
              value={report.competition.intensity}
              sub=""
              valueColor={
                report.competition.intensity === "높음" ? "text-red-600"
                  : report.competition.intensity === "보통" ? "text-orange-600"
                    : "text-green-600"
              }
            />
            <StatCard label="최근 30일 신규" value={`${report.competition.recentNew}건`} sub="" />
            <StatCard label="최근 30일 거래완료" value={`${report.competition.recentSold}건`} sub="" />
          </div>

          {report.competition.count > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">경쟁 매물 평균 가격</p>
              <div className="flex gap-4 text-sm">
                <span>보증금 <span className="font-bold text-gray-900">{fmt(report.competition.avgDeposit)}만</span></span>
                <span>권리금 <span className="font-bold text-gray-900">{fmt(report.competition.avgPremium)}만</span></span>
              </div>
            </div>
          )}
        </div>
      </ReportCard>

      {/* 섹션 4: 상권 트렌드 */}
      <ReportCard title="상권 트렌드" icon="📈">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            {report.marketTrend.region} | {report.marketTrend.quarter} 기준
          </p>

          <div className="grid grid-cols-2 gap-3">
            <TrendItem
              label="공실률"
              value={`${report.marketTrend.vacancyRate}%`}
              compare={`전국 ${report.marketTrend.nationalAvgVacancyRate}%`}
              good={report.marketTrend.vacancyRate < report.marketTrend.nationalAvgVacancyRate}
            />
            <TrendItem
              label="임대가 변동"
              value={`${report.marketTrend.rentChangeRate > 0 ? "+" : ""}${report.marketTrend.rentChangeRate.toFixed(1)}%`}
              compare="전분기 대비"
              good={report.marketTrend.rentChangeRate <= 0}
            />
            <TrendItem
              label="폐업률"
              value={`${report.marketTrend.closureRate}%`}
              compare="전국 12.0%"
              good={report.marketTrend.closureRate < 12}
            />
            <TrendItem
              label="유동인구"
              value={report.marketTrend.floatingPopulation}
              compare=""
              good={report.marketTrend.floatingPopulation === "상"}
            />
          </div>
        </div>
      </ReportCard>

      {/* 섹션 5: 매각 전략 제안 */}
      <ReportCard title="매각 전략 제안" icon="🎯">
        <div className="space-y-3">
          {report.strategies.map((strategy, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                {idx + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{strategy}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6 p-4 bg-green-50 rounded-xl">
          <p className="text-sm font-medium text-green-800 mb-2">노출을 높이고 싶다면?</p>
          <Link
            href={`/pricing?listingId=${listingId}`}
            className="inline-block px-4 py-2 bg-green-700 text-white text-sm rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            광고 상품 보기
          </Link>
        </div>
      </ReportCard>

      {/* 하단 안내 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-xs text-gray-400 text-center">
          이 리포트는 공공 데이터와 플랫폼 내 데이터를 기반으로 분석한 참고 자료입니다.
          <br />
          실제 거래 시에는 전문가 상담을 권장합니다.
        </p>
      </div>
    </div>
  );
}

/* ============================================
   Sub-components
   ============================================ */

function ReportCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
      <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
        <span className="text-lg">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function PriceCompareBar({ label, mine, avg, diff }: { label: string; mine: number; avg: number; diff: number }) {
  const fmt = (n: number) => n.toLocaleString();
  const isLower = diff < 0;
  const maxVal = Math.max(mine, avg) * 1.3 || 1;
  const myWidth = Math.min((mine / maxVal) * 100, 100);
  const avgWidth = Math.min((avg / maxVal) * 100, 100);

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-xs font-medium ${isLower ? "text-green-600" : diff > 0 ? "text-red-600" : "text-gray-600"}`}>
          {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
        </span>
      </div>

      {/* 내 매물 바 */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-10 shrink-0">내 매물</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isLower ? "bg-green-400" : diff > 0 ? "bg-red-400" : "bg-green-400"}`}
              style={{ width: `${myWidth}%` }}
            />
          </div>
          <span className="text-xs font-bold text-gray-900 w-16 text-right">{fmt(mine)}만</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-10 shrink-0">평균</span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-300"
              style={{ width: `${avgWidth}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-16 text-right">{fmt(avg)}만</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, valueColor }: { label: string; value: string; sub: string; valueColor?: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${valueColor || "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function TrendItem({ label, value, compare, good }: { label: string; value: string; compare: string; good: boolean }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-base font-bold text-gray-900">{value}</span>
        <span className={`w-2 h-2 rounded-full ${good ? "bg-green-500" : "bg-orange-500"}`} />
      </div>
      {compare && <p className="text-xs text-gray-400 mt-0.5">{compare}</p>}
    </div>
  );
}
