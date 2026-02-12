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

// ── 구독 시스템 (비활성화 — 레거시 참조용) ──
export const SUBSCRIPTION_TIER_LABELS: Record<string, string> = {
  FREE: "무료",
  PRO: "프로",
  PREMIUM: "프리미엄",
};

// ── 매도자 광고 요금 ──
export const SELLER_AD_PLANS = [
  {
    tier: "PREMIUM" as const,
    label: "프리미엄 광고",
    price: 200_000,
    priceWithVat: 220_000,
    days: 30,
    features: [
      "매물 목록 상위 노출",
      "\"프리미엄\" 배지 표시",
      "그린 테두리 카드 디자인",
      "기본 조회수 통계",
    ],
  },
  {
    tier: "VIP" as const,
    label: "VIP 광고",
    price: 300_000,
    priceWithVat: 330_000,
    days: 30,
    recommended: true,
    features: [
      "매물 목록 최상단 고정",
      "홈페이지 프리미엄 캐러셀 노출",
      "\"VIP\" 배지 + 골드 테두리 카드",
      "권리진단서 BASIC 1회 무료 포함",
      "안전도 등급 상세 표시",
      "상세 조회수 통계",
      "\"안심거래\" 배지 부여",
    ],
  },
];

// ── 매수자 권리진단서 요금 (건별 판매) ──
export const REPORT_PLANS = [
  {
    tier: "BASIC" as const,
    label: "BASIC 권리진단서",
    price: 20_000,
    priceWithVat: 22_000,
    features: [
      "권리금 적정성 평가",
      "지역/업종 평균 비교",
      "권리 위험요소 기본 분석",
      "종합 위험 등급 판정",
    ],
  },
  {
    tier: "PREMIUM" as const,
    label: "PREMIUM 권리진단서",
    price: 40_000,
    priceWithVat: 44_000,
    features: [
      "BASIC 전체 항목 포함",
      "임대차 계약 체크리스트 20항목",
      "상세 위험요소 분석",
      "PDF 리포트 다운로드",
    ],
  },
];

// ── 매도자 무료 등록 제한 ──
export const FREE_LISTING_LIMIT_PER_MONTH = 2;

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

export const SAFETY_GRADE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; description: string }> = {
  A: { label: "A등급", color: "text-green-700", bg: "bg-green-100", border: "border-green-300", description: "매출증빙 완료 + 권리금 적정" },
  B: { label: "B등급", color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-300", description: "일부 증빙 있음" },
  C: { label: "C등급", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300", description: "증빙 부족" },
  D: { label: "D등급", color: "text-red-700", bg: "bg-red-100", border: "border-red-300", description: "주의 필요" },
};

export const FRANCHISE_CATEGORIES = ["외식", "도소매", "서비스"] as const;

export const PREMIUM_AD_CONFIG: Record<string, { label: string; badge: string; color: string; bg: string; border: string; gradient: string }> = {
  PREMIUM: { label: "프리미엄", badge: "프리미엄", color: "text-blue-800",  bg: "bg-blue-50",    border: "border-blue-300", gradient: "from-blue-100 to-blue-50" },
  VIP:     { label: "VIP",     badge: "VIP",     color: "text-amber-800",  bg: "bg-amber-50",    border: "border-amber-400", gradient: "from-amber-200 via-amber-100 to-amber-50" },
};

export const DIAGNOSIS_BADGE_CONFIG = {
  label: "권리진단 완료",
  color: "text-emerald-700",
  bg: "bg-emerald-50",
  border: "border-emerald-300",
} as const;

export const PREMIUM_AD_PLANS = [
  { tier: "PREMIUM", price: 200_000, days: 30, features: ["매물 목록 상위 노출", "프리미엄 배지 표시", "그린 테두리 카드 디자인", "기본 조회수 통계"] },
  { tier: "VIP",     price: 300_000, days: 30, features: ["매물 목록 최상단 고정", "홈페이지 프리미엄 캐러셀 노출", "VIP 배지 + 골드 테두리 카드", "권리진단서 BASIC 1회 무료", "안심거래 배지 부여", "상세 조회수 통계"] },
];

// 업종 대분류 → 세부 카테고리 매핑 (레퍼런스 사이트 기준)
export const BUSINESS_CATEGORY_GROUPS: Record<string, string[]> = {
  외식업: ["KOREAN_FOOD", "CHINESE_FOOD", "JAPANESE_FOOD", "WESTERN_FOOD", "CHICKEN", "PIZZA", "CAFE_BAKERY", "BAR_PUB", "BUNSIK", "DELIVERY", "OTHER_FOOD"],
  서비스업: ["SERVICE"],
  "도/소매업": ["RETAIL"],
  "예술/스포츠/시설업": ["ENTERTAINMENT"],
  "교육/학원업": ["EDUCATION"],
  숙박업: ["ACCOMMODATION"],
  기타: ["OTHER"],
};

// 업종 세부 카테고리 (이모지 + 라벨) — 매물등록 스텝 폼용
export const BUSINESS_SUBCATEGORIES: Record<string, { key: string; emoji: string; label: string; subtype?: string }[]> = {
  외식업: [
    { key: "KOREAN_FOOD", emoji: "🍚", label: "한식" },
    { key: "CHINESE_FOOD", emoji: "🥟", label: "중식" },
    { key: "JAPANESE_FOOD", emoji: "🍣", label: "일식/회" },
    { key: "WESTERN_FOOD", emoji: "🍝", label: "양식" },
    { key: "CHICKEN", emoji: "🍗", label: "치킨" },
    { key: "PIZZA", emoji: "🍕", label: "피자" },
    { key: "CAFE_BAKERY", emoji: "☕", label: "카페/베이커리" },
    { key: "BAR_PUB", emoji: "🍺", label: "주류/호프" },
    { key: "BUNSIK", emoji: "🍜", label: "분식" },
    { key: "DELIVERY", emoji: "🛵", label: "배달전문" },
    { key: "OTHER_FOOD", emoji: "🍴", label: "기타 외식" },
  ],
  서비스업: [
    { key: "SERVICE", emoji: "💇", label: "미용실", subtype: "미용실" },
    { key: "SERVICE", emoji: "💅", label: "네일/속눈썹", subtype: "네일/속눈썹" },
    { key: "SERVICE", emoji: "🧖", label: "피부관리", subtype: "피부관리" },
    { key: "SERVICE", emoji: "👔", label: "세탁소", subtype: "세탁소" },
    { key: "SERVICE", emoji: "🔧", label: "수리/정비", subtype: "수리/정비" },
    { key: "SERVICE", emoji: "📱", label: "통신/휴대폰", subtype: "통신/휴대폰" },
    { key: "SERVICE", emoji: "🏢", label: "기타 서비스", subtype: "기타 서비스" },
  ],
  "도/소매업": [
    { key: "RETAIL", emoji: "🏪", label: "편의점", subtype: "편의점" },
    { key: "RETAIL", emoji: "🥬", label: "마트/슈퍼", subtype: "마트/슈퍼" },
    { key: "RETAIL", emoji: "👗", label: "의류/패션", subtype: "의류/패션" },
    { key: "RETAIL", emoji: "💊", label: "약국", subtype: "약국" },
    { key: "RETAIL", emoji: "🌸", label: "꽃집", subtype: "꽃집" },
    { key: "RETAIL", emoji: "📦", label: "기타 소매", subtype: "기타 소매" },
  ],
  "예술/스포츠/시설업": [
    { key: "ENTERTAINMENT", emoji: "🎤", label: "노래방", subtype: "노래방" },
    { key: "ENTERTAINMENT", emoji: "🎱", label: "당구장", subtype: "당구장" },
    { key: "ENTERTAINMENT", emoji: "🏋️", label: "헬스장/PT", subtype: "헬스장/PT" },
    { key: "ENTERTAINMENT", emoji: "🧘", label: "요가/필라테스", subtype: "요가/필라테스" },
    { key: "ENTERTAINMENT", emoji: "⚽", label: "축구/풋살장", subtype: "축구/풋살장" },
    { key: "ENTERTAINMENT", emoji: "🎮", label: "PC방/오락실", subtype: "PC방/오락실" },
  ],
  "교육/학원업": [
    { key: "EDUCATION", emoji: "📚", label: "입시학원", subtype: "입시학원" },
    { key: "EDUCATION", emoji: "🎨", label: "예체능학원", subtype: "예체능학원" },
    { key: "EDUCATION", emoji: "🌐", label: "어학원", subtype: "어학원" },
    { key: "EDUCATION", emoji: "👶", label: "유아교육", subtype: "유아교육" },
    { key: "EDUCATION", emoji: "💻", label: "코딩/IT교육", subtype: "코딩/IT교육" },
    { key: "EDUCATION", emoji: "📝", label: "기타 학원", subtype: "기타 학원" },
  ],
  숙박업: [
    { key: "ACCOMMODATION", emoji: "🏨", label: "모텔", subtype: "모텔" },
    { key: "ACCOMMODATION", emoji: "🏠", label: "펜션/민박", subtype: "펜션/민박" },
    { key: "ACCOMMODATION", emoji: "🏡", label: "게스트하우스", subtype: "게스트하우스" },
    { key: "ACCOMMODATION", emoji: "🏢", label: "기타 숙박", subtype: "기타 숙박" },
  ],
  기타: [
    { key: "OTHER", emoji: "🔖", label: "기타" },
  ],
};

// 매물 특성/테마 옵션 — 매물등록 스텝 폼용
export const STORE_FEATURES = [
  "복층", "테라스", "신축", "역세권", "코너자리",
  "대로변", "엘리베이터", "화장실분리", "주방분리", "1층",
] as const;

export const BBS_CATEGORIES = ["공지사항", "이용가이드", "창업정보", "알림공지"] as const;

export const FLOOR_OPTIONS = [
  { label: "지하", value: "B1" },
  { label: "1층", value: "1" },
  { label: "2층", value: "2" },
  { label: "3층 이상", value: "3+" },
] as const;

export const AREA_OPTIONS = [
  { label: "10평 이하", min: 0, max: 33 },
  { label: "10평대", min: 33, max: 66 },
  { label: "20평대", min: 66, max: 99 },
  { label: "30평대", min: 99, max: 132 },
  { label: "40평대", min: 132, max: 165 },
  { label: "50평 이상", min: 165, max: 999999 },
] as const;

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

export const EXPERT_CATEGORY_LABELS: Record<string, string> = {
  LAW: "법률",
  INTERIOR: "인테리어",
  DEMOLITION: "철거",
  ACCOUNTING: "세무회계",
  REALESTATE: "부동산",
};

export const EXPERT_CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  LAW: { bg: "bg-blue-100", text: "text-blue-700" },
  INTERIOR: { bg: "bg-orange-100", text: "text-orange-700" },
  DEMOLITION: { bg: "bg-red-100", text: "text-red-700" },
  ACCOUNTING: { bg: "bg-green-100", text: "text-green-700" },
  REALESTATE: { bg: "bg-purple-100", text: "text-purple-700" },
};

export const EXPERT_INQUIRY_CATEGORIES = [
  "권리금분쟁",
  "임대차계약",
  "인테리어견적",
  "철거견적",
  "세무상담",
  "입지분석",
  "권리분석",
  "기타",
] as const;

export const EXPERT_INQUIRY_STATUS_LABELS: Record<string, string> = {
  PENDING: "대기중",
  REPLIED: "답변완료",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

export const INQUIRY_STATUS_LABELS: Record<string, string> = {
  PENDING: "대기중",
  REPLIED: "답변완료",
  CANCELLED: "종료",
};

export const INQUIRY_STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-100", text: "text-yellow-700" },
  REPLIED: { bg: "bg-green-100", text: "text-green-700" },
  CANCELLED: { bg: "bg-gray-100", text: "text-gray-500" },
};
