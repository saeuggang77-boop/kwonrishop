export const BUSINESS_CATEGORY_LABELS: Record<string, string> = {
  KOREAN_FOOD: "한식",
  CHINESE_FOOD: "중식",
  JAPANESE_FOOD: "일식/회",
  WESTERN_FOOD: "양식",
  CHICKEN: "치킨",
  PIZZA: "피자",
  CAFE_BAKERY: "카페/베이커리",
  BAR_PUB: "주류/호프",
  BUNSIK: "분식",
  DELIVERY: "배달전문",
  OTHER_FOOD: "기타 외식",
  SERVICE: "서비스업",
  RETAIL: "도소매업",
  ENTERTAINMENT: "오락/스포츠",
  EDUCATION: "교육/학원",
  ACCOMMODATION: "숙박업",
  OTHER: "기타",
};

export const STORE_TYPE_LABELS: Record<string, string> = {
  GENERAL_STORE: "일반상가",
  FRANCHISE: "프랜차이즈",
  FOOD_STREET: "먹자골목",
  OFFICE: "사무실",
  COMPLEX_MALL: "복합상가",
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

export const FRANCHISE_CATEGORIES = ["외식", "도소매", "서비스"] as const;

export const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "최신 등록순" },
  { value: "favoriteCount-desc", label: "좋아요 많은순" },
  { value: "price-asc", label: "투자금 낮은순" },
  { value: "monthlyRevenue-desc", label: "월매출 높은순" },
  { value: "monthlyProfit-desc", label: "월수익 높은순" },
] as const;

export const REGIONS: Record<string, string[]> = {
  서울특별시: ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  경기도: ["고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
  부산광역시: ["강서구", "금정구", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
  인천광역시: ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "중구"],
  대구광역시: ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
  대전광역시: ["대덕구", "동구", "서구", "유성구", "중구"],
  광주광역시: ["광산구", "남구", "동구", "북구", "서구"],
  울산광역시: ["남구", "동구", "북구", "울주군", "중구"],
  세종특별자치시: ["세종시"],
};
