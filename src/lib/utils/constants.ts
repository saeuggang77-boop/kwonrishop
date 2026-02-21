export const BUSINESS_CATEGORY_LABELS: Record<string, string> = {
  // 외식업
  KOREAN_FOOD: "한식",
  CHINESE_FOOD: "중식",
  JAPANESE_FOOD: "일식/회",
  WESTERN_FOOD: "양식",
  ASIAN_FOOD: "아시안",
  BUNSIK: "분식",
  MEAT: "육류",
  BAR_PUB: "주류",
  BURGER: "버거류",
  CAFE_BAKERY: "커피",
  DELIVERY: "배달전문",
  NIGHTCLUB: "유흥주점",
  // 대분류
  SERVICE: "서비스업",
  RETAIL: "도소매업",
  ENTERTAINMENT: "오락/스포츠",
  EDUCATION: "교육/학원",
  ACCOMMODATION: "숙박업",
  OTHER: "기타",
  // 레거시 (DB 마이그레이션 전 하위호환)
  CHICKEN: "치킨",
  PIZZA: "피자",
  OTHER_FOOD: "기타외식",
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

// ── 사용자 역할 ──
export const ROLE_LABELS: Record<string, string> = {
  BUYER: "점포 찾는 사람",
  SELLER: "점포 파는 사람",
  AGENT: "공인중개사",
  FRANCHISE: "프랜차이즈 본사",
  EXPERT: "전문가",
  ADMIN: "관리자",
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
    label: "오늘의 추천 매물 광고",
    price: 200_000,
    priceWithVat: 220_000,
    days: 30,
    features: [
      "매물 목록 상위 노출",
      "\"오늘의 추천\" 배지 표시",
      "그린 테두리 카드 디자인",
      "기본 조회수 통계",
    ],
  },
  {
    tier: "VIP" as const,
    label: "프리미엄 매물 광고",
    price: 300_000,
    priceWithVat: 330_000,
    days: 30,
    recommended: true,
    features: [
      "매물 목록 최상단 고정",
      "홈페이지 프리미엄 매물 캐러셀 노출",
      "\"프리미엄 매물\" 배지 + 골드 테두리 카드",
      "권리진단서 1회 무료 포함",
      "안전도 등급 상세 표시",
      "상세 조회수 통계",
    ],
  },
];

// ── 권리진단서 요금 (건별 판매) ──
export const REPORT_PLAN = {
  label: "권리진단서",
  price: 30_000,
  priceWithVat: 33_000,
  features: [
    "적정 권리금 산정 (영업/시설/바닥)",
    "수익성·입지·리스크 진단",
    "종합 등급 + AI 코멘트",
    "임대차 체크리스트 20항목",
    "PDF 리포트 다운로드",
    "매물 상세 페이지에 진단 결과 표시",
    "권리진단 완료 배지 부여",
  ],
};

/** @deprecated Use REPORT_PLAN instead */
export const REPORT_PLANS = [REPORT_PLAN];

// ── 매도자 무료 등록 제한 ──
export const FREE_LISTING_LIMIT_PER_MONTH = 2;

export const MAX_IMAGES_PER_LISTING = 20;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const SAFETY_GRADE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; description: string }> = {
  A: { label: "A등급", color: "text-green-700", bg: "bg-green-100", border: "border-green-300", description: "홈택스/여신금융 API 연동 인증" },
  B: { label: "B등급", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300", description: "매출 증빙자료 제출 완료" },
  C: { label: "C등급", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-300", description: "매출 증빙 없음" },
  D: { label: "C등급", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-300", description: "매출 증빙 없음" },
};

export const FRANCHISE_CATEGORIES = ["외식", "도소매", "서비스"] as const;

export const PREMIUM_AD_CONFIG: Record<string, { label: string; badge: string; color: string; bg: string; border: string; gradient: string }> = {
  PREMIUM: { label: "오늘의 추천", badge: "오늘의 추천", color: "text-blue-800",  bg: "bg-blue-50",    border: "border-blue-300", gradient: "from-blue-100 to-blue-50" },
  VIP:     { label: "프리미엄 매물",     badge: "프리미엄 매물",     color: "text-amber-800",  bg: "bg-amber-50",    border: "border-amber-400", gradient: "from-amber-200 via-amber-100 to-amber-50" },
};

export const DIAGNOSIS_BADGE_CONFIG = {
  label: "권리진단 완료",
  color: "text-emerald-700",
  bg: "bg-emerald-50",
  border: "border-emerald-300",
} as const;

export const PREMIUM_AD_PLANS = [
  { tier: "PREMIUM", price: 200_000, days: 30, features: ["매물 목록 상위 노출", "오늘의 추천 배지 표시", "그린 테두리 카드 디자인", "기본 조회수 통계"] },
  { tier: "VIP",     price: 300_000, days: 30, features: ["매물 목록 최상단 고정", "홈페이지 프리미엄 매물 캐러셀 노출", "프리미엄 매물 배지 + 골드 테두리 카드", "권리진단서 1회 무료", "상세 조회수 통계"] },
];

// 업종 대분류 → 세부 카테고리 매핑 (레퍼런스 사이트 기준)
export const BUSINESS_CATEGORY_GROUPS: Record<string, string[]> = {
  외식업: ["KOREAN_FOOD", "CHINESE_FOOD", "JAPANESE_FOOD", "WESTERN_FOOD", "ASIAN_FOOD", "BUNSIK", "MEAT", "BAR_PUB", "BURGER", "CAFE_BAKERY", "DELIVERY", "NIGHTCLUB"],
  서비스업: ["SERVICE"],
  "도/소매업": ["RETAIL"],
  "예술/스포츠/시설업": ["ENTERTAINMENT"],
  "교육/학원업": ["EDUCATION"],
  숙박업: ["ACCOMMODATION"],
  기타: ["OTHER"],
};

// 업종 세부 카테고리 (이모지 + 라벨) — 매물등록/검색 공용
export const BUSINESS_SUBCATEGORIES: Record<string, { key: string; emoji: string; label: string; subtype?: string }[]> = {
  외식업: [
    { key: "KOREAN_FOOD", emoji: "🍚", label: "한식" },
    { key: "CHINESE_FOOD", emoji: "🥟", label: "중식" },
    { key: "JAPANESE_FOOD", emoji: "🍣", label: "일식/회" },
    { key: "WESTERN_FOOD", emoji: "🍝", label: "양식" },
    { key: "ASIAN_FOOD", emoji: "🍜", label: "아시안" },
    { key: "BUNSIK", emoji: "🥘", label: "분식" },
    { key: "MEAT", emoji: "🥩", label: "육류" },
    { key: "BAR_PUB", emoji: "🍺", label: "주류" },
    { key: "BURGER", emoji: "🍔", label: "버거류" },
    { key: "CAFE_BAKERY", emoji: "☕", label: "커피" },
    { key: "DELIVERY", emoji: "🛵", label: "배달전문" },
    { key: "NIGHTCLUB", emoji: "🍸", label: "유흥주점" },
  ],
  서비스업: [
    { key: "SERVICE", emoji: "💇", label: "미용실", subtype: "미용실" },
    { key: "SERVICE", emoji: "💅", label: "뷰티", subtype: "뷰티" },
    { key: "SERVICE", emoji: "💆", label: "마사지", subtype: "마사지" },
    { key: "SERVICE", emoji: "👔", label: "세탁소", subtype: "세탁소" },
    { key: "SERVICE", emoji: "♨️", label: "사우나", subtype: "사우나" },
    { key: "SERVICE", emoji: "🔧", label: "카센터", subtype: "카센터" },
    { key: "SERVICE", emoji: "🐕", label: "애견미용/호텔", subtype: "애견미용/호텔" },
  ],
  "도/소매업": [
    { key: "RETAIL", emoji: "🏪", label: "편의점", subtype: "편의점" },
    { key: "RETAIL", emoji: "🛒", label: "슈퍼마켓", subtype: "슈퍼마켓" },
    { key: "RETAIL", emoji: "🍎", label: "청과류", subtype: "청과류" },
    { key: "RETAIL", emoji: "🥩", label: "정육점", subtype: "정육점" },
    { key: "RETAIL", emoji: "👗", label: "의류/가방", subtype: "의류/가방" },
    { key: "RETAIL", emoji: "💊", label: "약국", subtype: "약국" },
    { key: "RETAIL", emoji: "✏️", label: "문구류", subtype: "문구류" },
    { key: "RETAIL", emoji: "💍", label: "액세서리", subtype: "액세서리" },
    { key: "RETAIL", emoji: "💄", label: "화장품", subtype: "화장품" },
    { key: "RETAIL", emoji: "🛋️", label: "리빙/가구", subtype: "리빙/가구" },
    { key: "RETAIL", emoji: "💎", label: "귀금속", subtype: "귀금속" },
    { key: "RETAIL", emoji: "📺", label: "가전제품", subtype: "가전제품" },
    { key: "RETAIL", emoji: "🔨", label: "철물/자재", subtype: "철물/자재" },
    { key: "RETAIL", emoji: "🌸", label: "꽃/식물", subtype: "꽃/식물" },
    { key: "RETAIL", emoji: "🐶", label: "애견용품", subtype: "애견용품" },
  ],
  "예술/스포츠/시설업": [
    { key: "ENTERTAINMENT", emoji: "🎤", label: "노래방", subtype: "노래방" },
    { key: "ENTERTAINMENT", emoji: "🎱", label: "당구장", subtype: "당구장" },
    { key: "ENTERTAINMENT", emoji: "📖", label: "독서실", subtype: "독서실" },
    { key: "ENTERTAINMENT", emoji: "🏋️", label: "헬스클럽", subtype: "헬스클럽" },
    { key: "ENTERTAINMENT", emoji: "⚫", label: "바둑기원", subtype: "바둑기원" },
    { key: "ENTERTAINMENT", emoji: "🎳", label: "볼링장", subtype: "볼링장" },
    { key: "ENTERTAINMENT", emoji: "🥋", label: "무도장", subtype: "무도장" },
    { key: "ENTERTAINMENT", emoji: "🎵", label: "음악작업", subtype: "음악작업" },
    { key: "ENTERTAINMENT", emoji: "🏓", label: "탁구장", subtype: "탁구장" },
    { key: "ENTERTAINMENT", emoji: "⛳", label: "실내골프", subtype: "실내골프" },
    { key: "ENTERTAINMENT", emoji: "⚾", label: "실내야구", subtype: "실내야구" },
    { key: "ENTERTAINMENT", emoji: "⚽", label: "풋살/축구", subtype: "풋살/축구" },
    { key: "ENTERTAINMENT", emoji: "🎣", label: "실내낚시", subtype: "실내낚시" },
    { key: "ENTERTAINMENT", emoji: "🎮", label: "기타오락", subtype: "기타오락" },
    { key: "ENTERTAINMENT", emoji: "📸", label: "무인사진", subtype: "무인사진" },
    { key: "ENTERTAINMENT", emoji: "🎙️", label: "코인노래방", subtype: "코인노래방" },
    { key: "ENTERTAINMENT", emoji: "🧺", label: "코인빨래방", subtype: "코인빨래방" },
  ],
  "교육/학원업": [
    { key: "EDUCATION", emoji: "👶", label: "어린이집", subtype: "어린이집" },
    { key: "EDUCATION", emoji: "📚", label: "학원", subtype: "학원" },
    { key: "EDUCATION", emoji: "🧒", label: "키즈카페", subtype: "키즈카페" },
    { key: "EDUCATION", emoji: "🎨", label: "미술업", subtype: "미술업" },
    { key: "EDUCATION", emoji: "🏺", label: "공방", subtype: "공방" },
  ],
  숙박업: [
    { key: "ACCOMMODATION", emoji: "🏨", label: "호텔/모텔", subtype: "호텔/모텔" },
    { key: "ACCOMMODATION", emoji: "🏠", label: "숙박업", subtype: "숙박업" },
    { key: "ACCOMMODATION", emoji: "⛺", label: "캠핑장", subtype: "캠핑장" },
    { key: "ACCOMMODATION", emoji: "🏢", label: "원룸텔", subtype: "원룸텔" },
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
  { value: "monthlyProfit-desc", label: "월순이익 높은순" },
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

// ── 홈페이지 매물 표시 설정 ──
export const HOMEPAGE_SLOTS = {
  PREMIUM: 10,   // 2행 × 5열
  RECOMMEND: 12, // 2행 × 6열
} as const;

export const REGION_DATA: Record<string, string[]> = {
  "서울": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  "경기": ["가평군", "고양시", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시", "수원시", "시흥시", "안산시", "안성시", "안양시", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
  "인천": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
  "부산": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
  "대구": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
  "광주": ["광산구", "남구", "동구", "북구", "서구"],
  "대전": ["대덕구", "동구", "서구", "유성구", "중구"],
  "울산": ["남구", "동구", "북구", "울주군", "중구"],
  "세종": ["세종시"],
  "강원": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
  "충북": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
  "충남": ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
  "전북": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
  "전남": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
  "경북": ["경산시", "경주시", "고령군", "구미시", "군위군", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
  "경남": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
  "제주": ["서귀포시", "제주시"],
};

export const MONTHLY_PROFIT_OPTIONS = [
  { label: "전체", min: "", max: "" },
  { label: "100만 이하", min: "", max: "1000000" },
  { label: "100만 ~ 300만", min: "1000000", max: "3000000" },
  { label: "300만 ~ 500만", min: "3000000", max: "5000000" },
  { label: "500만 ~ 1,000만", min: "5000000", max: "10000000" },
  { label: "1,000만 ~ 2,000만", min: "10000000", max: "20000000" },
  { label: "2,000만 이상", min: "20000000", max: "" },
];

