import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatKRW, formatNumber } from "@/lib/utils/format";

export const metadata = { title: "유사 매물 비교" };

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { id: true, title: true, price: true, city: true, district: true, businessCategory: true },
  });

  if (!listing) notFound();

  const comparisons = await prisma.listingComparison.findMany({
    where: { listingId: id },
    orderBy: { radiusKm: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/listings/${id}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> 매물로 돌아가기
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-navy">유사 매물 비교</h1>
      <p className="mt-1 text-sm text-gray-500">
        {listing.title} — {formatKRW(listing.price)}
      </p>

      {comparisons.length === 0 ? (
        <div className="mt-12 rounded-xl border border-gray-200 bg-white py-16 text-center">
          <MapPin className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg font-medium text-gray-500">비교 데이터가 없습니다</p>
          <p className="mt-1 text-sm text-gray-500">주변 유사 매물이 아직 수집되지 않았습니다.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {comparisons.map((c) => {
            const myPrice = Number(listing.price);
            const avg = c.avgPremiumFee ? Number(c.avgPremiumFee) : null;
            const diff = avg ? myPrice - avg : null;
            const diffPercent = avg && avg > 0 ? ((myPrice - avg) / avg) * 100 : null;

            return (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-mint" />
                  <h3 className="font-bold text-navy">반경 {c.radiusKm}km 이내</h3>
                  <span className="text-sm text-gray-500">({formatNumber(c.comparableCount)}건 비교)</span>
                </div>

                {c.comparableCount === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">해당 반경에 비교 가능한 매물이 없습니다.</p>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="평균 권리금" value={c.avgPremiumFee ? formatKRW(c.avgPremiumFee) : "-"} />
                    <StatCard label="중간가" value={c.medianPrice ? formatKRW(c.medianPrice) : "-"} />
                    <StatCard label="최저가" value={c.minPrice ? formatKRW(c.minPrice) : "-"} />
                    <StatCard label="최고가" value={c.maxPrice ? formatKRW(c.maxPrice) : "-"} />
                  </div>
                )}

                {diff !== null && diffPercent !== null && (
                  <div className={`mt-4 rounded-lg px-4 py-3 text-sm ${diff > 0 ? "bg-red-50 text-red-700" : diff < 0 ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-700"}`}>
                    이 매물은 주변 평균 대비{" "}
                    <span className="font-bold">
                      {diff > 0 ? "+" : ""}{formatKRW(diff)} ({diffPercent > 0 ? "+" : ""}{diffPercent.toFixed(1)}%)
                    </span>
                    {diff > 0 ? " 높습니다" : diff < 0 ? " 낮습니다" : " 동일합니다"}
                  </div>
                )}

                {c.pricePercentile !== null && (
                  <p className="mt-2 text-xs text-gray-500">
                    가격 백분위: 상위 {(100 - c.pricePercentile).toFixed(0)}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-navy">{value}</p>
    </div>
  );
}
