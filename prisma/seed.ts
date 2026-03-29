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
      topExposure: true,
      highlight: true,
      bumpCount: 10,
      analytics: true,
      mainRecommend: true,
      video: 1,
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
  // ── 협력업체 (PARTNER) ──
  {
    id: "partner-basic",
    name: "베이직",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 100000,
    duration: 30,
    sortOrder: 16,
    features: {
      badge: "베이직",
      photos: 10,
      verified: true,
      description: "사진10장, 배지",
    },
  },
  {
    id: "partner-premium",
    name: "프리미엄",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 300000,
    duration: 30,
    sortOrder: 17,
    features: {
      badge: "프리미엄",
      photos: 20,
      topExposure: true,
      portfolio: 20,
      description: "상위노출, 포트폴리오20건",
    },
  },
  {
    id: "partner-vip",
    name: "VIP",
    type: "PACKAGE" as const,
    categoryScope: "PARTNER" as const,
    price: 500000,
    duration: 30,
    sortOrder: 18,
    features: {
      badge: "VIP",
      photos: 999,
      topExposure: true,
      portfolio: 999,
      mainRecommend: true,
      description: "최상위노출, 추천업체 연동",
    },
  },
  // ── 집기장터 (EQUIPMENT) ──
  {
    id: "equipment-basic",
    name: "베이직",
    type: "PACKAGE" as const,
    categoryScope: "EQUIPMENT" as const,
    price: 50000,
    duration: 30,
    sortOrder: 19,
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
    price: 150000,
    duration: 30,
    sortOrder: 20,
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
    price: 300000,
    duration: 30,
    sortOrder: 21,
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
    sortOrder: 19,
    features: {
      bumpCount: 1,
      description: "목록 최상단 1회 끌어올리기",
    },
  },
  {
    id: "common-badge",
    name: "강조배지",
    type: "SINGLE" as const,
    categoryScope: "COMMON" as const,
    price: 10000,
    duration: 30,
    sortOrder: 20,
    features: {
      tag: "강조",
      description: "강조 배지 30일",
    },
  },
  {
    id: "common-region-top",
    name: "지역TOP",
    type: "SINGLE" as const,
    categoryScope: "COMMON" as const,
    price: 50000,
    duration: 7,
    sortOrder: 21,
    features: {
      regionBanner: true,
      description: "지역 검색 상단 배너 7일",
    },
  },
  // ── 끌어올리기 구독 (SUBSCRIPTION) ──
  {
    id: "bump-subscription-lite",
    name: "끌어올리기 라이트",
    type: "SUBSCRIPTION" as const,
    categoryScope: "COMMON" as const,
    price: 29000,
    duration: 30,
    sortOrder: 22,
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
    price: 59000,
    duration: 30,
    sortOrder: 23,
    features: {
      frequency: "WEEKDAY_DAILY",
      bumpTimes: ["09:00"],
      description: "평일 매일 오전 9시 자동 끌어올리기",
      savingsPercent: 21,
      popular: true,
    },
  },
  {
    id: "bump-subscription-premium",
    name: "끌어올리기 프리미엄",
    type: "SUBSCRIPTION" as const,
    categoryScope: "COMMON" as const,
    price: 79000,
    duration: 30,
    sortOrder: 24,
    features: {
      frequency: "DAILY",
      bumpTimes: ["09:00"],
      description: "매일 1회 오전 9시 자동 끌어올리기",
      savingsPercent: 12,
    },
  },
  {
    id: "bump-subscription-vip",
    name: "끌어올리기 VIP",
    type: "SUBSCRIPTION" as const,
    categoryScope: "COMMON" as const,
    price: 99000,
    duration: 30,
    sortOrder: 25,
    features: {
      frequency: "TWICE_DAILY",
      bumpTimes: ["09:00", "18:00"],
      description: "매일 2회 (오전 9시 + 오후 6시) 자동 끌어올리기",
    },
  },
  {
    id: "common-report",
    name: "상권분석 리포트",
    type: "SINGLE" as const,
    categoryScope: "COMMON" as const,
    price: 30000,
    duration: null,
    sortOrder: 26,
    features: {
      report: true,
      description: "유동인구, 업종분포, 평균매출 등 상세 상권 데이터 (1회 구매 시 영구 열람)",
    },
  },
  {
    id: "common-seller-report",
    name: "매도자 시장분석 리포트",
    type: "SINGLE" as const,
    categoryScope: "COMMON" as const,
    price: 15000,
    duration: null,
    sortOrder: 27,
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
