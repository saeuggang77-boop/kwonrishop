"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

interface CommercialDistrictSectionProps {
  latitude: number;
  longitude: number;
  categoryId?: string;
  categoryName?: string;
  listingId?: string;
}

interface CommercialDistrictData {
  totalStores: number;
  footTraffic: 'high' | 'medium' | 'low';
  avgMonthlyRevenue: number;
  industryDistribution: Array<{
    name: string;
    percentage: number;
    count: number;
  }>;
  residentPopulation: number;
  workingPopulation: number;
  sameCategoryCount: number;
  competitionLevel: "낮음" | "보통" | "높음";
  closureRate: number;
  nationalAvgClosureRate: number;
  closureStability: "안정" | "보통" | "위험";
  populationByTime: number[];
  peakTimes: string[];
  mainAgeGroup: string;
  mainAgeGroupPercentage: number;
  quarterChange: number;
}

export default function CommercialDistrictSection({
  latitude,
  longitude,
  categoryId,
  categoryName,
  listingId,
}: CommercialDistrictSectionProps) {
  const [data, setData] = useState<CommercialDistrictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lng: longitude.toString(),
        });
        if (categoryId) params.append('categoryId', categoryId);
        if (listingId) params.append('listingId', listingId);

        const response = await fetch(`/api/external/commercial-district?${params}`);
        if (response.status === 402) {
          // 미구매 → 미리보기 데이터 반환
          const preview = await response.json();
          setData(preview.preview);
          setPurchased(false);
          setLoading(false);
          return;
        }
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
        setPurchased(true);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [latitude, longitude, categoryId, listingId]);

  const getCompetitionBadge = (level: "낮음" | "보통" | "높음") => {
    const styles = {
      낮음: 'bg-green-200 text-green-800',
      보통: 'bg-orange-200 text-orange-800',
      높음: 'bg-red-200 text-red-800',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${styles[level]}`}>
        {level}
      </span>
    );
  };

  const getStabilityBadge = (level: "안정" | "보통" | "위험") => {
    const styles = {
      안정: 'bg-green-200 text-green-800',
      보통: 'bg-orange-200 text-orange-800',
      위험: 'bg-red-200 text-red-800',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${styles[level]}`}>
        {level}
      </span>
    );
  };

  const getBarColor = (index: number) => {
    const colors = [
      'bg-blue-400',
      'bg-purple-400',
      'bg-green-400',
      'bg-orange-400',
      'bg-pink-400',
    ];
    return colors[index % colors.length];
  };

  const isMatchingCategory = (industryName: string) => {
    if (!categoryName) return false;
    return industryName.includes(categoryName) || categoryName.includes(industryName);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>📊</span> 주변 상권 현황
              <span className="text-xs font-normal text-gray-400">(반경 500m)</span>
            </h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // 에러 시 섹션 숨김
  }

  // 미구매 시 핵심 지표만 공개 + 상세 데이터 블러 + CTA
  if (!purchased && data) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>📊</span> 주변 상권 현황
              <span className="text-xs font-normal text-gray-400">(반경 500m)</span>
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
              공공데이터 인증
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">출처: 소상공인시장진흥공단 상권정보서비스</p>
        </div>

        <div className="p-5 space-y-5">
          {/* 핵심 지표 4개 카드 - 무료 공개 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 일평균 유동인구 - 마스킹 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 text-center">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">일평균 유동인구</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">???<span className="text-sm font-normal">명</span></div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs text-gray-400">전분기比</span>
              </div>
            </div>
            {/* 동종 업종 수 - 공개 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl p-4 text-center">
              <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">동종업종 ({categoryName || '업종'})</div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{data.sameCategoryCount}<span className="text-sm font-normal">개</span></div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">경쟁강도</span>
                {getCompetitionBadge(data.competitionLevel)}
              </div>
            </div>
            {/* 총 점포 수 - 공개 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl p-4 text-center">
              <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">전체 점포 수</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{data.totalStores}<span className="text-sm font-normal">개</span></div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs text-gray-400">반경 500m 내</span>
              </div>
            </div>
            {/* 폐업률 - 공개 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 text-center">
              <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">업종 폐업률</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{data.closureRate.toFixed(1)}<span className="text-sm font-normal">%</span></div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {getStabilityBadge(data.closureStability)}
                <span className="text-xs text-gray-400">전국 {data.nationalAvgClosureRate}% 대비</span>
              </div>
            </div>
          </div>

          {/* 상세 데이터 - 블러 처리 */}
          <div className="relative">
            <div className="filter blur-sm select-none pointer-events-none space-y-3">
              {/* 업종 분포 바 차트 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">주변 업종 분포 TOP 5</h3>
                <div className="space-y-3">
                  {data.industryDistribution.slice(0, 2).map((industry, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{industry.name}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{industry.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-5 overflow-hidden">
                        <div className={`h-full ${getBarColor(index)} rounded transition-all`} style={{ width: `${industry.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 인구 구성 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">👥 주변 인구 구성</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">주거 인구</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">???명</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">직장 인구</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">???명</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🕐 시간대별 유동인구</h3>
                  <div className="flex items-end gap-1 h-16">
                    {[20, 30, 55, 90, 65, 50, 85, 70, 45, 15].map((h, i) => (
                      <div key={i} className="flex-1 bg-blue-300 dark:bg-blue-700 rounded-t" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA 오버레이 */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl">
              <div className="text-center space-y-3 p-6 max-w-md">
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">상권분석 리포트</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  시간대별 유동인구, 업종분포, 연령대 분석 등<br />
                  상세 상권 데이터를 확인하세요
                </p>
                <button
                  onClick={async () => {
                    if (!session) {
                      router.push('/login');
                      return;
                    }
                    try {
                      const res = await fetch('/api/payments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          productId: 'common-report',
                          listingId,
                        }),
                      });
                      const data = await res.json();
                      if (res.ok) {
                        const params = new URLSearchParams({
                          orderId: data.orderId,
                          amount: data.amount.toString(),
                          orderName: data.orderName,
                          customerName: session.user?.name || '고객',
                        });
                        router.push(`/payments/checkout?${params.toString()}`);
                      } else {
                        toast.error(data.error || '결제 요청 중 오류가 발생했습니다.');
                      }
                    } catch {
                      toast.error('결제 요청 중 오류가 발생했습니다.');
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
                >
                  리포트 구매하기 (30,000원)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 구매 완료 - 전체 데이터 표시
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📊</span> 주변 상권 현황
            <span className="text-xs font-normal text-gray-400">(반경 500m)</span>
          </h2>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
            공공데이터 인증
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">출처: 소상공인시장진흥공단 상권정보서비스</p>
      </div>

      <div className="p-5 space-y-5">
        {/* 핵심 지표 4개 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 일평균 유동인구 */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-4 text-center">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">일평균 유동인구</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {(data.populationByTime.reduce((a, b) => a + b, 0) / data.populationByTime.length).toFixed(0)}
              <span className="text-sm font-normal">명</span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className={`text-xs font-medium ${data.quarterChange > 0 ? 'text-green-600 dark:text-green-400' : data.quarterChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}`}>
                {data.quarterChange > 0 ? '▲' : data.quarterChange < 0 ? '▼' : ''} {Math.abs(data.quarterChange)}%
              </span>
              <span className="text-xs text-gray-400">전분기比</span>
            </div>
          </div>
          {/* 동종 업종 수 */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl p-4 text-center">
            <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">동종업종 ({categoryName || '업종'})</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{data.sameCategoryCount}<span className="text-sm font-normal">개</span></div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">경쟁강도</span>
              {getCompetitionBadge(data.competitionLevel)}
            </div>
          </div>
          {/* 총 점포 수 */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl p-4 text-center">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">전체 점포 수</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{data.totalStores}<span className="text-sm font-normal">개</span></div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-xs text-gray-400">반경 500m 내</span>
            </div>
          </div>
          {/* 폐업률 */}
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 text-center">
            <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">업종 폐업률</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{data.closureRate.toFixed(1)}<span className="text-sm font-normal">%</span></div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {getStabilityBadge(data.closureStability)}
              <span className="text-xs text-gray-400">전국 {data.nationalAvgClosureRate}% 대비</span>
            </div>
          </div>
        </div>

        {/* 업종 분포 바 차트 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">주변 업종 분포 TOP 5</h3>
          <div className="space-y-3">
            {data.industryDistribution.slice(0, 5).map((industry, index) => {
              const isMatch = isMatchingCategory(industry.name);
              return (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm ${isMatch ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                      {industry.name} {isMatch && <span className="text-xs text-orange-500 dark:text-orange-400 font-medium">(이 매물)</span>}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{industry.count}개 ({industry.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-5 overflow-hidden">
                    <div
                      className={`h-full ${isMatch ? 'bg-orange-400' : getBarColor(index)} rounded transition-all`}
                      style={{ width: `${industry.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 인구 구성 & 시간대별 유동인구 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">👥 주변 인구 구성</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">주거 인구</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{data.residentPopulation.toLocaleString()}명</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">직장 인구</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{data.workingPopulation.toLocaleString()}명</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">주요 연령대</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{data.mainAgeGroup} ({data.mainAgeGroupPercentage}%)</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">🕐 시간대별 유동인구</h3>
            <div className="flex items-end gap-1 h-16">
              {data.populationByTime.map((pop, i) => {
                const maxPop = Math.max(...data.populationByTime);
                const height = (pop / maxPop) * 100;
                return <div key={i} className="flex-1 bg-blue-400 dark:bg-blue-500 rounded-t" style={{ height: `${height}%` }} title={`${6 + i * 2}시: ${pop}명`}></div>;
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">06시</span>
              <span className="text-xs text-gray-400">12시</span>
              <span className="text-xs text-gray-400">18시</span>
              <span className="text-xs text-gray-400">24시</span>
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                피크타임: {data.peakTimes.join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
