export const RIGHTS_CATEGORY_LABELS: Record<string, string> = {
  JEONSE: "전세권",
  WOLSE: "월세",
  MORTGAGE: "저당권/근저당권",
  OWNERSHIP: "소유권",
  SUPERFICIES: "지상권",
  EASEMENT: "지역권",
  LIEN: "유치권",
  PROVISIONAL_REG: "가등기",
  LEASE_RIGHT: "임차권",
  AUCTION: "경매",
  OTHER: "기타",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "아파트",
  VILLA: "빌라/다세대",
  OFFICETEL: "오피스텔",
  DETACHED_HOUSE: "단독주택",
  COMMERCIAL: "상가",
  OFFICE: "사무실",
  LAND: "토지",
  FACTORY: "공장/창고",
  OTHER: "기타",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  REGISTRY_COPY: "등기부등본",
  BUILDING_LEDGER: "건축물대장",
  LAND_LEDGER: "토지대장",
  CADASTRAL_MAP: "지적도",
  CONTRACT: "계약서",
  ID_VERIFICATION: "신분증",
  BUSINESS_LICENSE: "사업자등록증",
  OTHER: "기타",
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "임시저장",
  ACTIVE: "활성",
  PENDING_VERIFICATION: "검증 대기",
  HIDDEN: "숨김",
  SOLD: "거래완료",
  EXPIRED: "만료",
  DELETED: "삭제됨",
};

export const FRAUD_SEVERITY_LABELS: Record<string, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  CRITICAL: "심각",
};

export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  FREE: "무료",
  BASIC: "베이직",
  PREMIUM: "프리미엄",
  ENTERPRISE: "엔터프라이즈",
};

export const SUBSCRIPTION_PRICES: Record<string, number> = {
  FREE: 0,
  BASIC: 29_000,
  PREMIUM: 79_000,
  ENTERPRISE: 0,
};

export const DEEP_REPORT_PRICE = 39_000;

export const MAX_IMAGES_PER_LISTING = 20;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
