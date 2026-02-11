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

export const SAFETY_GRADE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; description: string }> = {
  A: { label: "A등급", color: "text-green-700", bg: "bg-green-100", border: "border-green-300", description: "매출증빙 완료 + 권리금 적정" },
  B: { label: "B등급", color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-300", description: "일부 증빙 있음" },
  C: { label: "C등급", color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-300", description: "증빙 부족" },
  D: { label: "D등급", color: "text-red-700", bg: "bg-red-100", border: "border-red-300", description: "주의 필요" },
};

export const FRANCHISE_CATEGORIES = ["외식", "도소매", "서비스"] as const;

export const PREMIUM_AD_CONFIG: Record<string, { label: string; badge: string; color: string; bg: string; border: string; gradient: string }> = {
  BASIC:   { label: "BASIC",   badge: "AD",      color: "text-amber-700",  bg: "bg-amber-50",    border: "border-amber-300", gradient: "from-amber-100 to-amber-50" },
  PREMIUM: { label: "PREMIUM", badge: "PREMIUM", color: "text-purple-700", bg: "bg-purple-50",   border: "border-purple-300", gradient: "from-purple-100 to-purple-50" },
  VIP:     { label: "VIP",     badge: "VIP",     color: "text-yellow-800", bg: "bg-yellow-50",   border: "border-yellow-400", gradient: "from-yellow-200 via-amber-100 to-yellow-50" },
};

export const PREMIUM_AD_PLANS = [
  { tier: "BASIC",   price: 100_000, days: 30, features: ["매물 목록 상단 노출", "BASIC 배지 표시", "일반 테두리 하이라이트"] },
  { tier: "PREMIUM", price: 200_000, days: 30, features: ["매물 목록 상단 노출", "PREMIUM 배지 표시", "보라색 프리미엄 테두리", "홈페이지 추천 섹션 노출"] },
  { tier: "VIP",     price: 300_000, days: 30, features: ["매물 목록 최상단 노출", "VIP 골드 배지", "골드 프리미엄 테두리", "홈페이지 추천 섹션 최우선", "상세페이지 VIP 전용 헤더"] },
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
