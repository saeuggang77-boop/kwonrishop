import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    name: "외식업",
    icon: "🍳",
    sortOrder: 1,
    subCategories: [
      "한식", "중식", "일식/회", "양식", "아시안", "분식",
      "육류", "주류", "버거류", "커피", "배달전문", "유흥주점",
    ],
  },
  {
    name: "서비스업",
    icon: "✂️",
    sortOrder: 2,
    subCategories: [
      "미용실", "뷰티", "마사지", "세탁소", "사우나", "카센터", "애견미용/호텔",
    ],
  },
  {
    name: "도/소매업",
    icon: "🏪",
    sortOrder: 3,
    subCategories: [
      "편의점", "슈퍼마켓", "청과류", "정육점", "의류가방",
      "약국", "문구류", "액세서리", "화장품", "리빙가구",
      "귀금속", "가전제품", "철물/자재", "꽃/식물", "애견용품",
    ],
  },
  {
    name: "예술/스포츠/시설업",
    icon: "🎮",
    sortOrder: 4,
    subCategories: [
      "노래방", "당구장", "독서실", "헬스클럽", "바둑기원",
      "볼링장", "무도장", "음악작업", "탁구장", "실내골프",
      "실내야구", "풋살/축구", "실내낚시", "기타오락",
      "무인사진", "코인노래방", "코인빨래방",
    ],
  },
  {
    name: "교육/학원업",
    icon: "📚",
    sortOrder: 5,
    subCategories: [
      "어린이집", "학원", "키즈카페", "미술업", "공방",
    ],
  },
  {
    name: "숙박업",
    icon: "🏨",
    sortOrder: 6,
    subCategories: [
      "호텔모텔", "숙박업", "캠핑장", "원룸텔",
    ],
  },
  {
    name: "기타",
    icon: "💬",
    sortOrder: 7,
    subCategories: [
      "기타업종",
    ],
  },
];

const adProducts = [
  // ── 사장님 매물 (LISTING) ──
  {
    id: "listing-basic",
    name: "베이직",
    type: "PACKAGE" as const,
    categoryScope: "LISTING" as const,
    price: 100000,
    duration: 30,
    sortOrder: 1,
    features: {
      badge: "베이직",
      photos: 10,
      topExposure: false,
      highlight: false,
      bumpCount: 2,
      verified: true,
      description: "사진10장, 인증배지, 끌어올리기 2회",
    },
  },
  {
    id: "listing-premium",
    name: "프리미엄",
    type: "PACKAGE" as const,
    categoryScope: "LISTING" as const,
    price: 300000,
    duration: 30,
    sortOrder: 2,
    features: {
      badge: "프리미엄",
      photos: 20,
      topExposure: true,
      highlight: true,
      bumpCount: 5,
      analytics: true,
      description: "상위노출, 사진20장, 통계, 끌어올리기 5회",
    },
  },
  {
    id: "listing-vip",
    name: "VIP",
    type: "PACKAGE" as const,
    categoryScope: "LISTING" as const,
    price: 500000,
    duration: 30,
    sortOrder: 3,
    features: {
      badge: "VIP",
      photos: 999,
      video: 1,
      topExposure: true,
      highlight: true,
      bumpCount: 10,
      analytics: true,
      mainRecommend: true,
      matching: true,
      description: "최상위노출, 메인추천, 사진무제한, 영상1개, 매수자매칭",
    },
  },
  // ── 프랜차이즈 (FRANCHISE) ── 기간별 상품 (1/3/6/12개월)
  // 브론즈 1개월 (기존 ID 유지 - 하위호환)
  {
    id: "franchise-bronze",
    name: "브론즈 1개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 300000,
    duration: 30,
    sortOrder: 4,
    features: {
      badge: "브론즈",
      logoEdit: true,
      introEdit: true,
      period: "1m",
      description: "로고+소개 편집",
    },
  },
  {
    id: "franchise-bronze-3m",
    name: "브론즈 3개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 810000,
    duration: 90,
    sortOrder: 5,
    features: {
      badge: "브론즈",
      logoEdit: true,
      introEdit: true,
      period: "3m",
      discount: "10%",
      description: "로고+소개 편집 (3개월, 10% 할인)",
    },
  },
  {
    id: "franchise-bronze-6m",
    name: "브론즈 6개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 1530000,
    duration: 180,
    sortOrder: 6,
    features: {
      badge: "브론즈",
      logoEdit: true,
      introEdit: true,
      period: "6m",
      discount: "15%",
      description: "로고+소개 편집 (6개월, 15% 할인)",
    },
  },
  {
    id: "franchise-bronze-12m",
    name: "브론즈 12개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 2880000,
    duration: 365,
    sortOrder: 7,
    features: {
      badge: "브론즈",
      logoEdit: true,
      introEdit: true,
      period: "12m",
      discount: "20%",
      description: "로고+소개 편집 (12개월, 20% 할인)",
    },
  },
  // 실버 1개월 (기존 ID 유지 - 하위호환)
  {
    id: "franchise-silver",
    name: "실버 1개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 600000,
    duration: 30,
    sortOrder: 8,
    features: {
      badge: "실버",
      logoEdit: true,
      introEdit: true,
      topExposure: true,
      recommend: true,
      inquirySystem: true,
      period: "1m",
      description: "상위노출, 추천연동, 문의접수",
    },
  },
  {
    id: "franchise-silver-3m",
    name: "실버 3개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 1620000,
    duration: 90,
    sortOrder: 9,
    features: {
      badge: "실버",
      logoEdit: true,
      introEdit: true,
      topExposure: true,
      recommend: true,
      inquirySystem: true,
      period: "3m",
      discount: "10%",
      description: "상위노출, 추천연동, 문의접수 (3개월, 10% 할인)",
    },
  },
  {
    id: "franchise-silver-6m",
    name: "실버 6개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 3060000,
    duration: 180,
    sortOrder: 10,
    features: {
      badge: "실버",
      logoEdit: true,
      introEdit: true,
      topExposure: true,
      recommend: true,
      inquirySystem: true,
      period: "6m",
      discount: "15%",
      description: "상위노출, 추천연동, 문의접수 (6개월, 15% 할인)",
    },
  },
  {
    id: "franchise-silver-12m",
    name: "실버 12개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 5760000,
    duration: 365,
    sortOrder: 11,
    features: {
      badge: "실버",
      logoEdit: true,
      introEdit: true,
      topExposure: true,
      recommend: true,
      inquirySystem: true,
      period: "12m",
      discount: "20%",
      description: "상위노출, 추천연동, 문의접수 (12개월, 20% 할인)",
    },
  },
  // 골드 1개월 (기존 ID 유지 - 하위호환)
  {
    id: "franchise-gold",
    name: "골드 1개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 1000000,
    duration: 30,
    sortOrder: 12,
    features: {
      badge: "골드",
      logoEdit: true,
      introEdit: true,
      topExposure: true,
      recommend: true,
      inquirySystem: true,
      mainBanner: true,
      autoMatching: true,
      monthlyReport: true,
      period: "1m",
      description: "메인배너, 자동매칭, 월간리포트",
    },
  },
  {
    id: "franchise-gold-3m",
    name: "골드 3개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 2700000,
    duration: 90,
    sortOrder: 13,
    features: {
      badge: "골드",
      logoEdit: true,
      introEdit: true,
      topExposure: true,
      recommend: true,
      inquirySystem: true,
      mainBanner: true,
      autoMatching: true,
      monthlyReport: true,
      period: "3m",
      discount: "10%",
      description: "메인배너, 자동매칭, 월간리포트 (3개월, 10% 할인)",
    },
  },
  {
    id: "franchise-gold-6m",
    name: "골드 6개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 5100000,
    duration: 180,
    sortOrder: 14,
    features: {
      badge: "골드",
      logoEdit: true,
      introEdit: true,
      topExposure: true,
      recommend: true,
      inquirySystem: true,
      mainBanner: true,
      autoMatching: true,
      monthlyReport: true,
      period: "6m",
      discount: "15%",
      description: "메인배너, 자동매칭, 월간리포트 (6개월, 15% 할인)",
    },
  },
  {
    id: "franchise-gold-12m",
    name: "골드 12개월",
    type: "PACKAGE" as const,
    categoryScope: "FRANCHISE" as const,
    price: 9600000,
    duration: 365,
    sortOrder: 15,
    features: {
      badge: "골드",
      logoEdit: true,
      introEdit: true,
      topExposure: true,
      recommend: true,
      inquirySystem: true,
      mainBanner: true,
      autoMatching: true,
      monthlyReport: true,
      period: "12m",
      discount: "20%",
      description: "메인배너, 자동매칭, 월간리포트 (12개월, 20% 할인)",
    },
  },
  // ── 협력업체 (PARTNER) ── 기간별 상품 (1/3/6/12개월)
  // 베이직 1개월 (기존 ID 유지 - 하위호환)
  {
    id: "partner-basic",
    name: "베이직 1개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 100000,
    duration: 30,
    sortOrder: 16,
    features: {
      badge: "베이직",
      photos: 10,
      verified: true,
      period: "1m",
      description: "사진10장, 배지",
    },
  },
  {
    id: "partner-basic-3m",
    name: "베이직 3개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 270000,
    duration: 90,
    sortOrder: 17,
    features: {
      badge: "베이직",
      photos: 10,
      verified: true,
      period: "3m",
      discount: "10%",
      description: "사진10장, 배지 (3개월, 10% 할인)",
    },
  },
  {
    id: "partner-basic-6m",
    name: "베이직 6개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 510000,
    duration: 180,
    sortOrder: 18,
    features: {
      badge: "베이직",
      photos: 10,
      verified: true,
      period: "6m",
      discount: "15%",
      description: "사진10장, 배지 (6개월, 15% 할인)",
    },
  },
  {
    id: "partner-basic-12m",
    name: "베이직 12개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 960000,
    duration: 365,
    sortOrder: 19,
    features: {
      badge: "베이직",
      photos: 10,
      verified: true,
      period: "12m",
      discount: "20%",
      description: "사진10장, 배지 (12개월, 20% 할인)",
    },
  },
  // 프리미엄 1개월 (기존 ID 유지 - 하위호환)
  {
    id: "partner-premium",
    name: "프리미엄 1개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 300000,
    duration: 30,
    sortOrder: 20,
    features: {
      badge: "프리미엄",
      photos: 20,
      topExposure: true,
      portfolio: 20,
      period: "1m",
      description: "상위노출, 포트폴리오20건",
    },
  },
  {
    id: "partner-premium-3m",
    name: "프리미엄 3개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 810000,
    duration: 90,
    sortOrder: 21,
    features: {
      badge: "프리미엄",
      photos: 20,
      topExposure: true,
      portfolio: 20,
      period: "3m",
      discount: "10%",
      description: "상위노출, 포트폴리오20건 (3개월, 10% 할인)",
    },
  },
  {
    id: "partner-premium-6m",
    name: "프리미엄 6개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 1530000,
    duration: 180,
    sortOrder: 22,
    features: {
      badge: "프리미엄",
      photos: 20,
      topExposure: true,
      portfolio: 20,
      period: "6m",
      discount: "15%",
      description: "상위노출, 포트폴리오20건 (6개월, 15% 할인)",
    },
  },
  {
    id: "partner-premium-12m",
    name: "프리미엄 12개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 2880000,
    duration: 365,
    sortOrder: 23,
    features: {
      badge: "프리미엄",
      photos: 20,
      topExposure: true,
      portfolio: 20,
      period: "12m",
      discount: "20%",
      description: "상위노출, 포트폴리오20건 (12개월, 20% 할인)",
    },
  },
  // VIP 1개월 (기존 ID 유지 - 하위호환)
  {
    id: "partner-vip",
    name: "VIP 1개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 500000,
    duration: 30,
    sortOrder: 24,
    features: {
      badge: "VIP",
      photos: 999,
      topExposure: true,
      portfolio: 999,
      mainRecommend: true,
      period: "1m",
      description: "최상위노출, 추천업체 연동",
    },
  },
  {
    id: "partner-vip-3m",
    name: "VIP 3개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 1350000,
    duration: 90,
    sortOrder: 25,
    features: {
      badge: "VIP",
      photos: 999,
      topExposure: true,
      portfolio: 999,
      mainRecommend: true,
      period: "3m",
      discount: "10%",
      description: "최상위노출, 추천업체 연동 (3개월, 10% 할인)",
    },
  },
  {
    id: "partner-vip-6m",
    name: "VIP 6개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 2550000,
    duration: 180,
    sortOrder: 26,
    features: {
      badge: "VIP",
      photos: 999,
      topExposure: true,
      portfolio: 999,
      mainRecommend: true,
      period: "6m",
      discount: "15%",
      description: "최상위노출, 추천업체 연동 (6개월, 15% 할인)",
    },
  },
  {
    id: "partner-vip-12m",
    name: "VIP 12개월",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 4800000,
    duration: 365,
    sortOrder: 27,
    features: {
      badge: "VIP",
      photos: 999,
      topExposure: true,
      portfolio: 999,
      mainRecommend: true,
      period: "12m",
      discount: "20%",
      description: "최상위노출, 추천업체 연동 (12개월, 20% 할인)",
    },
  },
  // ── 집기장터 (EQUIPMENT) ──
  {
    id: "equipment-basic",
    name: "베이직",
    type: "PACKAGE" as const,
    categoryScope: "EQUIPMENT" as const,
    price: 10000,
    duration: 30,
    sortOrder: 28,
    features: {
      badge: "베이직",
      photos: 10,
      topExposure: false,
      description: "사진10장, 인증배지, 30일 노출",
    },
  },
  {
    id: "equipment-premium",
    name: "프리미엄",
    type: "PACKAGE" as const,
    categoryScope: "EQUIPMENT" as const,
    price: 30000,
    duration: 30,
    sortOrder: 29,
    features: {
      badge: "프리미엄",
      photos: 20,
      topExposure: true,
      highlight: true,
      description: "상위노출, 사진20장, 프리미엄배지",
    },
  },
  {
    id: "equipment-vip",
    name: "VIP",
    type: "PACKAGE" as const,
    categoryScope: "EQUIPMENT" as const,
    price: 50000,
    duration: 30,
    sortOrder: 30,
    features: {
      badge: "VIP",
      photos: 999,
      topExposure: true,
      highlight: true,
      mainRecommend: true,
      description: "최상위노출, 메인추천, 사진무제한, VIP배지",
    },
  },
  // ── 공통 단건 (COMMON) ──
  {
    id: "common-bump",
    name: "끌어올리기",
    type: "SINGLE" as const,
    categoryScope: "COMMON" as const,
    price: 3000,
    duration: null,
    sortOrder: 31,
    features: {
      bumpCount: 1,
      description: "목록 최상단 1회 끌어올리기",
    },
  },
  // 폐기: common-badge (강조배지) - 패키지 배지로 대체
  // 폐기: common-region-top (지역TOP) - 불필요
  // ── 끌어올리기 구독 (SUBSCRIPTION) ──
  {
    id: "bump-subscription-lite",
    name: "끌어올리기 라이트",
    type: "SUBSCRIPTION" as const,
    categoryScope: "COMMON" as const,
    price: 30000,
    duration: 30,
    sortOrder: 32,
    features: {
      frequency: "TWICE_WEEKLY",
      bumpTimes: ["09:00"],
      description: "주 2회 (월·목) 오전 9시 자동 끌어올리기",
      savingsPercent: 17,
    },
  },
  {
    id: "bump-subscription-standard",
    name: "끌어올리기 스탠다드",
    type: "SUBSCRIPTION" as const,
    categoryScope: "COMMON" as const,
    price: 60000,
    duration: 30,
    sortOrder: 33,
    features: {
      frequency: "WEEKDAY_DAILY",
      bumpTimes: ["09:00"],
      description: "평일 매일 오전 9시 자동 끌어올리기",
      savingsPercent: 24,
      popular: true,
    },
  },
  {
    id: "bump-subscription-premium",
    name: "끌어올리기 프리미엄",
    type: "SUBSCRIPTION" as const,
    categoryScope: "COMMON" as const,
    price: 80000,
    duration: 30,
    sortOrder: 34,
    features: {
      frequency: "DAILY",
      bumpTimes: ["09:00"],
      description: "매일 1회 오전 9시 자동 끌어올리기",
      savingsPercent: 22,
    },
  },
  {
    id: "bump-subscription-vip",
    name: "끌어올리기 VIP",
    type: "SUBSCRIPTION" as const,
    categoryScope: "COMMON" as const,
    price: 100000,
    duration: 30,
    sortOrder: 35,
    features: {
      frequency: "TWICE_DAILY",
      bumpTimes: ["09:00", "18:00"],
      description: "매일 2회 (오전 9시 + 오후 6시) 자동 끌어올리기",
      savingsPercent: 44,
    },
  },
  {
    id: "common-seller-report",
    name: "매도자 시장분석 리포트",
    type: "SINGLE" as const,
    categoryScope: "COMMON" as const,
    price: 15000,
    duration: null,
    sortOrder: 36,
    features: {
      description: "내 매물의 시장 경쟁력 분석",
      sections: ["포지셔닝", "가격적정성", "경쟁현황", "상권트렌드", "매각전략"],
      scope: "SELLER_REPORT",
    },
  },
];

const franchiseBrands = [
  {
    id: "brand-momtouch",
    brandName: "맘스터치",
    companyName: "해마로푸드서비스",
    industry: "외식업",
    tier: "GOLD" as const,
    description: "국내 대표 프리미엄 수제버거 프랜차이즈",
    franchiseFee: 800,
    educationFee: 150,
    depositFee: 500,
    totalStores: 1500,
    avgRevenue: 8500,
  },
  {
    id: "brand-ediya",
    brandName: "이디야커피",
    companyName: "이디야",
    industry: "외식업",
    tier: "SILVER" as const,
    description: "합리적인 가격의 커피전문점",
    franchiseFee: 500,
    educationFee: 100,
    depositFee: 300,
    totalStores: 3200,
    avgRevenue: 6000,
  },
  {
    id: "brand-oliveyoung",
    brandName: "올리브영",
    companyName: "CJ올리브영",
    industry: "도/소매업",
    tier: "BRONZE" as const,
    description: "1위 헬스앤뷰티 스토어",
    franchiseFee: 2000,
    educationFee: 300,
    depositFee: 1000,
    totalStores: 1300,
    avgRevenue: 15000,
  },
  {
    id: "brand-gongcha",
    brandName: "공차",
    companyName: "공차코리아",
    industry: "외식업",
    tier: "FREE" as const,
    description: "대만 버블티 전문 브랜드",
    franchiseFee: 700,
    educationFee: 120,
    depositFee: 400,
    totalStores: 850,
    avgRevenue: 5500,
  },
  {
    id: "brand-cu",
    brandName: "CU",
    companyName: "BGF리테일",
    industry: "도/소매업",
    tier: "FREE" as const,
    description: "대한민국 1위 편의점",
    franchiseFee: 300,
    educationFee: 80,
    depositFee: 200,
    totalStores: 16000,
    avgRevenue: 4500,
  },
  {
    id: "brand-baskin",
    brandName: "배스킨라빈스",
    companyName: "비알코리아",
    industry: "외식업",
    tier: "FREE" as const,
    description: "세계적인 아이스크림 브랜드",
    franchiseFee: 1000,
    educationFee: 150,
    depositFee: 600,
    totalStores: 1200,
    avgRevenue: 7000,
  },
  {
    id: "brand-kyochon",
    brandName: "교촌치킨",
    companyName: "교촌에프앤비",
    industry: "외식업",
    tier: "FREE" as const,
    description: "참숯불 치킨의 명가",
    franchiseFee: 900,
    educationFee: 130,
    depositFee: 500,
    totalStores: 1100,
    avgRevenue: 7500,
  },
  {
    id: "brand-bhc",
    brandName: "BHC치킨",
    companyName: "비에이치씨",
    industry: "외식업",
    tier: "FREE" as const,
    description: "프리미엄 치킨 프랜차이즈",
    franchiseFee: 850,
    educationFee: 120,
    depositFee: 480,
    totalStores: 950,
    avgRevenue: 7200,
  },
];

async function main() {
  console.log("시드 데이터 삽입 시작...");

  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kwonrishop.com" },
    update: {
      name: "관리자",
      role: "ADMIN",
    },
    create: {
      email: "admin@kwonrishop.com",
      name: "관리자",
      role: "ADMIN",
    },
  });
  console.log(`  ✓ 관리자 계정: ${adminUser.email}`);

  // 기존 카테고리 전체 삭제 (아싸점포거래소 동일 구조로 재생성)
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  console.log("  ✓ 기존 카테고리 초기화 완료");

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon, sortOrder: cat.sortOrder },
      create: {
        name: cat.name,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    });

    for (let i = 0; i < cat.subCategories.length; i++) {
      await prisma.subCategory.upsert({
        where: {
          categoryId_name: {
            categoryId: category.id,
            name: cat.subCategories[i],
          },
        },
        update: { sortOrder: i + 1 },
        create: {
          name: cat.subCategories[i],
          sortOrder: i + 1,
          categoryId: category.id,
        },
      });
    }

    console.log(`  ✓ ${cat.name}: ${cat.subCategories.length}개 소분류`);
  }

  for (const product of adProducts) {
    await prisma.adProduct.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        type: product.type,
        price: product.price,
        duration: product.duration,
        features: product.features,
        sortOrder: product.sortOrder,
        categoryScope: product.categoryScope,
      },
      create: {
        id: product.id,
        name: product.name,
        type: product.type,
        categoryScope: product.categoryScope,
        price: product.price,
        duration: product.duration,
        features: product.features,
        sortOrder: product.sortOrder,
      },
    });
    console.log(`  ✓ 광고상품: ${product.name} [${product.categoryScope}] (${product.price.toLocaleString()}원)`);
  }

  // 시드에 없는 유령 상품 비활성화 (기존 결제 보존을 위해 soft delete)
  const seedProductIds = adProducts.map((p) => p.id);
  const deactivated = await prisma.adProduct.updateMany({
    where: {
      id: { notIn: seedProductIds },
      active: true,
    },
    data: { active: false },
  });
  if (deactivated.count > 0) {
    console.log(`  ⚠ 유령 상품 ${deactivated.count}개 비활성화 완료`);
  }

  // Franchise brands
  for (const brand of franchiseBrands) {
    await prisma.franchiseBrand.upsert({
      where: { id: brand.id },
      update: {
        brandName: brand.brandName,
        companyName: brand.companyName,
        industry: brand.industry,
        tier: brand.tier,
        description: brand.description,
        franchiseFee: brand.franchiseFee,
        educationFee: brand.educationFee,
        depositFee: brand.depositFee,
        totalStores: brand.totalStores,
        avgRevenue: brand.avgRevenue,
      },
      create: {
        id: brand.id,
        brandName: brand.brandName,
        companyName: brand.companyName,
        industry: brand.industry,
        tier: brand.tier,
        description: brand.description,
        franchiseFee: brand.franchiseFee,
        educationFee: brand.educationFee,
        depositFee: brand.depositFee,
        totalStores: brand.totalStores,
        avgRevenue: brand.avgRevenue,
      },
    });
    console.log(`  ✓ 프랜차이즈: ${brand.brandName} (${brand.tier})`);
  }

  // ==========================================
  // 데모 데이터: 판매자 계정 (11명)
  // ==========================================
  const sellerNames = [
    "김민수", "이영희", "박준호", "최수진", "정대현",
    "한미영", "오세훈", "윤지은", "장현우", "송민아", "류태호",
  ];
  const demoSellers: { id: string; email: string }[] = [];
  for (let i = 0; i < 11; i++) {
    const seller = await prisma.user.upsert({
      where: { email: `seller${i + 1}@demo.com` },
      update: { name: sellerNames[i], role: "SELLER" },
      create: { email: `seller${i + 1}@demo.com`, name: sellerNames[i], role: "SELLER" },
    });
    demoSellers.push({ id: seller.id, email: seller.email! });
  }
  console.log(`  ✓ 데모 판매자 ${demoSellers.length}명 생성`);

  // ==========================================
  // 데모 데이터: 협력업체 사용자 (16명)
  // ==========================================
  const partnerNames = [
    "강인테리어", "이간판", "김세무", "박청소",
    "모던공간", "시그니처사인", "정법무사", "번개철거",
    "탑인테리어", "대한설비", "한회계법인", "밝은전기",
    "프로사인", "만능설비", "최노무사", "스마트세무",
  ];
  const demoPartnerUsers: { id: string; email: string }[] = [];
  for (let i = 0; i < partnerNames.length; i++) {
    const pu = await prisma.user.upsert({
      where: { email: `partner${i + 1}@demo.com` },
      update: { name: partnerNames[i], role: "PARTNER" },
      create: { email: `partner${i + 1}@demo.com`, name: partnerNames[i], role: "PARTNER" },
    });
    demoPartnerUsers.push({ id: pu.id, email: pu.email! });
  }
  console.log(`  ✓ 데모 협력업체 사용자 ${demoPartnerUsers.length}명 생성`);

  // ==========================================
  // 카테고리 조회 (매물 연결용)
  // ==========================================
  const catFood = await prisma.category.findFirst({ where: { name: "외식업" } });
  const catService = await prisma.category.findFirst({ where: { name: "서비스업" } });
  const catRetail = await prisma.category.findFirst({ where: { name: "도/소매업" } });
  const catEdu = await prisma.category.findFirst({ where: { name: "교육/학원업" } });
  const catSport = await prisma.category.findFirst({ where: { name: "예술/스포츠/시설업" } });

  const subCoffee = await prisma.subCategory.findFirst({ where: { name: "커피", categoryId: catFood!.id } });
  const subJapanese = await prisma.subCategory.findFirst({ where: { name: "일식/회", categoryId: catFood!.id } });
  const subHairSalon = await prisma.subCategory.findFirst({ where: { name: "미용실", categoryId: catService!.id } });
  const subConvenience = await prisma.subCategory.findFirst({ where: { name: "편의점", categoryId: catRetail!.id } });
  const subChicken = await prisma.subCategory.findFirst({ where: { name: "육류", categoryId: catFood!.id } });
  const subBunsik = await prisma.subCategory.findFirst({ where: { name: "분식", categoryId: catFood!.id } });
  const subKaraoke = await prisma.subCategory.findFirst({ where: { name: "노래방", categoryId: catSport!.id } });
  const subGym = await prisma.subCategory.findFirst({ where: { name: "헬스클럽", categoryId: catSport!.id } });
  const subLaundry = await prisma.subCategory.findFirst({ where: { name: "세탁소", categoryId: catService!.id } });
  const subAcademy = await prisma.subCategory.findFirst({ where: { name: "학원", categoryId: catEdu!.id } });
  const subKorean = await prisma.subCategory.findFirst({ where: { name: "한식", categoryId: catFood!.id } });

  // ==========================================
  // 데모 데이터: 매물 11개
  // ==========================================
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const listingsData = [
    // VIP 1개
    {
      sellerId: demoSellers[0].id,
      storeName: "강남역 프리미엄 카페",
      description: "강남역 4번 출구 도보 1분 거리에 위치한 프리미엄 카페입니다. 2층 통유리 매장으로 유동인구가 매우 많으며 고정 단골 고객이 확보되어 있습니다. 인테리어를 최근 리모델링하여 상태가 매우 좋습니다. 배달 매출도 꾸준히 발생하고 있어 안정적인 수익을 기대할 수 있습니다.",
      addressRoad: "서울특별시 강남구 강남대로 396",
      addressJibun: "서울특별시 강남구 역삼동 819",
      latitude: 37.4979,
      longitude: 127.0276,
      categoryId: catFood!.id,
      subCategoryId: subCoffee!.id,
      deposit: 5000,
      monthlyRent: 300,
      premium: 8000,
      areaPyeong: 25,
      areaSqm: 82.6,
      currentFloor: 1,
      totalFloor: 5,
      brandType: "PRIVATE" as const,
      viewCount: 3842,
      favoriteCount: 127,
      monthlyRevenue: 2500,
      contactPublic: true,
      themes: ["역세권", "1층", "대로변", "코너"],
      tier: "listing-vip",
      adAmount: 500000,
    },
    // 프리미엄 2개
    {
      sellerId: demoSellers[1].id,
      storeName: "홍대 라멘 전문점",
      description: "홍대입구역 도보 3분, 젊은 유동인구가 풍부한 라멘 전문점입니다. 일본 현지에서 직접 배운 레시피로 운영 중이며, SNS 평점 4.7점의 맛집으로 자리잡았습니다. 주방 설비가 완비되어 있어 바로 운영 가능합니다.",
      addressRoad: "서울특별시 마포구 와우산로 94",
      addressJibun: "서울특별시 마포구 서교동 364-15",
      latitude: 37.5563,
      longitude: 126.9236,
      categoryId: catFood!.id,
      subCategoryId: subJapanese!.id,
      deposit: 3000,
      monthlyRent: 250,
      premium: 4500,
      areaPyeong: 18,
      areaSqm: 59.5,
      currentFloor: 1,
      totalFloor: 4,
      brandType: "PRIVATE" as const,
      viewCount: 1856,
      favoriteCount: 73,
      monthlyRevenue: 1800,
      contactPublic: true,
      themes: ["역세권", "1층", "맛집"],
      tier: "listing-premium",
      adAmount: 300000,
    },
    {
      sellerId: demoSellers[2].id,
      storeName: "마포 영어학원",
      description: "마포구청역 인근 주거밀집지역의 영어학원입니다. 초등학생 위주로 120명의 재원생이 있으며, 강사 4명이 안정적으로 운영 중입니다. 학부모 입소문으로 대기자도 있는 상태입니다. 교육청 인가 완료되어 있습니다.",
      addressRoad: "서울특별시 마포구 월드컵북로 21",
      addressJibun: "서울특별시 마포구 성산동 200-5",
      latitude: 37.5662,
      longitude: 126.9117,
      categoryId: catEdu!.id,
      subCategoryId: subAcademy!.id,
      deposit: 4000,
      monthlyRent: 200,
      premium: 6000,
      areaPyeong: 35,
      areaSqm: 115.7,
      currentFloor: 3,
      totalFloor: 6,
      brandType: "PRIVATE" as const,
      viewCount: 1423,
      favoriteCount: 58,
      monthlyRevenue: 2200,
      contactPublic: true,
      themes: ["학원가", "주거밀집", "엘리베이터"],
      tier: "listing-premium",
      adAmount: 300000,
    },
    // 베이직 3개
    {
      sellerId: demoSellers[3].id,
      storeName: "신촌 헤어살롱",
      description: "신촌역 근처 미용실로 대학가 상권에 위치해 있습니다. 시술 의자 5석, 샴푸대 3대 완비. 단골 고객층이 두텁고, 예약제로 운영하여 안정적인 매출을 유지하고 있습니다.",
      addressRoad: "서울특별시 서대문구 연세로 11",
      addressJibun: "서울특별시 서대문구 창천동 31-8",
      latitude: 37.5573,
      longitude: 126.9367,
      categoryId: catService!.id,
      subCategoryId: subHairSalon!.id,
      deposit: 2000,
      monthlyRent: 180,
      premium: 2500,
      areaPyeong: 15,
      areaSqm: 49.6,
      currentFloor: 2,
      totalFloor: 5,
      brandType: "PRIVATE" as const,
      viewCount: 732,
      favoriteCount: 31,
      monthlyRevenue: 1200,
      contactPublic: true,
      themes: ["대학가", "역세권"],
      tier: "listing-basic",
      adAmount: 100000,
    },
    {
      sellerId: demoSellers[4].id,
      storeName: "서초 스페셜티 커피",
      description: "서초역 5번 출구 인근 직장인 상권의 스페셜티 커피숍입니다. 자체 로스팅 설비를 갖추고 있으며, 테이크아웃과 배달 비율이 높아 운영이 효율적입니다. 아침 출근 시간대 매출이 특히 좋습니다.",
      addressRoad: "서울특별시 서초구 서초대로 398",
      addressJibun: "서울특별시 서초구 서초동 1305-7",
      latitude: 37.4922,
      longitude: 127.0140,
      categoryId: catFood!.id,
      subCategoryId: subCoffee!.id,
      deposit: 2500,
      monthlyRent: 220,
      premium: 3000,
      areaPyeong: 12,
      areaSqm: 39.7,
      currentFloor: 1,
      totalFloor: 7,
      brandType: "PRIVATE" as const,
      viewCount: 651,
      favoriteCount: 28,
      monthlyRevenue: 1400,
      contactPublic: true,
      themes: ["역세권", "1층", "직장인 상권"],
      tier: "listing-basic",
      adAmount: 100000,
    },
    {
      sellerId: demoSellers[5].id,
      storeName: "강서 치킨호프",
      description: "화곡역 인근 주택가 상권의 치킨호프점입니다. 배달 앱 3개를 동시에 운영 중이며, 홀과 배달 매출이 균형 있게 발생합니다. 주방 후드, 튀김기 등 설비가 모두 갖춰져 있습니다.",
      addressRoad: "서울특별시 강서구 화곡로 264",
      addressJibun: "서울특별시 강서구 화곡동 986-3",
      latitude: 37.5412,
      longitude: 126.8397,
      categoryId: catFood!.id,
      subCategoryId: subChicken!.id,
      deposit: 1500,
      monthlyRent: 150,
      premium: 2000,
      areaPyeong: 20,
      areaSqm: 66.1,
      currentFloor: 1,
      totalFloor: 3,
      brandType: "PRIVATE" as const,
      viewCount: 589,
      favoriteCount: 22,
      monthlyRevenue: 1500,
      contactPublic: true,
      themes: ["1층", "배달", "주택가"],
      tier: "listing-basic",
      adAmount: 100000,
    },
    // 무료 5개
    {
      sellerId: demoSellers[6].id,
      storeName: "종로 분식집",
      description: "종로3가역 근처 분식집입니다. 떡볶이, 순대, 튀김 등 기본 분식 메뉴와 김밥, 라면 등을 판매합니다. 점심시간 직장인 손님이 많으며, 소자본으로 운영 가능합니다.",
      addressRoad: "서울특별시 종로구 종로 150",
      addressJibun: "서울특별시 종로구 관수동 107",
      latitude: 37.5705,
      longitude: 126.9920,
      categoryId: catFood!.id,
      subCategoryId: subBunsik!.id,
      deposit: 1000,
      monthlyRent: 120,
      premium: 800,
      areaPyeong: 10,
      areaSqm: 33.1,
      currentFloor: 1,
      totalFloor: 4,
      brandType: "PRIVATE" as const,
      viewCount: 245,
      favoriteCount: 8,
      monthlyRevenue: 800,
      contactPublic: false,
      themes: ["역세권", "소자본"],
      tier: null,
      adAmount: 0,
    },
    {
      sellerId: demoSellers[7].id,
      storeName: "영등포 코인노래방",
      description: "영등포역 로데오거리 내 코인노래방입니다. 무인 시스템으로 운영되어 인건비가 거의 들지 않습니다. 20개 룸이 있으며, 주말과 저녁 시간대 이용률이 높습니다.",
      addressRoad: "서울특별시 영등포구 영등포로 275",
      addressJibun: "서울특별시 영등포구 영등포동3가 1-1",
      latitude: 37.5160,
      longitude: 126.9074,
      categoryId: catSport!.id,
      subCategoryId: subKaraoke!.id,
      deposit: 2000,
      monthlyRent: 180,
      premium: 1500,
      areaPyeong: 30,
      areaSqm: 99.2,
      currentFloor: -1,
      totalFloor: 5,
      brandType: "PRIVATE" as const,
      viewCount: 187,
      favoriteCount: 5,
      monthlyRevenue: 1000,
      contactPublic: false,
      themes: ["무인운영", "역세권"],
      tier: null,
      adAmount: 0,
      isBasement: true,
    },
    {
      sellerId: demoSellers[8].id,
      storeName: "송파 CU편의점",
      description: "잠실역 인근 아파트 단지 앞 편의점입니다. 고정 매출이 안정적이며, 본사 지원 시스템이 잘 갖추어져 있습니다. 24시간 운영이지만 야간 아르바이트를 고용하여 운영 중입니다.",
      addressRoad: "서울특별시 송파구 올림픽로 300",
      addressJibun: "서울특별시 송파구 신천동 7-18",
      latitude: 37.5133,
      longitude: 127.1001,
      categoryId: catRetail!.id,
      subCategoryId: subConvenience!.id,
      deposit: 3000,
      monthlyRent: 100,
      premium: 2500,
      areaPyeong: 22,
      areaSqm: 72.7,
      currentFloor: 1,
      totalFloor: 1,
      brandType: "FRANCHISE" as const,
      viewCount: 312,
      favoriteCount: 12,
      monthlyRevenue: 3500,
      contactPublic: false,
      themes: ["아파트단지", "1층", "24시간"],
      tier: null,
      adAmount: 0,
    },
    {
      sellerId: demoSellers[9].id,
      storeName: "관악 피트니스센터",
      description: "서울대입구역 인근 헬스장입니다. 회원 약 300명이 등록되어 있으며, 러닝머신 15대, 각종 웨이트 기구가 완비되어 있습니다. PT 트레이너 3명이 소속되어 추가 수익을 올리고 있습니다.",
      addressRoad: "서울특별시 관악구 관악로 152",
      addressJibun: "서울특별시 관악구 봉천동 856-2",
      latitude: 37.4812,
      longitude: 126.9527,
      categoryId: catSport!.id,
      subCategoryId: subGym!.id,
      deposit: 5000,
      monthlyRent: 350,
      premium: 4000,
      areaPyeong: 60,
      areaSqm: 198.3,
      currentFloor: 2,
      totalFloor: 4,
      brandType: "PRIVATE" as const,
      viewCount: 156,
      favoriteCount: 4,
      monthlyRevenue: 2000,
      contactPublic: false,
      themes: ["대학가", "역세권", "대형"],
      tier: null,
      adAmount: 0,
    },
    {
      sellerId: demoSellers[10].id,
      storeName: "성동 크린토피아",
      description: "왕십리역 인근 주거지역 세탁소입니다. 크린토피아 가맹점으로 본사 시스템을 활용하여 운영합니다. 세탁기 5대, 건조기 3대 보유. 아파트 밀집 지역이라 고정 수요가 있습니다.",
      addressRoad: "서울특별시 성동구 왕십리로 50",
      addressJibun: "서울특별시 성동구 행당동 292",
      latitude: 37.5614,
      longitude: 127.0368,
      categoryId: catService!.id,
      subCategoryId: subLaundry!.id,
      deposit: 1000,
      monthlyRent: 80,
      premium: 500,
      areaPyeong: 12,
      areaSqm: 39.7,
      currentFloor: 1,
      totalFloor: 3,
      brandType: "PRIVATE" as const,
      viewCount: 98,
      favoriteCount: 2,
      monthlyRevenue: 500,
      contactPublic: false,
      themes: ["아파트단지", "1층", "소자본"],
      tier: null,
      adAmount: 0,
    },
  ];

  for (let i = 0; i < listingsData.length; i++) {
    const d = listingsData[i];
    await prisma.listing.upsert({
      where: { userId: d.sellerId },
      update: {
        status: "ACTIVE",
        storeName: d.storeName,
        description: d.description,
        addressRoad: d.addressRoad,
        addressJibun: d.addressJibun,
        latitude: d.latitude,
        longitude: d.longitude,
        categoryId: d.categoryId,
        subCategoryId: d.subCategoryId,
        deposit: d.deposit,
        monthlyRent: d.monthlyRent,
        premium: d.premium,
        areaPyeong: d.areaPyeong,
        areaSqm: d.areaSqm,
        currentFloor: d.currentFloor,
        totalFloor: d.totalFloor,
        brandType: d.brandType,
        viewCount: d.viewCount,
        favoriteCount: d.favoriteCount,
        monthlyRevenue: d.monthlyRevenue,
        contactPublic: d.contactPublic,
        themes: d.themes,
        isBasement: (d as any).isBasement ?? false,
      },
      create: {
        userId: d.sellerId,
        status: "ACTIVE",
        storeName: d.storeName,
        description: d.description,
        addressRoad: d.addressRoad,
        addressJibun: d.addressJibun,
        latitude: d.latitude,
        longitude: d.longitude,
        categoryId: d.categoryId,
        subCategoryId: d.subCategoryId,
        deposit: d.deposit,
        monthlyRent: d.monthlyRent,
        premium: d.premium,
        areaPyeong: d.areaPyeong,
        areaSqm: d.areaSqm,
        currentFloor: d.currentFloor,
        totalFloor: d.totalFloor,
        brandType: d.brandType,
        viewCount: d.viewCount,
        favoriteCount: d.favoriteCount,
        monthlyRevenue: d.monthlyRevenue,
        contactPublic: d.contactPublic,
        themes: d.themes,
        isBasement: (d as any).isBasement ?? false,
      },
    });
  }
  console.log(`  ✓ 데모 매물 ${listingsData.length}개 생성`);

  // ==========================================
  // 데모 데이터: 유료 매물 AdPurchase
  // ==========================================
  const paidListings = listingsData.filter((d) => d.tier !== null);
  for (let i = 0; i < paidListings.length; i++) {
    const d = paidListings[i];
    const listing = await prisma.listing.findUnique({ where: { userId: d.sellerId } });
    if (!listing) continue;
    await prisma.adPurchase.upsert({
      where: { id: `demo-purchase-listing-${i}` },
      update: {
        userId: d.sellerId,
        listingId: listing.id,
        productId: d.tier!,
        status: "PAID",
        amount: d.adAmount,
        activatedAt: now,
        expiresAt: in30Days,
      },
      create: {
        id: `demo-purchase-listing-${i}`,
        userId: d.sellerId,
        listingId: listing.id,
        productId: d.tier!,
        status: "PAID",
        amount: d.adAmount,
        activatedAt: now,
        expiresAt: in30Days,
      },
    });
  }
  console.log(`  ✓ 데모 매물 AdPurchase ${paidListings.length}개 생성`);

  // ==========================================
  // 데모 데이터: 협력업체 16개
  // ==========================================
  const partnersData = [
    // === VIP (3개) ===
    {
      userId: demoPartnerUsers[0].id,
      companyName: "디자인하우스",
      serviceType: "INTERIOR" as const,
      description: "상가 인테리어 전문 업체입니다. 카페, 음식점, 사무실 등 다양한 상업 공간 시공 경험이 풍부합니다. 디자인부터 시공까지 원스톱 서비스를 제공하며, 합리적인 가격에 높은 퀄리티를 보장합니다. 시공 후 1년 무상 A/S를 제공합니다.",
      contactPhone: "02-1234-5678",
      addressRoad: "서울특별시 강남구 논현로 508",
      latitude: 37.5110,
      longitude: 127.0242,
      serviceArea: ["강남구", "서초구", "송파구", "강동구"],
      tier: "VIP" as const,
      viewCount: 1245,
      productId: "partner-vip",
      adAmount: 500000,
    },
    {
      userId: demoPartnerUsers[4].id,
      companyName: "모던공간",
      serviceType: "INTERIOR" as const,
      description: "모던하고 실용적인 상가 인테리어를 추구합니다. 소자본 창업부터 대형 프랜차이즈까지 폭넓은 시공 경험. 3D 설계 무료 제공, 공사 기간 단축 시스템 운영.",
      contactPhone: "02-5678-1234",
      addressRoad: "서울특별시 서초구 반포대로 58",
      latitude: 37.5045,
      longitude: 127.0050,
      serviceArea: ["서초구", "강남구", "용산구", "동작구"],
      tier: "VIP" as const,
      viewCount: 890,
      productId: "partner-vip",
      adAmount: 500000,
    },
    {
      userId: demoPartnerUsers[8].id,
      companyName: "탑인테리어",
      serviceType: "INTERIOR" as const,
      description: "프랜차이즈 인테리어 전문. 브랜드 매뉴얼에 맞는 정확한 시공과 빠른 공사 일정이 강점입니다. 전국 시공 가능하며 A/S 2년 보장.",
      contactPhone: "032-123-4567",
      addressRoad: "인천광역시 남동구 예술로 202",
      latitude: 37.4005,
      longitude: 126.7310,
      serviceArea: ["인천", "경기", "서울"],
      tier: "VIP" as const,
      viewCount: 567,
      productId: "partner-vip",
      adAmount: 500000,
    },
    // === PREMIUM (5개) ===
    {
      userId: demoPartnerUsers[1].id,
      companyName: "빛나는간판",
      serviceType: "SIGNAGE" as const,
      description: "LED 간판, 채널 레터, 현수막 등 각종 간판 제작 전문 업체입니다. 디자인부터 제작, 설치까지 일괄 진행합니다. 20년 경력의 간판 전문가가 직접 시공하며, 야간 조명 연출에 특화되어 있습니다.",
      contactPhone: "02-2345-6789",
      addressRoad: "서울특별시 마포구 성산로 150",
      latitude: 37.5657,
      longitude: 126.9109,
      serviceArea: ["마포구", "서대문구", "은평구", "종로구"],
      tier: "PREMIUM" as const,
      viewCount: 678,
      productId: "partner-premium",
      adAmount: 300000,
    },
    {
      userId: demoPartnerUsers[5].id,
      companyName: "시그니처사인",
      serviceType: "SIGNAGE" as const,
      description: "브랜드 아이덴티티를 살리는 간판 전문. 네온사인, 입체 간판, 어닝 등 다양한 외장 사인 시공. 디자인 시안 무료 제공.",
      contactPhone: "02-6789-0123",
      addressRoad: "서울특별시 성동구 왕십리로 125",
      latitude: 37.5618,
      longitude: 127.0370,
      serviceArea: ["성동구", "광진구", "강남구", "중구"],
      tier: "PREMIUM" as const,
      viewCount: 456,
      productId: "partner-premium",
      adAmount: 300000,
    },
    {
      userId: demoPartnerUsers[12].id,
      companyName: "프로사인",
      serviceType: "SIGNAGE" as const,
      description: "외부 간판부터 실내 사인물까지 전문 시공. 관공서, 프랜차이즈 다수 납품 실적. 빠른 시공과 합리적 가격.",
      contactPhone: "031-456-7890",
      addressRoad: "경기도 수원시 영통구 광교로 145",
      latitude: 37.2894,
      longitude: 127.0486,
      serviceArea: ["수원", "용인", "성남", "화성"],
      tier: "PREMIUM" as const,
      viewCount: 389,
      productId: "partner-premium",
      adAmount: 300000,
    },
    {
      userId: demoPartnerUsers[9].id,
      companyName: "대한설비",
      serviceType: "EQUIPMENT" as const,
      description: "상가 주방 설비, 냉난방, 배관 공사 전문. 음식점 주방 설계부터 설비 시공까지 원스톱. 긴급 수리 당일 출동.",
      contactPhone: "02-7890-1234",
      addressRoad: "서울특별시 구로구 디지털로 288",
      latitude: 37.4850,
      longitude: 126.8963,
      serviceArea: ["구로구", "금천구", "영등포구", "관악구"],
      tier: "PREMIUM" as const,
      viewCount: 312,
      productId: "partner-premium",
      adAmount: 300000,
    },
    {
      userId: demoPartnerUsers[13].id,
      companyName: "만능설비",
      serviceType: "EQUIPMENT" as const,
      description: "전기, 가스, 수도 등 상가 설비 종합 시공. 30년 경력 기술자 직접 시공. 견적 무료.",
      contactPhone: "031-567-8901",
      addressRoad: "경기도 성남시 분당구 판교로 228",
      latitude: 37.3944,
      longitude: 127.1110,
      serviceArea: ["성남", "용인", "하남", "광주"],
      tier: "PREMIUM" as const,
      viewCount: 278,
      productId: "partner-premium",
      adAmount: 300000,
    },
    // === BASIC (4개) ===
    {
      userId: demoPartnerUsers[2].id,
      companyName: "김세무사무소",
      serviceType: "ACCOUNTING" as const,
      description: "상가 양수도 관련 세무 상담 전문입니다. 권리금 세금 처리, 사업자 변경, 부가세 신고 등 상가 거래에 필요한 모든 세무 서비스를 제공합니다. 초기 상담은 무료로 진행합니다.",
      contactPhone: "02-3456-7890",
      addressRoad: "서울특별시 영등포구 여의대방로 67길 9",
      latitude: 37.5223,
      longitude: 126.9184,
      serviceArea: ["영등포구", "구로구", "금천구", "관악구"],
      tier: "BASIC" as const,
      viewCount: 342,
      productId: "partner-basic",
      adAmount: 100000,
    },
    {
      userId: demoPartnerUsers[6].id,
      companyName: "정법무사",
      serviceType: "LEGAL" as const,
      description: "상가 임대차 계약서 검토, 권리금 분쟁 상담, 사업자 등록 대행. 초기 상담 무료.",
      contactPhone: "02-8901-2345",
      addressRoad: "서울특별시 종로구 종로 104",
      latitude: 37.5700,
      longitude: 126.9920,
      serviceArea: ["종로구", "중구", "서대문구"],
      tier: "BASIC" as const,
      viewCount: 210,
      productId: "partner-basic",
      adAmount: 100000,
    },
    {
      userId: demoPartnerUsers[10].id,
      companyName: "한회계법인",
      serviceType: "ACCOUNTING" as const,
      description: "창업 세무, 양도양수 세금 정리, 부가세 신고 대행. 상가 전문 세무사 상주.",
      contactPhone: "02-0123-4567",
      addressRoad: "서울특별시 강남구 테헤란로 152",
      latitude: 37.5001,
      longitude: 127.0365,
      serviceArea: ["강남구", "서초구", "송파구"],
      tier: "BASIC" as const,
      viewCount: 180,
      productId: "partner-basic",
      adAmount: 100000,
    },
    {
      userId: demoPartnerUsers[14].id,
      companyName: "최노무사",
      serviceType: "CONSULTING" as const,
      description: "직원 채용, 4대보험, 노무 상담 전문. 소규모 자영업자 맞춤 노무 서비스.",
      contactPhone: "02-2345-0987",
      addressRoad: "서울특별시 동작구 상도로 270",
      latitude: 37.4967,
      longitude: 126.9536,
      serviceArea: ["동작구", "관악구", "서초구"],
      tier: "BASIC" as const,
      viewCount: 156,
      productId: "partner-basic",
      adAmount: 100000,
    },
    // === FREE (4개) ===
    {
      userId: demoPartnerUsers[3].id,
      companyName: "깨끗한청소",
      serviceType: "CLEANING" as const,
      description: "상가 입주 청소, 정기 청소 전문 업체입니다. 인수인계 전후 매장 대청소, 주방 후드 청소, 바닥 왁스 작업 등을 전문으로 합니다. 친환경 세제만 사용합니다.",
      contactPhone: "02-4567-8901",
      addressRoad: "서울특별시 중랑구 면목로 217",
      latitude: 37.5889,
      longitude: 127.0859,
      serviceArea: ["중랑구", "성동구", "동대문구", "광진구"],
      tier: "FREE" as const,
      viewCount: 123,
      productId: null,
      adAmount: 0,
    },
    {
      userId: demoPartnerUsers[7].id,
      companyName: "번개철거",
      serviceType: "OTHER" as const,
      description: "상가 철거, 원상복구 전문. 소규모부터 대형 철거까지. 폐기물 처리 포함.",
      contactPhone: "02-9012-3456",
      addressRoad: "서울특별시 노원구 동일로 1414",
      latitude: 37.6543,
      longitude: 127.0614,
      serviceArea: ["노원구", "도봉구", "강북구"],
      tier: "FREE" as const,
      viewCount: 98,
      productId: null,
      adAmount: 0,
    },
    {
      userId: demoPartnerUsers[11].id,
      companyName: "밝은전기",
      serviceType: "OTHER" as const,
      description: "상가 전기 공사, 조명 설치, 전기 안전 점검. 당일 출장 가능.",
      contactPhone: "02-1357-2468",
      addressRoad: "서울특별시 강서구 공항대로 247",
      latitude: 37.5596,
      longitude: 126.8354,
      serviceArea: ["강서구", "양천구", "마포구"],
      tier: "FREE" as const,
      viewCount: 54,
      productId: null,
      adAmount: 0,
    },
    {
      userId: demoPartnerUsers[15].id,
      companyName: "스마트세무",
      serviceType: "ACCOUNTING" as const,
      description: "온라인 세무 상담, 기장 대리, 종합소득세 신고 대행.",
      contactPhone: "031-678-9012",
      addressRoad: "경기도 고양시 일산동구 장항동 856",
      latitude: 37.6686,
      longitude: 126.7718,
      serviceArea: ["고양", "파주", "김포"],
      tier: "FREE" as const,
      viewCount: 42,
      productId: null,
      adAmount: 0,
    },
  ];

  for (const p of partnersData) {
    await prisma.partnerService.upsert({
      where: { userId: p.userId },
      update: {
        status: "ACTIVE",
        companyName: p.companyName,
        serviceType: p.serviceType,
        description: p.description,
        contactPhone: p.contactPhone,
        addressRoad: p.addressRoad,
        latitude: p.latitude,
        longitude: p.longitude,
        serviceArea: p.serviceArea,
        tier: p.tier,
        tierExpiresAt: p.tier !== "FREE" ? in30Days : null,
        viewCount: p.viewCount,
      },
      create: {
        userId: p.userId,
        status: "ACTIVE",
        companyName: p.companyName,
        serviceType: p.serviceType,
        description: p.description,
        contactPhone: p.contactPhone,
        addressRoad: p.addressRoad,
        latitude: p.latitude,
        longitude: p.longitude,
        serviceArea: p.serviceArea,
        tier: p.tier,
        tierExpiresAt: p.tier !== "FREE" ? in30Days : null,
        viewCount: p.viewCount,
      },
    });
  }
  console.log(`  ✓ 데모 협력업체 ${partnersData.length}개 생성`);

  // 협력업체 유료 AdPurchase
  const paidPartners = partnersData.filter((p) => p.productId !== null);
  for (let i = 0; i < paidPartners.length; i++) {
    const p = paidPartners[i];
    const ps = await prisma.partnerService.findUnique({ where: { userId: p.userId } });
    if (!ps) continue;
    await prisma.adPurchase.upsert({
      where: { id: `demo-purchase-partner-${i}` },
      update: {
        userId: p.userId,
        partnerServiceId: ps.id,
        productId: p.productId!,
        status: "PAID",
        amount: p.adAmount,
        activatedAt: now,
        expiresAt: in30Days,
      },
      create: {
        id: `demo-purchase-partner-${i}`,
        userId: p.userId,
        partnerServiceId: ps.id,
        productId: p.productId!,
        status: "PAID",
        amount: p.adAmount,
        activatedAt: now,
        expiresAt: in30Days,
      },
    });
  }
  console.log(`  ✓ 데모 협력업체 AdPurchase ${paidPartners.length}개 생성`);

  // ==========================================
  // 데모 데이터: 집기장터 5개
  // ==========================================
  const equipmentData = [
    {
      id: "demo-equipment-0",
      userId: demoSellers[0].id,
      title: "업소용 냉장고 (유니크 UDS-45RDR)",
      description: "2년 사용한 업소용 45박스 냉장고입니다. 냉장/냉동 겸용이며 상태 양호합니다. 내부 선반 5단 포함. 직접 방문하셔서 확인 가능합니다. 카페 정리 중 판매합니다.",
      category: "REFRIGERATION" as const,
      condition: "GOOD" as const,
      price: 1200000,
      tradeMethod: "DIRECT" as const,
      addressRoad: "서울특별시 강남구 강남대로 396",
      latitude: 37.4979,
      longitude: 127.0276,
      quantity: 1,
      viewCount: 234,
    },
    {
      id: "demo-equipment-1",
      userId: demoSellers[1].id,
      title: "4인 테이블 + 의자 세트 (5세트)",
      description: "원목 테이블 700x700 사이즈와 등받이 의자 4개 세트입니다. 총 5세트 일괄 판매합니다. 약간의 사용감이 있으나 전체적으로 깨끗한 상태입니다. 음식점 폐업으로 판매합니다.",
      category: "TABLE_CHAIR" as const,
      condition: "GOOD" as const,
      price: 500000,
      tradeMethod: "DIRECT" as const,
      addressRoad: "서울특별시 마포구 와우산로 94",
      latitude: 37.5563,
      longitude: 126.9236,
      quantity: 5,
      viewCount: 187,
    },
    {
      id: "demo-equipment-2",
      userId: demoSellers[3].id,
      title: "포스기 시스템 (키오스크 포함)",
      description: "터치스크린 POS 시스템과 키오스크 세트입니다. 카드 단말기, 영수증 프린터, 주방 프린터 포함. 1년 사용했으며 최신 소프트웨어 업데이트 완료. 상태 매우 좋습니다.",
      category: "POS_ELECTRONIC" as const,
      condition: "EXCELLENT" as const,
      price: 300000,
      tradeMethod: "BOTH" as const,
      addressRoad: "서울특별시 서대문구 연세로 11",
      latitude: 37.5573,
      longitude: 126.9367,
      quantity: 1,
      viewCount: 456,
    },
    {
      id: "demo-equipment-3",
      userId: demoSellers[5].id,
      title: "업소용 가스레인지 (5구)",
      description: "중화 5구 가스레인지입니다. 3년 사용했으며 화력은 좋은 편입니다. 약간의 기스가 있지만 작동에는 문제없습니다. 치킨집 업종 변경으로 판매합니다.",
      category: "KITCHEN" as const,
      condition: "FAIR" as const,
      price: 800000,
      tradeMethod: "DIRECT" as const,
      addressRoad: "서울특별시 강서구 화곡로 264",
      latitude: 37.5412,
      longitude: 126.8397,
      quantity: 1,
      viewCount: 98,
    },
    {
      id: "demo-equipment-4",
      userId: demoSellers[4].id,
      title: "에스프레소 머신 (라마르조코 리네아미니)",
      description: "라마르조코 리네아미니 2그룹 에스프레소 머신입니다. 정기 점검을 빠짐없이 받았으며 상태가 매우 우수합니다. 그라인더(말코닉 EK43)도 함께 판매 가능합니다. 카페 이전으로 판매합니다.",
      category: "KITCHEN" as const,
      condition: "EXCELLENT" as const,
      price: 2000000,
      tradeMethod: "DIRECT" as const,
      addressRoad: "서울특별시 서초구 서초대로 398",
      latitude: 37.4922,
      longitude: 127.0140,
      quantity: 1,
      viewCount: 521,
    },
  ];

  for (const eq of equipmentData) {
    await prisma.equipment.upsert({
      where: { id: eq.id },
      update: {
        userId: eq.userId,
        status: "ACTIVE",
        title: eq.title,
        description: eq.description,
        category: eq.category,
        condition: eq.condition,
        price: eq.price,
        tradeMethod: eq.tradeMethod,
        addressRoad: eq.addressRoad,
        latitude: eq.latitude,
        longitude: eq.longitude,
        quantity: eq.quantity,
        viewCount: eq.viewCount,
      },
      create: {
        id: eq.id,
        userId: eq.userId,
        status: "ACTIVE",
        title: eq.title,
        description: eq.description,
        category: eq.category,
        condition: eq.condition,
        price: eq.price,
        tradeMethod: eq.tradeMethod,
        addressRoad: eq.addressRoad,
        latitude: eq.latitude,
        longitude: eq.longitude,
        quantity: eq.quantity,
        viewCount: eq.viewCount,
      },
    });
  }
  console.log(`  ✓ 데모 집기장터 ${equipmentData.length}개 생성`);

  // ==========================================
  // 데모 이미지 (매물, 협력업체, 집기)
  // ==========================================
  const imgTypes = ["EXTERIOR", "INTERIOR", "KITCHEN", "OTHER"] as const;

  // 매물 이미지 (유료: 5장, 무료: 3장)
  for (let i = 0; i < listingsData.length; i++) {
    const listing = await prisma.listing.findUnique({ where: { userId: listingsData[i].sellerId } });
    if (!listing) continue;
    await prisma.listingImage.deleteMany({ where: { listingId: listing.id } });
    const imgCount = listingsData[i].tier ? 5 : 3;
    for (let j = 0; j < imgCount; j++) {
      await prisma.listingImage.create({
        data: {
          listingId: listing.id,
          url: `https://picsum.photos/seed/store-${i}-${j}/800/600`,
          type: imgTypes[j % imgTypes.length],
          sortOrder: j,
        },
      });
    }
  }
  console.log("  ✓ 데모 매물 이미지 생성");

  // 협력업체 이미지 (각 3장)
  for (let i = 0; i < partnersData.length; i++) {
    const ps = await prisma.partnerService.findUnique({ where: { userId: partnersData[i].userId } });
    if (!ps) continue;
    await prisma.partnerImage.deleteMany({ where: { partnerServiceId: ps.id } });
    for (let j = 0; j < 3; j++) {
      await prisma.partnerImage.create({
        data: {
          partnerServiceId: ps.id,
          url: `https://picsum.photos/seed/partner-${i}-${j}/800/600`,
          type: imgTypes[j % imgTypes.length],
          sortOrder: j,
        },
      });
    }
  }
  console.log("  ✓ 데모 협력업체 이미지 생성");

  // 집기 이미지 (각 2장)
  for (let i = 0; i < equipmentData.length; i++) {
    const eq = await prisma.equipment.findUnique({ where: { id: equipmentData[i].id } });
    if (!eq) continue;
    await prisma.equipmentImage.deleteMany({ where: { equipmentId: eq.id } });
    for (let j = 0; j < 2; j++) {
      await prisma.equipmentImage.create({
        data: {
          equipmentId: eq.id,
          url: `https://picsum.photos/seed/equip-${i}-${j}/800/600`,
          sortOrder: j,
        },
      });
    }
  }
  console.log("  ✓ 데모 집기 이미지 생성");

  // ==========================================
  // 데모 데이터: 커뮤니티 글 6개
  // ==========================================
  const postsData = [
    {
      id: "demo-post-0",
      authorId: demoSellers[0].id,
      title: "카페 창업 비용 얼마나 드나요?",
      content: "안녕하세요, 카페 창업을 준비하고 있는 예비 창업자입니다. 서울 기준으로 15평 정도 매장에서 카페를 열려면 총 비용이 얼마나 들까요? 권리금, 보증금, 인테리어, 장비 등 항목별로 알고 싶습니다. 경험자분들의 조언 부탁드립니다.",
      tag: "질문",
      viewCount: 1523,
      likeCount: 42,
    },
    {
      id: "demo-post-1",
      authorId: demoSellers[1].id,
      title: "권리샵으로 가게 구했어요 후기",
      content: "3개월 동안 발품 팔다가 권리샵에서 마포구 라멘집 매물을 발견했습니다. 직거래라 중개 수수료가 없어서 확실히 비용 절감이 됐어요. 판매자분이랑 직접 소통하면서 매장 상태도 꼼꼼히 확인할 수 있었습니다. 현재 오픈 준비 중이에요! 다들 좋은 매물 찾으시길 바랍니다.",
      tag: "후기",
      viewCount: 2341,
      likeCount: 87,
    },
    {
      id: "demo-post-2",
      authorId: demoSellers[2].id,
      title: "상가 임대차 계약 시 주의사항",
      content: "상가 임대차 계약 전 반드시 확인해야 할 사항들을 정리했습니다. 첫째, 등기부등본을 확인하여 소유자와 근저당 설정 여부를 체크하세요. 둘째, 상가건물임대차보호법 적용 여부를 확인하세요. 셋째, 권리금 계약서는 반드시 별도로 작성하고, 인수인계 항목을 상세히 기재하세요. 넷째, 원상복구 의무 범위를 명확히 해두세요.",
      tag: "정보",
      viewCount: 3156,
      likeCount: 156,
    },
    {
      id: "demo-post-3",
      authorId: demoSellers[4].id,
      title: "편의점 vs 카페 어떤게 수익이 좋을까요?",
      content: "직장을 그만두고 창업을 고민 중입니다. 편의점과 카페 중 어떤 업종이 수익성이 더 좋을까요? 편의점은 안정적이지만 마진이 낮다고 하고, 카페는 마진이 높지만 경쟁이 치열하다고 들었습니다. 두 업종 모두 경험해보신 분이 계시면 현실적인 조언 부탁드립니다.",
      tag: "질문",
      viewCount: 1876,
      likeCount: 63,
    },
    {
      id: "demo-post-4",
      authorId: demoSellers[6].id,
      title: "권리금 적정가 판단하는 방법",
      content: "권리금의 적정가를 판단하는 방법을 공유합니다. 기본적으로 월 순수익의 10~15배가 일반적인 기준입니다. 하지만 업종, 위치, 시설 상태에 따라 달라질 수 있습니다. 국세청 홈택스에서 매출 자료를 확인하고, 주변 유사 매물의 권리금도 비교해보세요. 권리샵의 시장분석 리포트를 활용하면 객관적인 데이터를 얻을 수 있습니다.",
      tag: "정보",
      viewCount: 2789,
      likeCount: 134,
    },
    {
      id: "demo-post-5",
      authorId: demoSellers[9].id,
      title: "첫 장사 시작합니다!",
      content: "10년 직장생활을 접고 드디어 관악구에 피트니스 센터를 오픈했습니다. 처음이라 서툰 것도 많지만, 회원분들이 잘 찾아주셔서 감사한 마음입니다. 같은 길을 걷는 자영업자분들 모두 힘내세요! 좋은 소식 또 공유하겠습니다.",
      tag: "후기",
      viewCount: 987,
      likeCount: 201,
    },
  ];

  for (const post of postsData) {
    await prisma.post.upsert({
      where: { id: post.id },
      update: {
        authorId: post.authorId,
        title: post.title,
        content: post.content,
        tag: post.tag,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
      },
      create: {
        id: post.id,
        authorId: post.authorId,
        title: post.title,
        content: post.content,
        tag: post.tag,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
      },
    });
  }
  console.log(`  ✓ 데모 커뮤니티 글 ${postsData.length}개 생성`);

  // ==========================================
  // 기존 테스트 매물 정리 (데모/관리자 외 ACTIVE 매물에 이미지 보정)
  // ==========================================
  const demoEmails = [
    ...Array.from({ length: 11 }, (_, i) => `seller${i + 1}@demo.com`),
    ...Array.from({ length: 4 }, (_, i) => `partner${i + 1}@demo.com`),
    "admin@kwonrishop.com",
  ];
  const orphanListings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      user: { email: { notIn: demoEmails } },
    },
    include: { images: true },
  });
  for (const ol of orphanListings) {
    if (ol.images.length === 0 || ol.images.some((img) => img.url.startsWith("/images/"))) {
      // 깨진 이미지 삭제 후 플레이스홀더 추가
      await prisma.listingImage.deleteMany({ where: { listingId: ol.id } });
      for (let j = 0; j < 3; j++) {
        await prisma.listingImage.create({
          data: {
            listingId: ol.id,
            url: `https://picsum.photos/seed/orphan-${ol.id.slice(-4)}-${j}/800/600`,
            type: imgTypes[j % imgTypes.length],
            sortOrder: j,
          },
        });
      }
    }
  }
  if (orphanListings.length > 0) {
    console.log(`  ✓ 기존 매물 ${orphanListings.length}개 이미지 보정`);
  }

  console.log("\n시드 데이터 삽입 완료!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
