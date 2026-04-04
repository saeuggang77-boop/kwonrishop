"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface StatsData {
  listing: {
    viewCount: number;
    favoriteCount: number;
    createdAt: string;
    status: string;
    storeName: string | null;
    daysSinceCreation: number;
  };
  chatCount: number;
  recentFavorites: Array<{
    createdAt: string;
    userName: string;
  }>;
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mypage/stats");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/mypage/stats")
        .then((r) => {
          if (!r.ok) throw new Error("Failed to fetch stats");
          return r.json();
        })
        .then((d) => {
          setData(d);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "통계를 불러오지 못했습니다.");
          setLoading(false);
        });
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || "데이터를 불러올 수 없습니다."}</p>
          <Link
            href="/mypage"
            className="inline-block px-4 py-2 bg-navy-700 text-white rounded-lg text-sm font-medium hover:bg-navy-600"
          >
            마이페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const statusLabel = {
    DRAFT: "작성중",
    ACTIVE: "판매중",
    RESERVED: "예약중",
    SOLD: "판매완료",
    EXPIRED: "만료됨",
    DELETED: "삭제됨",
  }[data.listing.status] || data.listing.status;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">매물 통계</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {data.listing.storeName || "내 매물"}의 성과를 확인하세요
          </p>
        </div>
        <Link
          href="/mypage"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium"
        >
          ← 돌아가기
        </Link>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* 총 조회수 */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">총 조회수</span>
            <svg className="w-5 h-5 text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.listing.viewCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            일평균 {data.listing.daysSinceCreation > 0
              ? Math.round(data.listing.viewCount / data.listing.daysSinceCreation).toLocaleString()
              : data.listing.viewCount.toLocaleString()}
          </p>
        </div>

        {/* 총 관심 수 */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">총 관심 수</span>
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.listing.favoriteCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            관심율 {data.listing.viewCount > 0
              ? ((data.listing.favoriteCount / data.listing.viewCount) * 100).toFixed(1)
              : 0}%
          </p>
        </div>

        {/* 채팅 문의 수 */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">채팅 문의 수</span>
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.chatCount.toLocaleString()}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            문의율 {data.listing.viewCount > 0
              ? ((data.chatCount / data.listing.viewCount) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>

      {/* 매물 정보 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">매물 정보</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">등록일</span>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              {new Date(data.listing.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">경과일</span>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              {data.listing.daysSinceCreation}일
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">상태</span>
            <p className="font-medium text-gray-900 dark:text-white mt-1">
              <span className={`inline-block px-2 py-1 rounded text-xs ${
                data.listing.status === "ACTIVE" ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}>
                {statusLabel}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 전환 퍼널 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">전환 퍼널</h2>
        <div className="space-y-3">
          {[
            { label: "조회", value: data.listing.viewCount, color: "bg-navy-500", pct: 100 },
            { label: "관심 등록", value: data.listing.favoriteCount, color: "bg-amber-500", pct: data.listing.viewCount > 0 ? (data.listing.favoriteCount / data.listing.viewCount) * 100 : 0 },
            { label: "채팅 문의", value: data.chatCount, color: "bg-green-500", pct: data.listing.viewCount > 0 ? (data.chatCount / data.listing.viewCount) * 100 : 0 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="font-medium text-gray-900 dark:text-white">{item.value.toLocaleString()} <span className="text-gray-400 dark:text-gray-500 text-xs">({item.pct.toFixed(1)}%)</span></span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div className={`${item.color} h-2.5 rounded-full transition-all`} style={{ width: `${Math.max(item.pct, 1)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">매물 등록 후 {data.listing.daysSinceCreation}일 동안의 누적 데이터입니다.</p>
      </div>

      {/* 최근 관심 추가 이력 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">최근 관심 추가 이력</h2>
        {data.recentFavorites.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            아직 관심을 등록한 사용자가 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {data.recentFavorites.map((fav, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-950 flex items-center justify-center text-navy-700 dark:text-navy-400 text-sm font-bold">
                    {fav.userName[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fav.userName}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(fav.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
