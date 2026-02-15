/**
 * 매물 수익분석 열람 요금제 정의
 */

export const VIEWER_PLANS = {
  SINGLE: {
    id: "SINGLE",
    name: "건별 열람",
    price: 2_900,
    description: "이 매물 1개, 구매 후 7일간 열람",
    durationDays: 7,
  },
  MONTHLY: {
    id: "MONTHLY",
    name: "월 구독",
    price: 9_900,
    description: "모든 매물 수익 데이터 무제한 열람",
    durationDays: 30,
    badge: "추천",
  },
  YEARLY: {
    id: "YEARLY",
    name: "연 구독",
    price: 79_000,
    description: "월 6,583원 — 33% 할인",
    durationDays: 365,
    monthlyEquivalent: 6_583,
    discountPct: 33,
  },
} as const;

export type ViewerPlanId = keyof typeof VIEWER_PLANS;

/** 무료 체험 설정 */
export const FREE_TRIAL = {
  durationDays: 3,
  maxListings: 1,
  description: "첫 가입 시 3일 무료 체험 (1개 매물)",
} as const;

/** 무료로 공개되는 항목 */
export const FREE_FEATURES = [
  "사진, 제목, 위치, 업종",
  "가격정보 (보증금/월세/권리금/관리비)",
  "매물정보 (면적/층수/영업기간)",
  "월매출/월수익 숫자",
  "투자회수 기간 숫자",
  "주변시세 비교",
  "위치정보, 전문가 문의, 댓글",
] as const;

/** 유료 구독 시 추가 열람 항목 */
export const PAID_FEATURES = [
  "상세 비용 구조 (재료비/인건비/월세 등)",
  "매출 구성 도넛 차트",
  "투자 수익률 상세 분석",
  "매출 증빙자료 원본 (B등급)",
] as const;

/** A등급 전용 추가 항목 */
export const GRADE_A_FEATURES = [
  "홈택스 인증 월별 매출 데이터",
] as const;
