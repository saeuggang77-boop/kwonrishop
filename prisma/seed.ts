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
    icon: "🍽️",
    sortOrder: 1,
    subCategories: [
      "한식", "중식", "일식", "양식", "분식",
      "치킨", "피자", "햄버거", "족발/보쌈", "찜/탕/찌개",
      "고기/구이", "해산물", "국수/면", "죽/도시락", "기타 외식",
    ],
  },
  {
    name: "카페/음료",
    icon: "☕",
    sortOrder: 2,
    subCategories: [
      "커피전문점", "디저트카페", "베이커리", "차/주스",
      "아이스크림/빙수", "술집/바", "기타 음료",
    ],
  },
  {
    name: "서비스업",
    icon: "✂️",
    sortOrder: 3,
    subCategories: [
      "미용실", "네일/속눈썹", "피부관리", "마사지/스파",
      "세탁소", "수선/수리", "인쇄/복사", "청소업", "기타 서비스",
    ],
  },
  {
    name: "판매/유통",
    icon: "🏪",
    sortOrder: 4,
    subCategories: [
      "편의점", "슈퍼마켓", "과일/야채", "정육점", "반찬가게",
      "의류/잡화", "화장품", "꽃집", "문구/완구",
      "핸드폰/전자기기", "철물점", "기타 판매",
    ],
  },
  {
    name: "교육/학원",
    icon: "📚",
    sortOrder: 5,
    subCategories: [
      "입시학원", "어학원", "음악/미술학원", "체육/무도학원",
      "컴퓨터/코딩학원", "유아교육", "독서실/스터디카페", "기타 교육",
    ],
  },
  {
    name: "건강/의료",
    icon: "💪",
    sortOrder: 6,
    subCategories: [
      "헬스/피트니스", "필라테스/요가", "약국", "한의원",
      "병원/의원", "동물병원", "기타 건강",
    ],
  },
  {
    name: "기타",
    icon: "🏢",
    sortOrder: 7,
    subCategories: [
      "부동산중개", "PC방", "노래방", "당구장",
      "코인빨래방", "무인매장", "공유오피스", "숙박/게스트하우스",
      "자동차 관련", "사진/영상", "기타 업종",
    ],
  },
];

const adProducts = [
  {
    name: "프리미엄",
    type: "PACKAGE" as const,
    price: 55000,
    duration: 30,
    sortOrder: 1,
    features: {
      badge: "프리미엄",
      photos: 15,
      topExposure: true,
      highlight: true,
      bumpCount: 5,
      description: "프리미엄 배지 + 사진 15장 + 상단노출 + 하이라이트 + 끌어올리기 5회",
    },
  },
  {
    name: "VIP",
    type: "PACKAGE" as const,
    price: 33000,
    duration: 30,
    sortOrder: 2,
    features: {
      badge: "VIP",
      photos: 10,
      topExposure: true,
      highlight: false,
      bumpCount: 3,
      description: "VIP 배지 + 사진 10장 + 상단노출 + 끌어올리기 3회",
    },
  },
  {
    name: "끌어올리기",
    type: "SINGLE" as const,
    price: 3300,
    duration: null,
    sortOrder: 3,
    features: {
      bumpCount: 1,
      description: "매물을 목록 최상단으로 끌어올립니다 (1회)",
    },
  },
  {
    name: "급매 태그",
    type: "SINGLE" as const,
    price: 5500,
    duration: 7,
    sortOrder: 4,
    features: {
      tag: "급매",
      description: "급매 태그를 7일간 표시합니다",
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
    industry: "카페/음료",
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
    industry: "소매/유통",
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
    industry: "카페/음료",
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
    industry: "소매/유통",
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
    industry: "카페/음료",
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
      where: { id: product.name },
      update: {
        price: product.price,
        duration: product.duration,
        features: product.features,
        sortOrder: product.sortOrder,
      },
      create: {
        name: product.name,
        type: product.type,
        price: product.price,
        duration: product.duration,
        features: product.features,
        sortOrder: product.sortOrder,
      },
    });
    console.log(`  ✓ 광고상품: ${product.name} (${product.price.toLocaleString()}원)`);
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
