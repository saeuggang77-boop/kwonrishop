"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';

interface CommercialDistrictSectionProps {
  latitude: number;
  longitude: number;
  categoryId?: string;
  listingId?: string;
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

  // 미구매 시 블러 + CTA
  if (!purchased && data) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">📊 상권분석</h2>
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 filter blur-sm select-none pointer-events-none">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">주변 상가 현황</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.totalStores.toLocaleString()}개</p>
              <p className="text-xs text-gray-500 mt-1">반경 500m 내</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">유동인구</h3>
              <div className="mt-2">{getTrafficBadge(data.footTraffic)}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">평균 월 매출</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">???만원</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">주거/직장 인구</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">주거인구: ???명</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">직장인구: ???명</p>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-gray-900/60 rounded-xl">
            <div className="text-center space-y-3 p-6">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">상권분석 리포트</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">유동인구, 업종분포, 평균매출 등<br />상세 상권 데이터를 확인하세요</p>
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
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                리포트 구매하기 (30,000원)
              </button>
            </div>
          </div>
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
