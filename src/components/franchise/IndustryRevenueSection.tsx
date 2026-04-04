"use client";

import { useEffect, useState } from 'react';

interface IndustryRevenueSectionProps {
  industry: string;
  brandName: string;
  brandAvgRevenue: number | null; // 만원
}

interface RegionalRevenue {
  region: string;
  avgRevenue: number; // 만원
  storeCount: number;
}

interface IndustryRevenueData {
  industryAvgRevenue: number; // 만원
  regionalData: RegionalRevenue[];
}

export default function IndustryRevenueSection({
  industry,
  brandName,
  brandAvgRevenue,
}: IndustryRevenueSectionProps) {
  const [data, setData] = useState<IndustryRevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          region: '전국',
          industry,
        });
        const response = await fetch(`/api/external/industry-revenue?${params}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [industry]);

  const formatRevenue = (amount: number) => {
    return `${amount.toLocaleString()}만원`;
  };

  const calculateDifference = () => {
    if (!brandAvgRevenue || !data) return null;
    const diff = ((brandAvgRevenue - data.industryAvgRevenue) / data.industryAvgRevenue) * 100;
    return diff;
  };

  const getSummaryMessage = () => {
    const diff = calculateDifference();
    if (diff === null) return null;

    const isHigher = diff > 0;
    const absDiff = Math.abs(diff).toFixed(1);

    return (
      <div className={`p-4 rounded-lg ${isHigher ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
        <p className={`text-sm ${isHigher ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
          해당 브랜드의 평균 매출은 업종 평균 대비 <span className="font-bold">{absDiff}%</span> {isHigher ? '높습니다' : '낮습니다'}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <p className="text-red-600 dark:text-red-400">업종 매출 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const maxRevenue = Math.max(
    brandAvgRevenue || 0,
    data.industryAvgRevenue,
    ...data.regionalData.map((r) => r.avgRevenue)
  );

  const sortedRegionalData = [...data.regionalData].sort((a, b) => b.avgRevenue - a.avgRevenue);

  return (
    <div className="space-y-6">
      {/* 요약 멘트 */}
      {getSummaryMessage()}

      {/* 이 브랜드 vs 업종 평균 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          브랜드 vs 업종 평균 비교
        </h3>
        <div className="space-y-4">
          {/* 브랜드 매출 */}
          {brandAvgRevenue !== null && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {brandName}
                </span>
                <span className="text-sm font-bold text-navy-700 dark:text-navy-400">
                  {formatRevenue(brandAvgRevenue)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-8 overflow-hidden">
                <div
                  className="h-full bg-navy-500 transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${(brandAvgRevenue / maxRevenue) * 100}%` }}
                >
                  {(brandAvgRevenue / maxRevenue) * 100 > 15 && (
                    <span className="text-xs text-white font-semibold">
                      {formatRevenue(brandAvgRevenue)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 업종 평균 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                업종 평균
              </span>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                {formatRevenue(data.industryAvgRevenue)}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-8 overflow-hidden">
              <div
                className="h-full bg-gray-400 dark:bg-gray-500 transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${(data.industryAvgRevenue / maxRevenue) * 100}%` }}
              >
                {(data.industryAvgRevenue / maxRevenue) * 100 > 15 && (
                  <span className="text-xs text-white font-semibold">
                    {formatRevenue(data.industryAvgRevenue)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 지역별 평균 매출 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          지역별 평균 매출
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  지역
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  평균매출
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  가맹점수
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRegionalData.map((item, index) => (
                <tr
                  key={item.region}
                  className={`${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'
                  } border-b border-gray-100 dark:border-gray-700 last:border-0`}
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                    {item.region}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100 font-semibold">
                    {formatRevenue(item.avgRevenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {item.storeCount.toLocaleString()}개
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
