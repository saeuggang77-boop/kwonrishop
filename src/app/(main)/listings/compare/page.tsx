"use client";

import { useCompareStore } from "@/store/compareStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface CompareListing {
  id: string;
  storeName: string | null;
  addressRoad: string | null;
  addressJibun: string | null;
  deposit: number;
  monthlyRent: number;
  premium: number;
  premiumNone: boolean;
  premiumNegotiable: boolean;
  areaPyeong: number | null;
  currentFloor: number | null;
  monthlyRevenue: number | null;
  monthlyProfit: number | null;
  viewCount: number;
  favoriteCount: number;
  category: { name: string } | null;
  subCategory: { name: string } | null;
  images: { url: string }[];
}

export default function ComparePage() {
  const { compareIds, removeFromCompare, clearCompare } = useCompareStore();
  const [listings, setListings] = useState<CompareListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareIds.length > 0) {
      fetchListings();
    } else {
      setLoading(false);
    }
  }, [compareIds]);

  async function fetchListings() {
    try {
      setLoading(true);
      const res = await fetch("/api/listings/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: compareIds }),
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error("Failed to fetch listings", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">매물 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (compareIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">비교할 매물이 없습니다</h2>
          <p className="text-gray-600 mb-6">매물 목록에서 비교할 매물을 선택해주세요 (최대 3개)</p>
          <Link
            href="/listings"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            매물 검색하러 가기
          </Link>
        </div>
      </div>
    );
  }

  const getBestValue = (key: keyof CompareListing, mode: "min" | "max") => {
    const values = listings
      .map((l) => l[key])
      .filter((v) => typeof v === "number") as number[];
    if (values.length === 0) return null;
    return mode === "min" ? Math.min(...values) : Math.max(...values);
  };

  const isBest = (value: number | null, bestValue: number | null) => {
    return value !== null && bestValue !== null && value === bestValue;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">매물 비교</h1>
            <p className="text-sm text-gray-600">{listings.length}개의 매물을 비교합니다</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCompare}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              전체 초기화
            </button>
            <Link
              href="/listings"
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              매물 더 추가
            </Link>
          </div>
        </div>

        {/* 비교 테이블 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                    항목
                  </th>
                  {listings.map((listing) => (
                    <th key={listing.id} className="px-4 py-3 text-left min-w-[250px]">
                      <div className="space-y-2">
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                          {listing.images[0] ? (
                            <Image
                              src={listing.images[0].url}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {listing.storeName || "상호명 미입력"}
                          </Link>
                          <button
                            onClick={() => removeFromCompare(listing.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-red-500"
                            title="제거"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* 주소 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    주소
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="px-4 py-3 text-sm text-gray-600">
                      {listing.addressRoad || listing.addressJibun || "-"}
                    </td>
                  ))}
                </tr>

                {/* 업종 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    업종
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="px-4 py-3 text-sm text-gray-600">
                      {listing.category?.name}
                      {listing.subCategory && ` > ${listing.subCategory.name}`}
                    </td>
                  ))}
                </tr>

                {/* 보증금 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    보증금
                  </td>
                  {listings.map((listing) => {
                    const best = getBestValue("deposit", "min");
                    return (
                      <td
                        key={listing.id}
                        className={`px-4 py-3 text-sm font-semibold ${
                          isBest(listing.deposit, best) ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {listing.deposit.toLocaleString()}만원
                      </td>
                    );
                  })}
                </tr>

                {/* 월세 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    월세
                  </td>
                  {listings.map((listing) => {
                    const best = getBestValue("monthlyRent", "min");
                    return (
                      <td
                        key={listing.id}
                        className={`px-4 py-3 text-sm font-semibold ${
                          isBest(listing.monthlyRent, best) ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {listing.monthlyRent.toLocaleString()}만원
                      </td>
                    );
                  })}
                </tr>

                {/* 권리금 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    권리금
                  </td>
                  {listings.map((listing) => {
                    const best = getBestValue("premium", "min");
                    const isNoPremium = listing.premiumNone;
                    return (
                      <td
                        key={listing.id}
                        className={`px-4 py-3 text-sm font-semibold ${
                          isNoPremium || isBest(listing.premium, best)
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        {isNoPremium
                          ? "무권리"
                          : `${listing.premium.toLocaleString()}만원${listing.premiumNegotiable ? " (협의)" : ""}`}
                      </td>
                    );
                  })}
                </tr>

                {/* 면적 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    면적
                  </td>
                  {listings.map((listing) => {
                    const best = getBestValue("areaPyeong", "max");
                    return (
                      <td
                        key={listing.id}
                        className={`px-4 py-3 text-sm font-semibold ${
                          isBest(listing.areaPyeong, best) ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {listing.areaPyeong ? `${listing.areaPyeong}평` : "-"}
                      </td>
                    );
                  })}
                </tr>

                {/* 층수 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    층수
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="px-4 py-3 text-sm text-gray-900">
                      {listing.currentFloor ? `${listing.currentFloor}층` : "-"}
                    </td>
                  ))}
                </tr>

                {/* 월 매출 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    월 매출
                  </td>
                  {listings.map((listing) => {
                    const best = getBestValue("monthlyRevenue", "max");
                    return (
                      <td
                        key={listing.id}
                        className={`px-4 py-3 text-sm font-semibold ${
                          isBest(listing.monthlyRevenue, best) ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {listing.monthlyRevenue
                          ? `${listing.monthlyRevenue.toLocaleString()}만원`
                          : "-"}
                      </td>
                    );
                  })}
                </tr>

                {/* 월 순이익 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    월 순이익
                  </td>
                  {listings.map((listing) => {
                    const best = getBestValue("monthlyProfit", "max");
                    return (
                      <td
                        key={listing.id}
                        className={`px-4 py-3 text-sm font-semibold ${
                          isBest(listing.monthlyProfit, best) ? "text-green-600" : "text-gray-900"
                        }`}
                      >
                        {listing.monthlyProfit
                          ? `${listing.monthlyProfit.toLocaleString()}만원`
                          : "-"}
                      </td>
                    );
                  })}
                </tr>

                {/* 조회수 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    조회수
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="px-4 py-3 text-sm text-gray-600">
                      {listing.viewCount.toLocaleString()}회
                    </td>
                  ))}
                </tr>

                {/* 관심수 */}
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 sticky left-0">
                    관심수
                  </td>
                  {listings.map((listing) => (
                    <td key={listing.id} className="px-4 py-3 text-sm text-gray-600">
                      {listing.favoriteCount.toLocaleString()}명
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/listings"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            더 많은 매물 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
