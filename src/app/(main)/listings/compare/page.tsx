"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Scale, ArrowLeft, X, MapPin } from "lucide-react";
import { useCompare, type CompareItem } from "@/lib/compare-context";
import { formatKRW } from "@/lib/utils/format";
import {
  BUSINESS_CATEGORY_LABELS,
  SAFETY_GRADE_CONFIG,
  STORE_TYPE_LABELS,
} from "@/lib/utils/constants";
import { SafetyBadge } from "@/components/listings/safety-badge";

function numVal(v: string | null | undefined): number {
  if (!v) return 0;
  return Number(v) || 0;
}

function findMinMax(items: CompareItem[], getter: (i: CompareItem) => number) {
  const values = items.map(getter).filter((v) => v > 0);
  if (values.length < 2) return { min: -1, max: -1 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function cellHighlight(value: number, min: number, max: number, invert = false): string {
  if (value <= 0 || min === max || min < 0) return "";
  if (invert) {
    // For revenue/profit: highest = green (good), lowest = red (bad)
    if (value === max) return "bg-green-50 text-green-700";
    if (value === min) return "bg-red-50 text-red-700";
  } else {
    // For costs: lowest = green (good for buyer), highest = red (bad)
    if (value === min) return "bg-green-50 text-green-700";
    if (value === max) return "bg-red-50 text-red-700";
  }
  return "";
}

function BarChart({ items, getter, label }: { items: CompareItem[]; getter: (i: CompareItem) => number; label: string }) {
  const values = items.map(getter);
  const maxVal = Math.max(...values.filter((v) => v > 0), 1);

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-gray-500">{label}</p>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const val = values[idx];
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          return (
            <div key={item.id} className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate text-xs text-gray-600">{item.title}</span>
              <div className="flex-1">
                <div className="h-5 overflow-hidden rounded bg-gray-100">
                  <div
                    className="flex h-full items-center rounded bg-navy/80 px-2 text-[10px] font-bold text-white transition-all"
                    style={{ width: `${Math.max(pct, val > 0 ? 8 : 0)}%` }}
                  >
                    {val > 0 ? formatKRW(val) : ""}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const router = useRouter();

  const displayItems = items;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Scale className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-6 text-2xl font-bold text-navy">비교할 매물이 없습니다</h1>
        <p className="mt-2 text-gray-500">매물 목록에서 비교 담기 버튼을 눌러주세요</p>
        <Link
          href="/listings"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white hover:bg-navy/90"
        >
          <ArrowLeft className="h-4 w-4" />
          매물 둘러보기
        </Link>
      </div>
    );
  }

  if (items.length < 2) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Scale className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-6 text-2xl font-bold text-navy">매물을 1개 더 추가해주세요</h1>
        <p className="mt-2 text-gray-500">최소 2개 이상의 매물이 필요합니다 (현재 {items.length}개)</p>
        <Link
          href="/listings"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white hover:bg-navy/90"
        >
          <ArrowLeft className="h-4 w-4" />
          매물 더 담기
        </Link>
      </div>
    );
  }

  const depositMM = findMinMax(displayItems, (i) => numVal(i.price));
  const rentMM = findMinMax(displayItems, (i) => numVal(i.monthlyRent));
  const premiumMM = findMinMax(displayItems, (i) => numVal(i.premiumFee));
  const mgmtMM = findMinMax(displayItems, (i) => numVal(i.managementFee));
  const revenueMM = findMinMax(displayItems, (i) => numVal(i.monthlyRevenue));
  const profitMM = findMinMax(displayItems, (i) => numVal(i.monthlyProfit));

  const gridCols = displayItems.length === 2
    ? "grid-cols-[140px_1fr_1fr]"
    : displayItems.length === 3
    ? "grid-cols-[140px_1fr_1fr_1fr]"
    : "grid-cols-[140px_1fr_1fr_1fr_1fr]";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-navy">매물 비교</h1>
            <p className="text-sm text-gray-500">{displayItems.length}개 매물 비교 중</p>
          </div>
        </div>
        <button
          onClick={clear}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          전체 삭제
        </button>
      </div>

      {/* Compare content */}
      <div className="relative mt-8">
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          {/* Listing thumbnails & titles row */}
          <div className={`grid ${gridCols} border-b border-gray-200`}>
            <div className="flex items-center bg-gray-50 px-4 py-4">
              <span className="text-sm font-bold text-navy">매물 정보</span>
            </div>
            {displayItems.map((item) => (
              <div key={item.id} className="relative border-l border-gray-200 p-4">
                <button
                  onClick={() => remove(item.id)}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <Link href={`/listings/${item.id}`}>
                  <div className="mx-auto h-20 w-28 overflow-hidden rounded-lg bg-gray-100">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.title}
                        width={112}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <MapPin className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 text-center text-sm font-bold text-navy hover:text-navy/70">
                    {item.title}
                  </h3>
                </Link>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          <CompareRow label="업종" gridCols={gridCols}>
            {displayItems.map((item) => (
              <Cell key={item.id}>
                {BUSINESS_CATEGORY_LABELS[item.businessCategory] ?? item.businessCategory}
              </Cell>
            ))}
          </CompareRow>

          <CompareRow label="매장유형" gridCols={gridCols}>
            {displayItems.map((item) => (
              <Cell key={item.id}>
                {item.storeType ? (STORE_TYPE_LABELS[item.storeType] ?? item.storeType) : "-"}
              </Cell>
            ))}
          </CompareRow>

          <CompareRow label="지역" gridCols={gridCols}>
            {displayItems.map((item) => (
              <Cell key={item.id}>{item.city} {item.district}</Cell>
            ))}
          </CompareRow>

          <CompareRow label="층수" gridCols={gridCols}>
            {displayItems.map((item) => (
              <Cell key={item.id}>{item.floor != null ? `${item.floor}층` : "-"}</Cell>
            ))}
          </CompareRow>

          <CompareRow label="면적" gridCols={gridCols}>
            {displayItems.map((item) => (
              <Cell key={item.id}>
                {item.areaPyeong ? `${item.areaPyeong}평` : item.areaM2 ? `${item.areaM2}m²` : "-"}
              </Cell>
            ))}
          </CompareRow>

          {/* Divider */}
          <div className={`grid ${gridCols} border-t-2 border-gray-300`}>
            <div className="bg-navy/5 px-4 py-2">
              <span className="text-xs font-bold text-navy">가격 정보</span>
            </div>
            {displayItems.map((item) => (
              <div key={item.id} className="border-l border-gray-200 bg-navy/5" />
            ))}
          </div>

          <CompareRow label="보증금" gridCols={gridCols} highlight>
            {displayItems.map((item) => {
              const v = numVal(item.price);
              return (
                <Cell key={item.id} className={cellHighlight(v, depositMM.min, depositMM.max)}>
                  <span className="font-semibold">{v > 0 ? formatKRW(v) : "-"}</span>
                </Cell>
              );
            })}
          </CompareRow>

          <CompareRow label="월세" gridCols={gridCols} highlight>
            {displayItems.map((item) => {
              const v = numVal(item.monthlyRent);
              return (
                <Cell key={item.id} className={cellHighlight(v, rentMM.min, rentMM.max)}>
                  <span className="font-semibold">{v > 0 ? formatKRW(v) : "-"}</span>
                </Cell>
              );
            })}
          </CompareRow>

          <CompareRow label="권리금" gridCols={gridCols} highlight>
            {displayItems.map((item) => {
              const v = numVal(item.premiumFee);
              return (
                <Cell key={item.id} className={cellHighlight(v, premiumMM.min, premiumMM.max)}>
                  <span className="font-bold">{v > 0 ? formatKRW(v) : "무권리"}</span>
                </Cell>
              );
            })}
          </CompareRow>

          <CompareRow label="관리비" gridCols={gridCols} highlight>
            {displayItems.map((item) => {
              const v = numVal(item.managementFee);
              return (
                <Cell key={item.id} className={cellHighlight(v, mgmtMM.min, mgmtMM.max)}>
                  <span className="font-semibold">{v > 0 ? formatKRW(v) : "-"}</span>
                </Cell>
              );
            })}
          </CompareRow>

          <CompareRow label="월매출" gridCols={gridCols} highlight>
            {displayItems.map((item) => {
              const v = numVal(item.monthlyRevenue);
              return (
                <Cell key={item.id} className={cellHighlight(v, revenueMM.min, revenueMM.max, true)}>
                  <span className="font-semibold">{v > 0 ? formatKRW(v) : "-"}</span>
                </Cell>
              );
            })}
          </CompareRow>

          <CompareRow label="월수익" gridCols={gridCols} highlight>
            {displayItems.map((item) => {
              const v = numVal(item.monthlyProfit);
              return (
                <Cell key={item.id} className={cellHighlight(v, profitMM.min, profitMM.max, true)}>
                  <span className="font-semibold">{v > 0 ? formatKRW(v) : "-"}</span>
                </Cell>
              );
            })}
          </CompareRow>

          {/* Divider */}
          <div className={`grid ${gridCols} border-t-2 border-gray-300`}>
            <div className="bg-navy/5 px-4 py-2">
              <span className="text-xs font-bold text-navy">기타</span>
            </div>
            {displayItems.map((item) => (
              <div key={item.id} className="border-l border-gray-200 bg-navy/5" />
            ))}
          </div>

          <CompareRow label="안전도 등급" gridCols={gridCols}>
            {displayItems.map((item) => (
              <Cell key={item.id}>
                {item.safetyGrade && item.safetyGrade !== "C" ? (
                  <SafetyBadge grade={item.safetyGrade} />
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </Cell>
            ))}
          </CompareRow>

          <CompareRow label="프리미엄" gridCols={gridCols}>
            {displayItems.map((item) => (
              <Cell key={item.id}>
                {item.isPremium ? (
                  <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                    프리미엄
                  </span>
                ) : (
                  <span className="text-gray-400">일반</span>
                )}
              </Cell>
            ))}
          </CompareRow>
        </div>

        {/* Bar charts */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold text-navy">가격 비교</h3>
            <BarChart items={displayItems} getter={(i) => numVal(i.premiumFee)} label="권리금" />
            <BarChart items={displayItems} getter={(i) => numVal(i.price)} label="보증금" />
            <BarChart items={displayItems} getter={(i) => numVal(i.monthlyRent)} label="월세" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold text-navy">수익 비교</h3>
            <BarChart items={displayItems} getter={(i) => numVal(i.monthlyRevenue)} label="월매출" />
            <BarChart items={displayItems} getter={(i) => numVal(i.monthlyProfit)} label="월수익" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  gridCols,
  children,
  highlight,
}: {
  label: string;
  gridCols: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`grid ${gridCols} border-t border-gray-100 ${highlight ? "bg-white" : ""}`}>
      <div className="flex items-center bg-gray-50 px-4 py-3">
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-center border-l border-gray-200 px-3 py-3 text-center text-sm ${className}`}>
      {children}
    </div>
  );
}
