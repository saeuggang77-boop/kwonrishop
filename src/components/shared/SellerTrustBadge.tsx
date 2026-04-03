"use client";

interface SellerTrustBadgeProps {
  avgRating?: number;
  reviewCount?: number;
  size?: "sm" | "md";
}

/**
 * 매도자 신뢰도 배지 - Q&A 전환으로 별점 제거되어 비활성화
 * 호환성을 위해 props는 선택적으로 유지하되 항상 null 반환
 */
export default function SellerTrustBadge(_props: SellerTrustBadgeProps) {
  return null;
}
