"use client";

import { useEffect, useState } from 'react';

interface CommercialDistrictSectionProps {
  latitude: number;
  longitude: number;
  categoryId?: string;
}

interface CommercialDistrictData {
  totalStores: number;
  footTraffic: 'high' | 'medium' | 'low';
  avgMonthlyRevenue: number;
  industryDistribution: Array<{
    name: string;
    percentage: number;
  }>;
  residentPopulation: number;
  workingPopulation: number;
}

export default function CommercialDistrictSection({
  latitude,
  longitude,
  categoryId,
}: CommercialDistrictSectionProps) {
  const [data, setData] = useState<CommercialDistrictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          lat: latitude.toString(),
          lng: longitude.toString(),
        });
        if (categoryId) {
          params.append('categoryId', categoryId);
        }
        const response = await fetch(`/api/external/commercial-district?${params}`);
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
  }, [latitude, longitude, categoryId]);

  const getTrafficBadge = (level: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels = {
      high: '높음',
      medium: '중간',
      low: '낮음',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  const formatRevenue = (amount: number) => {
    return `${amount.toLocaleString()}만원`;
  };

  const getBarColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">📊 상권분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">📊 상권분석</h2>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
          <p className="text-red-600 dark:text-red-400">상권 정보를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">📊 상권분석</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 주변 상가 현황 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            주변 상가 현황
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.totalStores.toLocaleString()}개
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">반경 500m 내</p>
        </div>

        {/* 유동인구 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            유동인구
          </h3>
          <div className="mt-2">{getTrafficBadge(data.footTraffic)}</div>
        </div>

        {/* 평균 월 매출 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            평균 월 매출
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatRevenue(data.avgMonthlyRevenue)}
          </p>
        </div>

        {/* 주거/직장 인구 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
            주거/직장 인구
          </h3>
          <div className="space-y-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              주거인구: <span className="font-semibold">{data.residentPopulation.toLocaleString()}명</span>
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              직장인구: <span className="font-semibold">{data.workingPopulation.toLocaleString()}명</span>
            </p>
          </div>
        </div>

        {/* 주요 업종 분포 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            주요 업종 분포
          </h3>
          <div className="space-y-3">
            {data.industryDistribution.map((industry, index) => (
              <div key={industry.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{industry.name}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {industry.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-6 overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(index)} transition-all duration-300`}
                    style={{ width: `${industry.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
