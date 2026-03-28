"use client";

interface SellerTrustBadgeProps {
  avgRating: number;
  reviewCount: number;
  size?: "sm" | "md";
}

/**
 * 매도자 신뢰도 배지
 * - 4.5+ 리뷰 3개 이상: "우수 판매자" (초록)
 * - 3.5+ 리뷰 2개 이상: "신뢰 판매자" (파랑)
 * - 그 외 리뷰 있으면: 별점만 표시
 * - 리뷰 없으면: null
 */
export default function SellerTrustBadge({ avgRating, reviewCount, size = "sm" }: SellerTrustBadgeProps) {
  if (reviewCount === 0) return null;

  const isExcellent = avgRating >= 4.5 && reviewCount >= 3;
  const isTrusted = avgRating >= 3.5 && reviewCount >= 2;

  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  if (isExcellent) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClass} bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full font-medium`}>
        <svg className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        우수 판매자
      </span>
    );
  }

  if (isTrusted) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClass} bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium`}>
        <svg className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        신뢰 판매자
      </span>
    );
  }

  // 리뷰가 있지만 배지 기준 미달 -- 별점과 리뷰 수만 표시
  return (
    <span className={`inline-flex items-center gap-1 ${sizeClass} bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full font-medium`}>
      <svg className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {avgRating.toFixed(1)} ({reviewCount})
    </span>
  );
}
