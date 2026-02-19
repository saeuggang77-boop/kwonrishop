import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://kwonrishop:kwonrishop_dev@localhost:5432/kwonrishop";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/** 업종별 Unsplash 이미지 ID 매핑 */
const CATEGORY_UNSPLASH: Record<string, string> = {
  KOREAN_FOOD:   "photo-1498654896293-37aacf113fd9",
  BUNSIK:        "photo-1498654896293-37aacf113fd9",
  CAFE_BAKERY:   "photo-1554118811-1e0d58224f24",
  CHICKEN:       "photo-1626645738196-c2a7c87a8f58",
  SERVICE:       "photo-1560066984-138dadb4c035",
  RETAIL:        "photo-1604719312566-8912e9227c6a",
  ENTERTAINMENT: "photo-1534438327276-14e5300c3a48",
  PIZZA:         "photo-1565299624946-b28f40a0ae38",
  BAR_PUB:       "photo-1514933651103-005eec06c04b",
  EDUCATION:     "photo-1580582932707-520aed937b7b",
  WESTERN_FOOD:  "photo-1550966871-3ed3cdb51f3a",
  CHINESE_FOOD:  "photo-1525755662778-989d0524087e",
  JAPANESE_FOOD: "photo-1579871494447-9811cf80d66c",
};

function unsplashUrl(category: string, w: number, h: number): string {
  const id = CATEGORY_UNSPLASH[category] ?? "photo-1498654896293-37aacf113fd9";
  return `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop`;
}

async function main() {
  console.log("Seeding database...\n");

  // ──────────────────────────────────────────────
  // 1. Users
  // ──────────────────────────────────────────────
  const password = await bcrypt.hash("test1234!", 12);

  await prisma.user.upsert({
    where: { email: "admin@kwonrishop.com" },
    update: {},
    create: {
      email: "admin@kwonrishop.com",
      name: "관리자",
      hashedPassword: password,
      role: "ADMIN",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@test.com" },
    update: {},
    create: {
      email: "seller@test.com",
      name: "김사장",
      hashedPassword: password,
      role: "SELLER",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
      phone: "010-1234-5678",
      businessName: "강남부동산",
      businessNumber: "123-45-67890",
      subscriptionTier: "FREE",
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@test.com" },
    update: {},
    create: {
      email: "buyer@test.com",
      name: "이창업",
      hashedPassword: password,
      role: "BUYER",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
      phone: "010-9876-5432",
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@test.com" },
    update: {},
    create: {
      email: "agent@test.com",
      name: "박중개",
      hashedPassword: password,
      role: "AGENT",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
      phone: "010-5555-1234",
      businessName: "박중개부동산",
      businessNumber: "456-78-90123",
    },
  });

  const franchiseUser = await prisma.user.upsert({
    where: { email: "franchise@test.com" },
    update: {},
    create: {
      email: "franchise@test.com",
      name: "최본사",
      hashedPassword: password,
      role: "FRANCHISE",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
      phone: "010-6666-1234",
      businessName: "맛있는치킨 본사",
      businessNumber: "789-01-23456",
    },
  });

  const expert = await prisma.user.upsert({
    where: { email: "expert@test.com" },
    update: {},
    create: {
      email: "expert@test.com",
      name: "정세무",
      hashedPassword: password,
      role: "EXPERT",
      expertCategory: "ACCOUNTING",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
      phone: "010-7777-1234",
      businessName: "정세무회계사무소",
      businessNumber: "012-34-56789",
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: "seller2@test.com" },
    update: {},
    create: {
      email: "seller2@test.com",
      name: "박점주",
      hashedPassword: password,
      role: "SELLER",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
      phone: "010-2222-3333",
      businessName: "서울부동산중개",
      businessNumber: "234-56-78901",
      subscriptionTier: "FREE",
    },
  });

  const seller3 = await prisma.user.upsert({
    where: { email: "seller3@test.com" },
    update: {},
    create: {
      email: "seller3@test.com",
      name: "최가게",
      hashedPassword: password,
      role: "SELLER",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
      phone: "010-3333-4444",
      businessName: "경기상가중개",
      businessNumber: "345-67-89012",
      subscriptionTier: "FREE",
    },
  });

  console.log("  Users: admin, seller, seller2, seller3, buyer, agent, franchise, expert");

  // ──────────────────────────────────────────────
  // 2. Fraud Rules
  // ──────────────────────────────────────────────
  const fraudRules = [
    {
      ruleType: "DUPLICATE_PHOTO" as const,
      name: "동일 사진 다건 등록",
      description: "동일하거나 매우 유사한 사진이 다른 매물에서도 사용된 경우",
      parameters: { hashThreshold: 5, minSimilarity: 0.95 },
      severity: "HIGH" as const,
    },
    {
      ruleType: "PRICE_SPIKE" as const,
      name: "가격 급등/급락",
      description: "해당 지역 평균 대비 가격이 비정상적으로 높거나 낮은 경우",
      parameters: { deviationPercent: 50, minComparables: 3 },
      severity: "HIGH" as const,
    },
    {
      ruleType: "MULTI_ACCOUNT_CONTACT" as const,
      name: "동일 연락처 다계정",
      description: "동일 연락처로 여러 계정에서 매물이 등록된 경우",
      parameters: { maxAccountsPerPhone: 1 },
      severity: "MEDIUM" as const,
    },
  ];

  for (const rule of fraudRules) {
    await prisma.fraudRule.upsert({
      where: { id: rule.ruleType },
      update: rule,
      create: { id: rule.ruleType, ...rule },
    });
  }
  console.log("  Fraud rules: 3");

  // ──────────────────────────────────────────────
  // 3. Legal Documents
  // ──────────────────────────────────────────────
  const legalDocs = [
    {
      slug: "terms-of-service",
      title: "이용약관",
      version: "1.0.0",
      effectiveDate: new Date("2026-01-01"),
      content: `# 권리샵 이용약관\n\n## 제1조 (목적)\n본 약관은 권리샵(이하 "회사")이 제공하는 상가 점포 거래 플랫폼 서비스의 이용 조건을 규정합니다.\n\n## 제2조 (면책조항)\n본 서비스에서 제공하는 매물 정보, 매출 정보는 참고용이며 법적 효력이 없습니다.\n\n**중요: 실사 및 법무 검토를 권장합니다.**`,
    },
    {
      slug: "privacy-policy",
      title: "개인정보처리방침",
      version: "1.0.0",
      effectiveDate: new Date("2026-01-01"),
      content: `# 권리샵 개인정보처리방침\n\n## 제1조 (수집 목적)\n회원 가입, 서비스 제공, 결제 처리를 위해 개인정보를 수집합니다.\n\n## 제2조 (수집 항목)\n필수: 이메일, 이름 / 선택: 전화번호, 사업자번호\n\n**중요: 법무 검토를 권장합니다.**`,
    },
  ];

  for (const doc of legalDocs) {
    await prisma.legalDocument.upsert({
      where: { slug: doc.slug },
      update: doc,
      create: doc,
    });
  }
  console.log("  Legal documents: 2");

  // ──────────────────────────────────────────────
  // 4. Sample Listings (상가 매물)
  // ──────────────────────────────────────────────
  const sampleListings = [
    {
      title: "강남역 카페 양도",
      description: "강남역 도보 3분 카페입니다. 좌석 40석, 매출 안정적이며 단골 고객 다수. 인테리어 2024년 리모델링 완료. 에스프레소 머신, 제빙기 등 전체 장비 포함.",
      businessCategory: "CAFE_BAKERY" as const,
      storeType: "GENERAL_STORE" as const,
      businessSubtype: "커피전문점",
      price: BigInt(50_000_000),
      monthlyRent: BigInt(3_500_000),
      premiumFee: BigInt(120_000_000),
      managementFee: BigInt(200_000),
      monthlyRevenue: BigInt(25_000_000),
      monthlyProfit: BigInt(8_000_000),
      operatingYears: 3,
      address: "강남대로 396",
      city: "서울특별시",
      district: "강남구",
      neighborhood: "역삼동",
      areaM2: 66.0,
      areaPyeong: 20.0,
      floor: 1,
      latitude: 37.4979,
      longitude: 127.0276,
      contactPhone: "010-1234-5678",
      safetyGrade: "A" as const,
      safetyComment: "매출증빙 완료, 권리금 시세 적정가 범위",
    },
    {
      title: "홍대 치킨호프 급매",
      description: "홍대입구역 도보 5분, 유동인구 많은 핵심 입지. 치킨+호프 동시 운영, 배달 매출 비중 40%. 풀장비 포함, 바로 영업 가능.",
      businessCategory: "CHICKEN" as const,
      storeType: "GENERAL_STORE" as const,
      businessSubtype: "치킨호프",
      price: BigInt(30_000_000),
      monthlyRent: BigInt(2_500_000),
      premiumFee: BigInt(80_000_000),
      managementFee: BigInt(150_000),
      monthlyRevenue: BigInt(35_000_000),
      monthlyProfit: BigInt(10_000_000),
      operatingYears: 5,
      address: "양화로 186",
      city: "서울특별시",
      district: "마포구",
      neighborhood: "동교동",
      areaM2: 82.5,
      areaPyeong: 25.0,
      floor: 1,
      latitude: 37.5567,
      longitude: 126.9237,
      contactPhone: "010-1234-5678",
      safetyGrade: "A" as const,
      safetyComment: "매출증빙 완료, 5년 운영 안정 점포",
    },
    {
      title: "잠실 한식당 양도",
      description: "잠실역 인근 한식 전문점. 런치 직장인 수요 탄탄, 단체 예약 많음. 주방 시설 최신, 홀 50석 규모.",
      businessCategory: "KOREAN_FOOD" as const,
      storeType: "GENERAL_STORE" as const,
      businessSubtype: "한정식",
      price: BigInt(80_000_000),
      monthlyRent: BigInt(5_000_000),
      premiumFee: BigInt(200_000_000),
      managementFee: BigInt(300_000),
      monthlyRevenue: BigInt(50_000_000),
      monthlyProfit: BigInt(15_000_000),
      operatingYears: 7,
      address: "올림픽로 135",
      city: "서울특별시",
      district: "송파구",
      neighborhood: "잠실동",
      areaM2: 132.0,
      areaPyeong: 40.0,
      floor: 1,
      latitude: 37.5133,
      longitude: 127.1001,
      contactPhone: "010-1234-5678",
      safetyGrade: "B" as const,
      safetyComment: "사업자등록증 확인 완료, 매출증빙 일부",
    },
    {
      title: "이태원 바/펍 양도",
      description: "이태원 메인 거리 바. 외국인 고객 비율 60%, 주말 매출 높음. 칵테일바 인테리어 고급스러움.",
      businessCategory: "BAR_PUB" as const,
      storeType: "GENERAL_STORE" as const,
      businessSubtype: "칵테일바",
      price: BigInt(40_000_000),
      monthlyRent: BigInt(4_000_000),
      premiumFee: BigInt(150_000_000),
      managementFee: BigInt(250_000),
      monthlyRevenue: BigInt(40_000_000),
      monthlyProfit: BigInt(12_000_000),
      operatingYears: 2,
      address: "이태원로 177",
      city: "서울특별시",
      district: "용산구",
      neighborhood: "이태원동",
      areaM2: 82.5,
      areaPyeong: 25.0,
      floor: 2,
      latitude: 37.5345,
      longitude: 126.9945,
      contactPhone: "010-1234-5678",
      safetyGrade: "C" as const,
      safetyComment: "매출증빙 미비, 권리금 시세 대비 다소 높음",
    },
    {
      title: "교대역 미용실 양도",
      description: "교대역 도보 2분 미용실. 고정 고객 300명+, 헤어디자이너 3명 근무 중. 시설 양호.",
      businessCategory: "SERVICE" as const,
      storeType: "GENERAL_STORE" as const,
      businessSubtype: "헤어샵",
      price: BigInt(20_000_000),
      monthlyRent: BigInt(2_000_000),
      premiumFee: BigInt(60_000_000),
      managementFee: BigInt(100_000),
      monthlyRevenue: BigInt(18_000_000),
      monthlyProfit: BigInt(6_000_000),
      operatingYears: 4,
      address: "서초대로 256",
      city: "서울특별시",
      district: "서초구",
      neighborhood: "서초동",
      areaM2: 49.5,
      areaPyeong: 15.0,
      floor: 2,
      latitude: 37.4937,
      longitude: 127.0145,
      contactPhone: "010-1234-5678",
      safetyGrade: "A" as const,
      safetyComment: "매출증빙 완료, 세무 자료 확인 완료",
    },
    {
      title: "왕십리 편의점 양도",
      description: "왕십리역 인근 편의점. 대학가+오피스텔 밀집 지역, 야간 매출 안정적. 본사 계약 잔여 3년.",
      businessCategory: "RETAIL" as const,
      storeType: "FRANCHISE" as const,
      businessSubtype: "편의점",
      price: BigInt(30_000_000),
      monthlyRent: BigInt(1_800_000),
      premiumFee: BigInt(40_000_000),
      managementFee: BigInt(80_000),
      monthlyRevenue: BigInt(45_000_000),
      monthlyProfit: BigInt(5_000_000),
      operatingYears: 2,
      address: "왕십리로 50",
      city: "서울특별시",
      district: "성동구",
      neighborhood: "행당동",
      areaM2: 49.5,
      areaPyeong: 15.0,
      floor: 1,
      latitude: 37.5612,
      longitude: 127.0368,
      contactPhone: "010-1234-5678",
      safetyGrade: "C" as const,
      safetyComment: "프랜차이즈 확인됨, 매출증빙 미비",
    },
    {
      title: "마곡 피자 프랜차이즈 양도",
      description: "마곡지구 신도시 피자 프랜차이즈. 배달 80% 비중, 안정적 매출. 브랜드 인지도 높음.",
      businessCategory: "PIZZA" as const,
      storeType: "FRANCHISE" as const,
      businessSubtype: "피자배달",
      price: BigInt(20_000_000),
      monthlyRent: BigInt(1_500_000),
      premiumFee: BigInt(50_000_000),
      managementFee: BigInt(100_000),
      monthlyRevenue: BigInt(30_000_000),
      monthlyProfit: BigInt(7_000_000),
      operatingYears: 1,
      address: "마곡중앙로 55",
      city: "서울특별시",
      district: "강서구",
      neighborhood: "마곡동",
      areaM2: 49.5,
      areaPyeong: 15.0,
      floor: 1,
      latitude: 37.5676,
      longitude: 126.8372,
      contactPhone: "010-1234-5678",
      safetyGrade: "B" as const,
      safetyComment: "매출증빙 일부 제출, 권리금 시세 범위",
    },
    {
      title: "노원 PC방 양도",
      description: "노원역 인근 100석 PC방. 최신 RTX 4080 사양, 학생+직장인 수요. 매출 안정적.",
      businessCategory: "ENTERTAINMENT" as const,
      storeType: "GENERAL_STORE" as const,
      businessSubtype: "PC방",
      price: BigInt(50_000_000),
      monthlyRent: BigInt(4_500_000),
      premiumFee: BigInt(180_000_000),
      managementFee: BigInt(300_000),
      monthlyRevenue: BigInt(35_000_000),
      monthlyProfit: BigInt(9_000_000),
      operatingYears: 3,
      address: "동일로 1379",
      city: "서울특별시",
      district: "노원구",
      neighborhood: "상계동",
      areaM2: 165.0,
      areaPyeong: 50.0,
      floor: 2,
      latitude: 37.6543,
      longitude: 127.0614,
      contactPhone: "010-1234-5678",
      safetyGrade: "C" as const,
      safetyComment: "매출증빙 미비, 권리금 적정성 미확인",
    },
    {
      title: "신촌 맘스터치 양도",
      description: "신촌역 도보 3분 맘스터치 매장. 대학가 핵심 상권, 점심 매출 높음. 본사 계약 잔여 4년.",
      businessCategory: "CHICKEN" as const,
      storeType: "FRANCHISE" as const,
      businessSubtype: "맘스터치",
      price: BigInt(25_000_000),
      monthlyRent: BigInt(2_200_000),
      premiumFee: BigInt(70_000_000),
      managementFee: BigInt(120_000),
      monthlyRevenue: BigInt(38_000_000),
      monthlyProfit: BigInt(9_000_000),
      operatingYears: 3,
      address: "신촌로 104",
      city: "서울특별시",
      district: "서대문구",
      neighborhood: "신촌동",
      areaM2: 66.0,
      areaPyeong: 20.0,
      floor: 1,
      latitude: 37.5560,
      longitude: 126.9369,
      contactPhone: "010-1234-5678",
      safetyGrade: "A" as const,
      safetyComment: "프랜차이즈 본사 인증, 매출증빙 완료",
    },
    {
      title: "역삼 이디야커피 양도",
      description: "역삼역 오피스 밀집 지역 이디야커피. 오전 테이크아웃 매출 높음. 본사 계약 잔여 5년.",
      businessCategory: "CAFE_BAKERY" as const,
      storeType: "FRANCHISE" as const,
      businessSubtype: "이디야커피",
      price: BigInt(30_000_000),
      monthlyRent: BigInt(2_000_000),
      premiumFee: BigInt(55_000_000),
      managementFee: BigInt(100_000),
      monthlyRevenue: BigInt(22_000_000),
      monthlyProfit: BigInt(6_500_000),
      operatingYears: 2,
      address: "역삼로 180",
      city: "서울특별시",
      district: "강남구",
      neighborhood: "역삼동",
      areaM2: 49.5,
      areaPyeong: 15.0,
      floor: 1,
      latitude: 37.5007,
      longitude: 127.0365,
      contactPhone: "010-1234-5678",
      safetyGrade: "B" as const,
      safetyComment: "프랜차이즈 확인됨, 매출증빙 일부",
    },
    {
      title: "목동 크린토피아 양도",
      description: "목동 아파트 단지 내 크린토피아 세탁소. 무인 운영 가능, 안정적 고정 매출. 본사 지원 우수.",
      businessCategory: "SERVICE" as const,
      storeType: "FRANCHISE" as const,
      businessSubtype: "크린토피아",
      price: BigInt(15_000_000),
      monthlyRent: BigInt(1_200_000),
      premiumFee: BigInt(35_000_000),
      managementFee: BigInt(80_000),
      monthlyRevenue: BigInt(12_000_000),
      monthlyProfit: BigInt(4_500_000),
      operatingYears: 3,
      address: "목동중앙로 88",
      city: "서울특별시",
      district: "양천구",
      neighborhood: "목동",
      areaM2: 33.0,
      areaPyeong: 10.0,
      floor: 1,
      latitude: 37.5270,
      longitude: 126.8695,
      contactPhone: "010-1234-5678",
      safetyGrade: "A" as const,
      safetyComment: "매출증빙 완료, 무인 운영 검증 완료",
    },
    {
      title: "건대 빽다방 양도",
      description: "건대입구역 도보 2분 빽다방. 저가 커피 수요 탄탄, 배달 매출 비중 30%. 본사 계약 잔여 3년.",
      businessCategory: "CAFE_BAKERY" as const,
      storeType: "FRANCHISE" as const,
      businessSubtype: "빽다방",
      price: BigInt(20_000_000),
      monthlyRent: BigInt(1_800_000),
      premiumFee: BigInt(45_000_000),
      managementFee: BigInt(90_000),
      monthlyRevenue: BigInt(20_000_000),
      monthlyProfit: BigInt(5_500_000),
      operatingYears: 2,
      address: "동일로22길 15",
      city: "서울특별시",
      district: "광진구",
      neighborhood: "화양동",
      areaM2: 33.0,
      areaPyeong: 10.0,
      floor: 1,
      latitude: 37.5404,
      longitude: 127.0690,
      contactPhone: "010-1234-5678",
      safetyGrade: "B" as const,
      safetyComment: "프랜차이즈 확인됨, 매출증빙 일부",
    },
  ];

  const createdListings = [];
  for (const listing of sampleListings) {
    const created = await prisma.listing.upsert({
      where: {
        id: `seed-${listing.district}-${listing.businessCategory}`.toLowerCase(),
      },
      update: {},
      create: {
        id: `seed-${listing.district}-${listing.businessCategory}`.toLowerCase(),
        sellerId: seller.id,
        ...listing,
        status: "ACTIVE",
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    createdListings.push(created);
  }

  // ──────────────────────────────────────────────
  // 4-extra. 추가 매물 34개 (프리미엄 16 + 추천 18)
  // ──────────────────────────────────────────────
  const extraListings: {
    id: string; sellerId: string; title: string; description: string;
    businessCategory: string; storeType: string; businessSubtype?: string;
    price: bigint; monthlyRent: bigint; premiumFee: bigint; managementFee: bigint;
    monthlyRevenue: bigint; monthlyProfit: bigint; operatingYears: number;
    address: string; city: string; district: string; neighborhood: string;
    areaM2: number; areaPyeong: number; floor: number;
    latitude: number; longitude: number; contactPhone: string;
    safetyGrade: string; safetyComment: string;
    imageSeed: string;
  }[] = [
    // ─── VIP 추가 16개 (기존 2개 + 16 = 총 20개) ───
    { id: "seed-extra-vip-01", sellerId: seller.id, title: "분당 카페거리 대형 카페", description: "정자역 카페거리 1층 대형카페. 좌석 60석, 테라스 포함. 브런치+디저트 매출 높음.", businessCategory: "CAFE_BAKERY", storeType: "GENERAL_STORE", businessSubtype: "브런치카페", price: BigInt(70_000_000), monthlyRent: BigInt(4_000_000), premiumFee: BigInt(150_000_000), managementFee: BigInt(250_000), monthlyRevenue: BigInt(30_000_000), monthlyProfit: BigInt(10_000_000), operatingYears: 4, address: "정자일로 200", city: "경기도", district: "성남시", neighborhood: "정자동", areaM2: 99.0, areaPyeong: 30.0, floor: 1, latitude: 37.3595, longitude: 127.1086, contactPhone: "010-2222-3333", safetyGrade: "A", safetyComment: "매출증빙 완료, 프리미엄 입지", imageSeed: "brunch-cafe-1" },
    { id: "seed-extra-vip-02", sellerId: seller2.id, title: "수원역 치킨 프랜차이즈", description: "수원역 도보 3분 BBQ 매장. 배달+홀 매출 안정. 본사 계약 잔여 4년.", businessCategory: "CHICKEN", storeType: "FRANCHISE", businessSubtype: "BBQ", price: BigInt(35_000_000), monthlyRent: BigInt(2_800_000), premiumFee: BigInt(90_000_000), managementFee: BigInt(150_000), monthlyRevenue: BigInt(40_000_000), monthlyProfit: BigInt(11_000_000), operatingYears: 3, address: "매산로 123", city: "경기도", district: "수원시", neighborhood: "매산동", areaM2: 82.5, areaPyeong: 25.0, floor: 1, latitude: 37.2636, longitude: 127.0286, contactPhone: "010-2222-3333", safetyGrade: "A", safetyComment: "프랜차이즈 인증, 매출증빙 완료", imageSeed: "bbq-chicken-1" },
    { id: "seed-extra-vip-03", sellerId: seller3.id, title: "해운대 오션뷰 술집", description: "해운대 해변 앞 2층 오션뷰 이자카야. 관광객+지역 주민 고정 매출.", businessCategory: "BAR_PUB", storeType: "GENERAL_STORE", businessSubtype: "이자카야", price: BigInt(60_000_000), monthlyRent: BigInt(5_000_000), premiumFee: BigInt(200_000_000), managementFee: BigInt(300_000), monthlyRevenue: BigInt(45_000_000), monthlyProfit: BigInt(13_000_000), operatingYears: 5, address: "해운대해변로 264", city: "부산광역시", district: "해운대구", neighborhood: "우동", areaM2: 99.0, areaPyeong: 30.0, floor: 2, latitude: 35.1587, longitude: 129.1604, contactPhone: "010-3333-4444", safetyGrade: "A", safetyComment: "매출증빙 완료, 해운대 핵심 입지", imageSeed: "ocean-view-bar-1" },
    { id: "seed-extra-vip-04", sellerId: seller.id, title: "강동구 피자 배달전문점", description: "명일역 인근 도미노피자 배달전문. 배달 90% 비중, 안정 매출.", businessCategory: "PIZZA", storeType: "FRANCHISE", businessSubtype: "도미노피자", price: BigInt(25_000_000), monthlyRent: BigInt(1_800_000), premiumFee: BigInt(60_000_000), managementFee: BigInt(100_000), monthlyRevenue: BigInt(32_000_000), monthlyProfit: BigInt(8_000_000), operatingYears: 2, address: "명일로 300", city: "서울특별시", district: "강동구", neighborhood: "명일동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.5554, longitude: 127.1453, contactPhone: "010-1234-5678", safetyGrade: "B", safetyComment: "프랜차이즈 확인, 매출증빙 일부", imageSeed: "pizza-delivery-shop-1" },
    { id: "seed-extra-vip-05", sellerId: seller2.id, title: "대전 둔산동 미용실", description: "둔산동 핵심상권 대형 미용실. 고정 고객 500명+, 디자이너 5명 운영.", businessCategory: "SERVICE", storeType: "GENERAL_STORE", businessSubtype: "미용실", price: BigInt(30_000_000), monthlyRent: BigInt(2_500_000), premiumFee: BigInt(80_000_000), managementFee: BigInt(150_000), monthlyRevenue: BigInt(25_000_000), monthlyProfit: BigInt(9_000_000), operatingYears: 6, address: "둔산중로 50", city: "대전광역시", district: "서구", neighborhood: "둔산동", areaM2: 82.5, areaPyeong: 25.0, floor: 2, latitude: 36.3515, longitude: 127.3786, contactPhone: "010-2222-3333", safetyGrade: "A", safetyComment: "매출증빙 완료, 안정 고객 확보", imageSeed: "hair-salon-premium-1" },
    { id: "seed-extra-vip-06", sellerId: seller3.id, title: "일산 헬스장 양도", description: "일산 라페스타 인근 대형 헬스장. 200평 규모, PT실+GX룸 완비. 회원 800명.", businessCategory: "ENTERTAINMENT", storeType: "GENERAL_STORE", businessSubtype: "헬스장", price: BigInt(100_000_000), monthlyRent: BigInt(7_000_000), premiumFee: BigInt(250_000_000), managementFee: BigInt(500_000), monthlyRevenue: BigInt(55_000_000), monthlyProfit: BigInt(15_000_000), operatingYears: 4, address: "중앙로 1256", city: "경기도", district: "고양시", neighborhood: "일산동", areaM2: 660.0, areaPyeong: 200.0, floor: 2, latitude: 37.6584, longitude: 126.7714, contactPhone: "010-3333-4444", safetyGrade: "A", safetyComment: "매출증빙 완료, 대형 시설", imageSeed: "gym-interior-1" },
    { id: "seed-extra-vip-07", sellerId: seller.id, title: "종로 한옥카페", description: "종로 익선동 한옥 카페. SNS 맛집, 외국인 관광객 방문 다수. 분위기 최상.", businessCategory: "CAFE_BAKERY", storeType: "GENERAL_STORE", businessSubtype: "한옥카페", price: BigInt(40_000_000), monthlyRent: BigInt(3_000_000), premiumFee: BigInt(100_000_000), managementFee: BigInt(200_000), monthlyRevenue: BigInt(22_000_000), monthlyProfit: BigInt(7_000_000), operatingYears: 3, address: "돈화문로11나길 28", city: "서울특별시", district: "종로구", neighborhood: "익선동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.5740, longitude: 126.9908, contactPhone: "010-1234-5678", safetyGrade: "A", safetyComment: "매출증빙 완료, 관광 특수 입지", imageSeed: "hanok-cafe-1" },
    { id: "seed-extra-vip-08", sellerId: seller2.id, title: "영등포 편의점 양도", description: "영등포역 바로 앞 CU 편의점. 유동인구 최상, 24시간 안정 매출.", businessCategory: "RETAIL", storeType: "FRANCHISE", businessSubtype: "CU편의점", price: BigInt(40_000_000), monthlyRent: BigInt(3_000_000), premiumFee: BigInt(70_000_000), managementFee: BigInt(100_000), monthlyRevenue: BigInt(55_000_000), monthlyProfit: BigInt(7_000_000), operatingYears: 3, address: "영등포로 180", city: "서울특별시", district: "영등포구", neighborhood: "영등포동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.5159, longitude: 126.9074, contactPhone: "010-2222-3333", safetyGrade: "B", safetyComment: "프랜차이즈 확인, 매출증빙 일부", imageSeed: "convenience-store-premium-1" },
    { id: "seed-extra-vip-09", sellerId: seller3.id, title: "대구 동성로 네일샵", description: "동성로 중심 네일샵. 예약 풀 관리, 고정 고객 200명+. 인테리어 최신.", businessCategory: "SERVICE", storeType: "GENERAL_STORE", businessSubtype: "네일아트", price: BigInt(15_000_000), monthlyRent: BigInt(1_500_000), premiumFee: BigInt(40_000_000), managementFee: BigInt(80_000), monthlyRevenue: BigInt(12_000_000), monthlyProfit: BigInt(5_000_000), operatingYears: 2, address: "동성로2길 55", city: "대구광역시", district: "중구", neighborhood: "동성로", areaM2: 33.0, areaPyeong: 10.0, floor: 2, latitude: 35.8695, longitude: 128.5963, contactPhone: "010-3333-4444", safetyGrade: "B", safetyComment: "매출증빙 일부, 상권 양호", imageSeed: "nail-shop-1" },
    { id: "seed-extra-vip-10", sellerId: seller.id, title: "관악구 분식집 급매", description: "서울대입구역 도보 2분 분식집. 학생 수요 탄탄, 떡볶이+김밥 배달 매출 높음.", businessCategory: "BUNSIK", storeType: "GENERAL_STORE", businessSubtype: "분식전문", price: BigInt(15_000_000), monthlyRent: BigInt(1_200_000), premiumFee: BigInt(30_000_000), managementFee: BigInt(80_000), monthlyRevenue: BigInt(18_000_000), monthlyProfit: BigInt(6_000_000), operatingYears: 5, address: "관악로 188", city: "서울특별시", district: "관악구", neighborhood: "봉천동", areaM2: 33.0, areaPyeong: 10.0, floor: 1, latitude: 37.4813, longitude: 126.9527, contactPhone: "010-1234-5678", safetyGrade: "A", safetyComment: "매출증빙 완료, 대학가 안정 상권", imageSeed: "bunsik-shop-1" },
    { id: "seed-extra-vip-11", sellerId: seller2.id, title: "을지로 일식당", description: "을지로3가역 인근 정통 일식당. 런치 오마카세 인기, 직장인 예약 풀.", businessCategory: "JAPANESE_FOOD", storeType: "GENERAL_STORE", businessSubtype: "오마카세", price: BigInt(80_000_000), monthlyRent: BigInt(5_500_000), premiumFee: BigInt(180_000_000), managementFee: BigInt(300_000), monthlyRevenue: BigInt(45_000_000), monthlyProfit: BigInt(12_000_000), operatingYears: 3, address: "을지로 100", city: "서울특별시", district: "중구", neighborhood: "을지로3가", areaM2: 66.0, areaPyeong: 20.0, floor: 1, latitude: 37.5660, longitude: 126.9920, contactPhone: "010-2222-3333", safetyGrade: "A", safetyComment: "매출증빙 완료, 높은 객단가", imageSeed: "japanese-restaurant-1" },
    { id: "seed-extra-vip-12", sellerId: seller3.id, title: "부산 서면 꽃집", description: "서면역 인근 플라워샵. 꽃다발+화분+구독 서비스 운영. 인스타 팔로워 2만.", businessCategory: "RETAIL", storeType: "GENERAL_STORE", businessSubtype: "꽃집", price: BigInt(10_000_000), monthlyRent: BigInt(1_200_000), premiumFee: BigInt(25_000_000), managementFee: BigInt(80_000), monthlyRevenue: BigInt(10_000_000), monthlyProfit: BigInt(4_000_000), operatingYears: 2, address: "서면로 68", city: "부산광역시", district: "부산진구", neighborhood: "부전동", areaM2: 33.0, areaPyeong: 10.0, floor: 1, latitude: 35.1570, longitude: 129.0596, contactPhone: "010-3333-4444", safetyGrade: "B", safetyComment: "매출증빙 일부, SNS 마케팅 활발", imageSeed: "flower-shop-1" },
    { id: "seed-extra-vip-13", sellerId: seller.id, title: "강북구 배달 중식당", description: "수유역 인근 배달 전문 중식당. 짜장면+짬뽕 배달 90% 비중.", businessCategory: "CHINESE_FOOD", storeType: "GENERAL_STORE", businessSubtype: "중화요리", price: BigInt(20_000_000), monthlyRent: BigInt(1_500_000), premiumFee: BigInt(50_000_000), managementFee: BigInt(100_000), monthlyRevenue: BigInt(28_000_000), monthlyProfit: BigInt(8_000_000), operatingYears: 4, address: "도봉로 310", city: "서울특별시", district: "강북구", neighborhood: "수유동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.6388, longitude: 127.0256, contactPhone: "010-1234-5678", safetyGrade: "B", safetyComment: "매출증빙 일부, 배달앱 평점 4.8", imageSeed: "chinese-restaurant-1" },
    { id: "seed-extra-vip-14", sellerId: seller2.id, title: "동작구 학원 양도", description: "사당역 도보 3분 영어학원. 초등~중등 학생 80명. 강사 4명 운영중.", businessCategory: "EDUCATION", storeType: "GENERAL_STORE", businessSubtype: "영어학원", price: BigInt(30_000_000), monthlyRent: BigInt(2_200_000), premiumFee: BigInt(60_000_000), managementFee: BigInt(150_000), monthlyRevenue: BigInt(20_000_000), monthlyProfit: BigInt(7_000_000), operatingYears: 5, address: "사당로 170", city: "서울특별시", district: "동작구", neighborhood: "사당동", areaM2: 99.0, areaPyeong: 30.0, floor: 3, latitude: 37.4765, longitude: 126.9816, contactPhone: "010-2222-3333", safetyGrade: "A", safetyComment: "매출증빙 완료, 학원 인허가 확인", imageSeed: "academy-interior-1" },
    { id: "seed-extra-vip-15", sellerId: seller3.id, title: "수원 양식 레스토랑", description: "광교 카페거리 양식 레스토랑. 파스타+스테이크 전문, 주말 예약 풀.", businessCategory: "WESTERN_FOOD", storeType: "GENERAL_STORE", businessSubtype: "이탈리안", price: BigInt(50_000_000), monthlyRent: BigInt(3_500_000), premiumFee: BigInt(120_000_000), managementFee: BigInt(200_000), monthlyRevenue: BigInt(32_000_000), monthlyProfit: BigInt(9_000_000), operatingYears: 3, address: "광교중앙로 145", city: "경기도", district: "수원시", neighborhood: "광교동", areaM2: 82.5, areaPyeong: 25.0, floor: 1, latitude: 37.2850, longitude: 127.0475, contactPhone: "010-3333-4444", safetyGrade: "A", safetyComment: "매출증빙 완료, 신도시 핵심 상권", imageSeed: "italian-restaurant-1" },
    { id: "seed-extra-vip-16", sellerId: seller.id, title: "은평구 세탁소", description: "연신내역 인근 대형 세탁소. 아파트 밀집 지역, 고정 고객 다수. 무인+유인 병행.", businessCategory: "SERVICE", storeType: "GENERAL_STORE", businessSubtype: "세탁소", price: BigInt(15_000_000), monthlyRent: BigInt(1_000_000), premiumFee: BigInt(30_000_000), managementFee: BigInt(80_000), monthlyRevenue: BigInt(10_000_000), monthlyProfit: BigInt(4_500_000), operatingYears: 7, address: "통일로 855", city: "서울특별시", district: "은평구", neighborhood: "대조동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.6195, longitude: 126.9215, contactPhone: "010-1234-5678", safetyGrade: "A", safetyComment: "매출증빙 완료, 안정적 고정 수입", imageSeed: "laundry-premium-1" },

    // ─── 추천(PREMIUM) 추가 18개 (기존 6개 + 18 = 총 24개) ───
    { id: "seed-extra-rec-01", sellerId: seller2.id, title: "구로디지털단지 도시락 전문점", description: "구로디지털단지역 도시락 배달 전문. 직장인 점심 수요 탄탄.", businessCategory: "KOREAN_FOOD", storeType: "GENERAL_STORE", businessSubtype: "도시락전문", price: BigInt(15_000_000), monthlyRent: BigInt(1_500_000), premiumFee: BigInt(35_000_000), managementFee: BigInt(80_000), monthlyRevenue: BigInt(22_000_000), monthlyProfit: BigInt(6_000_000), operatingYears: 2, address: "디지털로 288", city: "서울특별시", district: "구로구", neighborhood: "구로동", areaM2: 33.0, areaPyeong: 10.0, floor: 1, latitude: 37.4848, longitude: 126.9015, contactPhone: "010-2222-3333", safetyGrade: "B", safetyComment: "매출증빙 일부, 안정적 수요", imageSeed: "lunchbox-shop-1" },
    { id: "seed-extra-rec-02", sellerId: seller3.id, title: "성남 분당 약국", description: "서현역 인근 약국. 주변 병원 3개 밀집, 처방전 매출 안정.", businessCategory: "RETAIL", storeType: "GENERAL_STORE", businessSubtype: "약국", price: BigInt(50_000_000), monthlyRent: BigInt(3_000_000), premiumFee: BigInt(100_000_000), managementFee: BigInt(150_000), monthlyRevenue: BigInt(40_000_000), monthlyProfit: BigInt(12_000_000), operatingYears: 8, address: "분당내곡로 117", city: "경기도", district: "성남시", neighborhood: "서현동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.3840, longitude: 127.1230, contactPhone: "010-3333-4444", safetyGrade: "A", safetyComment: "매출증빙 완료, 병원 밀집 상권", imageSeed: "pharmacy-1" },
    { id: "seed-extra-rec-03", sellerId: seller.id, title: "합정 베이커리 양도", description: "합정역 도보 2분 수제 베이커리. 빵+케이크 인기, SNS 맛집.", businessCategory: "CAFE_BAKERY", storeType: "GENERAL_STORE", businessSubtype: "베이커리", price: BigInt(30_000_000), monthlyRent: BigInt(2_500_000), premiumFee: BigInt(70_000_000), managementFee: BigInt(150_000), monthlyRevenue: BigInt(20_000_000), monthlyProfit: BigInt(6_500_000), operatingYears: 3, address: "양화로 45", city: "서울특별시", district: "마포구", neighborhood: "합정동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.5505, longitude: 126.9139, contactPhone: "010-1234-5678", safetyGrade: "B", safetyComment: "매출증빙 일부, 인기 맛집", imageSeed: "bakery-shop-1" },
    { id: "seed-extra-rec-04", sellerId: seller2.id, title: "논현동 스터디카페", description: "논현역 인근 100석 스터디카페. 무인 운영, 24시간 영업. 직장인+학생 수요.", businessCategory: "ENTERTAINMENT", storeType: "GENERAL_STORE", businessSubtype: "스터디카페", price: BigInt(40_000_000), monthlyRent: BigInt(3_500_000), premiumFee: BigInt(80_000_000), managementFee: BigInt(200_000), monthlyRevenue: BigInt(18_000_000), monthlyProfit: BigInt(5_000_000), operatingYears: 2, address: "논현로 525", city: "서울특별시", district: "강남구", neighborhood: "논현동", areaM2: 132.0, areaPyeong: 40.0, floor: 3, latitude: 37.5109, longitude: 127.0299, contactPhone: "010-2222-3333", safetyGrade: "B", safetyComment: "무인 시스템, 매출증빙 일부", imageSeed: "study-cafe-1" },
    { id: "seed-extra-rec-05", sellerId: seller3.id, title: "부산 남포동 떡볶이집", description: "남포동 BIFF광장 인근 분식집. 관광객+지역 주민 핵심 상권.", businessCategory: "BUNSIK", storeType: "GENERAL_STORE", businessSubtype: "떡볶이전문", price: BigInt(10_000_000), monthlyRent: BigInt(1_200_000), premiumFee: BigInt(25_000_000), managementFee: BigInt(80_000), monthlyRevenue: BigInt(15_000_000), monthlyProfit: BigInt(5_000_000), operatingYears: 6, address: "광복로 40", city: "부산광역시", district: "중구", neighborhood: "남포동", areaM2: 33.0, areaPyeong: 10.0, floor: 1, latitude: 35.0977, longitude: 129.0327, contactPhone: "010-3333-4444", safetyGrade: "A", safetyComment: "매출증빙 완료, 관광 특수", imageSeed: "tteokbokki-shop-1" },
    { id: "seed-extra-rec-06", sellerId: seller.id, title: "도봉구 태권도 학원", description: "방학역 인근 태권도장. 아파트 단지 밀집, 원생 120명. 강사 3명.", businessCategory: "EDUCATION", storeType: "GENERAL_STORE", businessSubtype: "태권도장", price: BigInt(20_000_000), monthlyRent: BigInt(1_800_000), premiumFee: BigInt(45_000_000), managementFee: BigInt(100_000), monthlyRevenue: BigInt(15_000_000), monthlyProfit: BigInt(5_500_000), operatingYears: 8, address: "방학로 77", city: "서울특별시", district: "도봉구", neighborhood: "방학동", areaM2: 132.0, areaPyeong: 40.0, floor: 2, latitude: 37.6689, longitude: 127.0445, contactPhone: "010-1234-5678", safetyGrade: "A", safetyComment: "매출증빙 완료, 안정적 원생 수", imageSeed: "taekwondo-gym-1" },
    { id: "seed-extra-rec-07", sellerId: seller2.id, title: "대전 유성구 PC방", description: "충남대 앞 120석 PC방. RTX4090 풀옵, 학생 수요 높음.", businessCategory: "ENTERTAINMENT", storeType: "GENERAL_STORE", businessSubtype: "PC방", price: BigInt(60_000_000), monthlyRent: BigInt(4_000_000), premiumFee: BigInt(150_000_000), managementFee: BigInt(300_000), monthlyRevenue: BigInt(30_000_000), monthlyProfit: BigInt(8_000_000), operatingYears: 2, address: "대학로 99", city: "대전광역시", district: "유성구", neighborhood: "궁동", areaM2: 198.0, areaPyeong: 60.0, floor: 2, latitude: 36.3620, longitude: 127.3449, contactPhone: "010-2222-3333", safetyGrade: "C", safetyComment: "매출증빙 미비, 대학가 상권", imageSeed: "pc-bang-premium-1" },
    { id: "seed-extra-rec-08", sellerId: seller3.id, title: "고양 일산 꽃집", description: "일산 호수공원 앞 플라워카페. 꽃+음료 복합 매장, MZ세대 인기.", businessCategory: "RETAIL", storeType: "GENERAL_STORE", businessSubtype: "플라워카페", price: BigInt(20_000_000), monthlyRent: BigInt(2_000_000), premiumFee: BigInt(50_000_000), managementFee: BigInt(100_000), monthlyRevenue: BigInt(15_000_000), monthlyProfit: BigInt(5_000_000), operatingYears: 2, address: "호수로 560", city: "경기도", district: "고양시", neighborhood: "일산동구", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.6633, longitude: 126.7727, contactPhone: "010-3333-4444", safetyGrade: "B", safetyComment: "매출증빙 일부, SNS 마케팅 활발", imageSeed: "flower-cafe-1" },
    { id: "seed-extra-rec-09", sellerId: seller.id, title: "금천구 중국집 양도", description: "가산디지털단지역 인근 중국집. 직장인 점심+배달 매출 높음.", businessCategory: "CHINESE_FOOD", storeType: "GENERAL_STORE", businessSubtype: "중화요리", price: BigInt(20_000_000), monthlyRent: BigInt(1_800_000), premiumFee: BigInt(45_000_000), managementFee: BigInt(100_000), monthlyRevenue: BigInt(25_000_000), monthlyProfit: BigInt(7_000_000), operatingYears: 4, address: "가산디지털1로 70", city: "서울특별시", district: "금천구", neighborhood: "가산동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.4812, longitude: 126.8827, contactPhone: "010-1234-5678", safetyGrade: "B", safetyComment: "매출증빙 일부, IT단지 수요", imageSeed: "chinese-food-shop-1" },
    { id: "seed-extra-rec-10", sellerId: seller2.id, title: "송파구 필라테스 스튜디오", description: "석촌역 인근 필라테스 스튜디오. 기구 20대, 회원 150명. 1:1 PT 위주.", businessCategory: "ENTERTAINMENT", storeType: "GENERAL_STORE", businessSubtype: "필라테스", price: BigInt(25_000_000), monthlyRent: BigInt(2_500_000), premiumFee: BigInt(55_000_000), managementFee: BigInt(150_000), monthlyRevenue: BigInt(18_000_000), monthlyProfit: BigInt(6_000_000), operatingYears: 3, address: "석촌호수로 200", city: "서울특별시", district: "송파구", neighborhood: "석촌동", areaM2: 82.5, areaPyeong: 25.0, floor: 3, latitude: 37.5068, longitude: 127.1057, contactPhone: "010-2222-3333", safetyGrade: "A", safetyComment: "매출증빙 완료, 프리미엄 시설", imageSeed: "pilates-studio-1" },
    { id: "seed-extra-rec-11", sellerId: seller3.id, title: "대구 수성구 삼겹살집", description: "수성못 인근 숯불 삼겹살 전문점. 단체 예약 많음, 주말 만석.", businessCategory: "KOREAN_FOOD", storeType: "GENERAL_STORE", businessSubtype: "삼겹살전문", price: BigInt(35_000_000), monthlyRent: BigInt(2_500_000), premiumFee: BigInt(70_000_000), managementFee: BigInt(150_000), monthlyRevenue: BigInt(30_000_000), monthlyProfit: BigInt(9_000_000), operatingYears: 5, address: "달구벌대로 2500", city: "대구광역시", district: "수성구", neighborhood: "범어동", areaM2: 99.0, areaPyeong: 30.0, floor: 1, latitude: 35.8580, longitude: 128.6255, contactPhone: "010-3333-4444", safetyGrade: "A", safetyComment: "매출증빙 완료, 안정 매출", imageSeed: "samgyeopsal-1" },
    { id: "seed-extra-rec-12", sellerId: seller.id, title: "성북구 빈티지 카페", description: "성신여대입구역 빈티지 인테리어 카페. 디저트 인기, 대학생 단골 많음.", businessCategory: "CAFE_BAKERY", storeType: "GENERAL_STORE", businessSubtype: "디저트카페", price: BigInt(20_000_000), monthlyRent: BigInt(1_500_000), premiumFee: BigInt(40_000_000), managementFee: BigInt(100_000), monthlyRevenue: BigInt(14_000_000), monthlyProfit: BigInt(4_500_000), operatingYears: 2, address: "보문로 132", city: "서울특별시", district: "성북구", neighborhood: "동선동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.5926, longitude: 127.0179, contactPhone: "010-1234-5678", safetyGrade: "C", safetyComment: "매출증빙 미비, 대학가 상권", imageSeed: "vintage-cafe-1" },
    { id: "seed-extra-rec-13", sellerId: seller2.id, title: "구리시 배달 치킨집", description: "구리시 인창동 교촌치킨. 배달 80%, 아파트 단지 밀집 지역.", businessCategory: "CHICKEN", storeType: "FRANCHISE", businessSubtype: "교촌치킨", price: BigInt(20_000_000), monthlyRent: BigInt(1_500_000), premiumFee: BigInt(50_000_000), managementFee: BigInt(100_000), monthlyRevenue: BigInt(28_000_000), monthlyProfit: BigInt(7_000_000), operatingYears: 3, address: "건원대로 170", city: "경기도", district: "구리시", neighborhood: "인창동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.5920, longitude: 127.1296, contactPhone: "010-2222-3333", safetyGrade: "B", safetyComment: "프랜차이즈 인증, 매출증빙 일부", imageSeed: "kyochon-chicken-1" },
    { id: "seed-extra-rec-14", sellerId: seller3.id, title: "동대문구 세탁소", description: "회기역 인근 크린토피아 세탁소. 대학가+원룸 밀집, 무인 24시간.", businessCategory: "SERVICE", storeType: "FRANCHISE", businessSubtype: "크린토피아", price: BigInt(12_000_000), monthlyRent: BigInt(900_000), premiumFee: BigInt(25_000_000), managementFee: BigInt(60_000), monthlyRevenue: BigInt(8_000_000), monthlyProfit: BigInt(3_500_000), operatingYears: 2, address: "회기로 90", city: "서울특별시", district: "동대문구", neighborhood: "회기동", areaM2: 33.0, areaPyeong: 10.0, floor: 1, latitude: 37.5894, longitude: 127.0583, contactPhone: "010-3333-4444", safetyGrade: "A", safetyComment: "무인 운영, 매출증빙 완료", imageSeed: "laundry-shop-premium-1" },
    { id: "seed-extra-rec-15", sellerId: seller.id, title: "중랑구 숯불갈비", description: "망우역 인근 숯불갈비 전문점. 가족 단위 손님 다수, 주말 만석.", businessCategory: "KOREAN_FOOD", storeType: "GENERAL_STORE", businessSubtype: "갈비전문", price: BigInt(40_000_000), monthlyRent: BigInt(2_800_000), premiumFee: BigInt(80_000_000), managementFee: BigInt(200_000), monthlyRevenue: BigInt(28_000_000), monthlyProfit: BigInt(8_000_000), operatingYears: 6, address: "망우로 390", city: "서울특별시", district: "중랑구", neighborhood: "망우동", areaM2: 99.0, areaPyeong: 30.0, floor: 1, latitude: 37.5978, longitude: 127.0929, contactPhone: "010-1234-5678", safetyGrade: "A", safetyComment: "매출증빙 완료, 안정 가족 상권", imageSeed: "galbi-restaurant-1" },
    { id: "seed-extra-rec-16", sellerId: seller2.id, title: "강서구 GS25 편의점", description: "화곡역 인근 GS25. 역세권+아파트 단지, 매출 안정적.", businessCategory: "RETAIL", storeType: "FRANCHISE", businessSubtype: "GS25", price: BigInt(35_000_000), monthlyRent: BigInt(2_000_000), premiumFee: BigInt(55_000_000), managementFee: BigInt(80_000), monthlyRevenue: BigInt(48_000_000), monthlyProfit: BigInt(5_500_000), operatingYears: 4, address: "화곡로 268", city: "서울특별시", district: "강서구", neighborhood: "화곡동", areaM2: 49.5, areaPyeong: 15.0, floor: 1, latitude: 37.5414, longitude: 126.8396, contactPhone: "010-2222-3333", safetyGrade: "B", safetyComment: "프랜차이즈 확인, 매출증빙 일부", imageSeed: "gs25-store-1" },
    { id: "seed-extra-rec-17", sellerId: seller3.id, title: "부산 해운대 네일샵", description: "해운대역 인근 프리미엄 네일샵. 관광객+지역민 수요 높음.", businessCategory: "SERVICE", storeType: "GENERAL_STORE", businessSubtype: "네일아트", price: BigInt(12_000_000), monthlyRent: BigInt(1_300_000), premiumFee: BigInt(30_000_000), managementFee: BigInt(80_000), monthlyRevenue: BigInt(10_000_000), monthlyProfit: BigInt(4_000_000), operatingYears: 2, address: "해운대로 570", city: "부산광역시", district: "해운대구", neighborhood: "해운대동", areaM2: 33.0, areaPyeong: 10.0, floor: 2, latitude: 35.1631, longitude: 129.1639, contactPhone: "010-3333-4444", safetyGrade: "B", safetyComment: "매출증빙 일부, 관광 상권", imageSeed: "nail-salon-busan-1" },
    { id: "seed-extra-rec-18", sellerId: seller.id, title: "양천구 코인노래방", description: "목동역 인근 코인노래방. 30룸, 무인 운영. 주말 매출 높음.", businessCategory: "ENTERTAINMENT", storeType: "GENERAL_STORE", businessSubtype: "코인노래방", price: BigInt(30_000_000), monthlyRent: BigInt(2_500_000), premiumFee: BigInt(60_000_000), managementFee: BigInt(150_000), monthlyRevenue: BigInt(16_000_000), monthlyProfit: BigInt(5_500_000), operatingYears: 3, address: "목동서로 120", city: "서울특별시", district: "양천구", neighborhood: "목동", areaM2: 82.5, areaPyeong: 25.0, floor: 2, latitude: 37.5243, longitude: 126.8746, contactPhone: "010-1234-5678", safetyGrade: "B", safetyComment: "무인 운영, 매출증빙 일부", imageSeed: "coin-karaoke-1" },
  ];

  const createdExtraListings = [];
  for (const listing of extraListings) {
    const { id, imageSeed, ...data } = listing;
    const created = await prisma.listing.upsert({
      where: { id },
      update: {},
      create: {
        id,
        ...data,
        status: "ACTIVE",
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    createdExtraListings.push(created);

    // 이미지 1장씩 (Unsplash 업종별 이미지)
    const imgUrl = unsplashUrl(listing.businessCategory, 800, 600);
    const thumbUrl = unsplashUrl(listing.businessCategory, 400, 300);
    await prisma.listingImage.upsert({
      where: { id: `${id}-img` },
      update: { url: imgUrl, thumbnailUrl: thumbUrl },
      create: {
        id: `${id}-img`,
        listingId: id,
        url: imgUrl,
        s3Key: `seed/${imageSeed}.jpg`,
        thumbnailUrl: thumbUrl,
        sortOrder: 0,
        isPrimary: true,
        width: 800,
        height: 600,
        sizeBytes: 150000,
        mimeType: "image/jpeg",
      },
    });
  }
  console.log(`  Extra listings: ${createdExtraListings.length} (VIP 16 + 추천 18)`);
  console.log(`  Listings: ${createdListings.length}`);

  // ──────────────────────────────────────────────
  // 4a. Listing Images (매물 사진)
  // ──────────────────────────────────────────────
  const listingImages: { listingIdx: number; images: { seed: string; isPrimary: boolean }[] }[] = [
    { listingIdx: 0, images: [
      { seed: "cafe-interior-1", isPrimary: true },
      { seed: "cafe-counter-1", isPrimary: false },
      { seed: "coffee-latte-1", isPrimary: false },
    ]},
    { listingIdx: 1, images: [
      { seed: "chicken-restaurant-1", isPrimary: true },
      { seed: "fried-chicken-1", isPrimary: false },
      { seed: "beer-pub-1", isPrimary: false },
    ]},
    { listingIdx: 2, images: [
      { seed: "korean-restaurant-1", isPrimary: true },
      { seed: "korean-food-1", isPrimary: false },
      { seed: "restaurant-hall-1", isPrimary: false },
    ]},
    { listingIdx: 3, images: [
      { seed: "cocktail-bar-1", isPrimary: true },
      { seed: "bar-interior-1", isPrimary: false },
      { seed: "bar-night-1", isPrimary: false },
    ]},
    { listingIdx: 4, images: [
      { seed: "hair-salon-1", isPrimary: true },
      { seed: "salon-interior-1", isPrimary: false },
      { seed: "salon-mirror-1", isPrimary: false },
    ]},
    { listingIdx: 5, images: [
      { seed: "convenience-store-1", isPrimary: true },
      { seed: "store-shelves-1", isPrimary: false },
      { seed: "store-front-1", isPrimary: false },
    ]},
    { listingIdx: 6, images: [
      { seed: "pizza-shop-1", isPrimary: true },
      { seed: "pizza-oven-1", isPrimary: false },
      { seed: "pizza-delivery-1", isPrimary: false },
    ]},
    { listingIdx: 7, images: [
      { seed: "pc-gaming-room-1", isPrimary: true },
      { seed: "pc-setup-1", isPrimary: false },
      { seed: "gaming-cafe-1", isPrimary: false },
    ]},
    { listingIdx: 8, images: [
      { seed: "fast-food-1", isPrimary: true },
      { seed: "burger-shop-1", isPrimary: false },
      { seed: "fast-food-counter-1", isPrimary: false },
    ]},
    { listingIdx: 9, images: [
      { seed: "coffee-franchise-1", isPrimary: true },
      { seed: "coffee-takeout-1", isPrimary: false },
      { seed: "cafe-exterior-1", isPrimary: false },
    ]},
    { listingIdx: 10, images: [
      { seed: "laundry-shop-1", isPrimary: true },
      { seed: "washing-machine-1", isPrimary: false },
      { seed: "laundry-interior-1", isPrimary: false },
    ]},
    { listingIdx: 11, images: [
      { seed: "budget-cafe-1", isPrimary: true },
      { seed: "iced-coffee-1", isPrimary: false },
      { seed: "cafe-small-1", isPrimary: false },
    ]},
  ];

  let imageCount = 0;
  for (const entry of listingImages) {
    const listing = createdListings[entry.listingIdx];
    if (!listing) continue;
    const cat = sampleListings[entry.listingIdx]?.businessCategory ?? "KOREAN_FOOD";
    for (let i = 0; i < entry.images.length; i++) {
      const img = entry.images[i];
      const imageId = `seed-img-${entry.listingIdx}-${i}`;
      const imgUrl = unsplashUrl(cat, 800, 600);
      const thumbUrl = unsplashUrl(cat, 400, 300);
      await prisma.listingImage.upsert({
        where: { id: imageId },
        update: { url: imgUrl, thumbnailUrl: thumbUrl },
        create: {
          id: imageId,
          listingId: listing.id,
          url: imgUrl,
          s3Key: `seed/${img.seed}.jpg`,
          thumbnailUrl: thumbUrl,
          sortOrder: i,
          isPrimary: img.isPrimary,
          width: 800,
          height: 600,
          sizeBytes: 150000,
          mimeType: "image/jpeg",
        },
      });
      imageCount++;
    }
  }
  console.log(`  Listing images: ${imageCount}`);

  // Set half of listings to isPhonePublic: false
  for (let i = 0; i < createdListings.length; i++) {
    if (i % 2 === 1) {
      await prisma.listing.update({
        where: { id: createdListings[i].id },
        data: { isPhonePublic: false },
      });
    }
  }
  console.log("  Listings isPhonePublic:false: " + Math.floor(createdListings.length / 2));

  // ──────────────────────────────────────────────
  // 4b. Premium Plans & Premium Listings
  // ──────────────────────────────────────────────
  const premiumPlans = [
    { id: "plan-premium", name: "PREMIUM" as const, displayName: "PREMIUM", price: BigInt(200_000), durationDays: 30, features: ["매물 목록 상단 노출", "PREMIUM 배지 표시", "프리미엄 테두리 하이라이트", "홈페이지 추천 섹션 노출"], sortOrder: 0 },
    { id: "plan-vip", name: "VIP" as const, displayName: "VIP", price: BigInt(300_000), durationDays: 30, features: ["매물 목록 최상단 노출", "VIP 골드 배지", "골드 프리미엄 테두리", "홈페이지 추천 섹션 최우선", "상세페이지 VIP 전용 헤더"], sortOrder: 1 },
  ];

  for (const plan of premiumPlans) {
    await prisma.premiumPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }
  console.log("  Premium plans: 2");

  // Reset all listings to non-premium first (clean slate)
  await prisma.listing.updateMany({
    where: { isPremium: true },
    data: { isPremium: false, premiumRank: 0 },
  });
  await prisma.premiumListing.deleteMany({
    where: { id: { startsWith: "seed-premium-" } },
  });

  // Set premium status on sample listings
  // VIP(rank=3) 프리미엄 매물: 강남역 카페(0), 홍대 치킨(1)
  // PREMIUM(rank=2) 오늘의 추천: 건대 빽다방(11), 목동 크린토피아(10), 노원 PC방(7), 신촌 맘스터치(8), 왕십리 편의점(5), 마곡 피자(6)
  // NOTE: 인덱스 9(역삼 이디야)는 인덱스 0(강남역 카페)과 ID 충돌 (동일 강남구-CAFE_BAKERY)
  const premiumMappings = [
    { listingIdx: 0, planId: "plan-vip", rank: 3 },
    { listingIdx: 1, planId: "plan-vip", rank: 3 },
    { listingIdx: 11, planId: "plan-premium", rank: 2 },
    { listingIdx: 10, planId: "plan-premium", rank: 2 },
    { listingIdx: 7, planId: "plan-premium", rank: 2 },
    { listingIdx: 8, planId: "plan-premium", rank: 2 },
    { listingIdx: 5, planId: "plan-premium", rank: 2 },
    { listingIdx: 6, planId: "plan-premium", rank: 2 },
  ];

  for (const mapping of premiumMappings) {
    const listing = createdListings[mapping.listingIdx];
    if (!listing) continue;

    await prisma.listing.update({
      where: { id: listing.id },
      data: { isPremium: true, premiumRank: mapping.rank },
    });

    await prisma.premiumListing.upsert({
      where: { id: `seed-premium-${mapping.listingIdx}` },
      update: {},
      create: {
        id: `seed-premium-${mapping.listingIdx}`,
        listingId: listing.id,
        planId: mapping.planId,
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentStatus: "PAID",
      },
    });
  }
  console.log(`  Premium listings (original): ${premiumMappings.length} (VIP×2, 추천×6)`);

  // 추가 매물 프리미엄 설정
  const extraVipIds = extraListings.filter((_, i) => i < 16).map(l => l.id);
  const extraRecIds = extraListings.filter((_, i) => i >= 16).map(l => l.id);

  for (const id of extraVipIds) {
    await prisma.listing.update({
      where: { id },
      data: { isPremium: true, premiumRank: 3 },
    });
    await prisma.premiumListing.upsert({
      where: { id: `${id}-premium` },
      update: {},
      create: {
        id: `${id}-premium`,
        listingId: id,
        planId: "plan-vip",
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentStatus: "PAID",
      },
    });
  }

  for (const id of extraRecIds) {
    await prisma.listing.update({
      where: { id },
      data: { isPremium: true, premiumRank: 2 },
    });
    await prisma.premiumListing.upsert({
      where: { id: `${id}-premium` },
      update: {},
      create: {
        id: `${id}-premium`,
        listingId: id,
        planId: "plan-premium",
        status: "ACTIVE",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentStatus: "PAID",
      },
    });
  }
  console.log(`  Premium listings (extra): VIP×${extraVipIds.length}, 추천×${extraRecIds.length}`);

  // ──────────────────────────────────────────────
  // 5. Sample Inquiries (with status)
  // ──────────────────────────────────────────────
  const inquiryData = [
    { idx: 0, message: "안녕하세요, 이 매물에 대해 자세한 정보 부탁드립니다. 실제 매출 자료 확인 가능한가요?", status: "PENDING" as const, senderName: "이창업", senderPhone: "010-9876-5432" },
    { idx: 0, message: "매출 증빙 자료를 확인했습니다. 현장 방문 일정을 잡고 싶습니다.", status: "REPLIED" as const, senderName: "이창업", senderPhone: "010-9876-5432" },
    { idx: 0, message: "임대차 계약 잔여 기간이 얼마나 되나요?", status: "PENDING" as const, senderName: "박매수" },
    { idx: 1, message: "권리금 협상이 가능한지 궁금합니다. 방문 상담 가능한 시간이 있을까요?", status: "PENDING" as const, senderName: "이창업" },
    { idx: 1, message: "가격 조건이 맞지 않아 다른 매물을 알아보겠습니다. 감사합니다.", status: "CANCELLED" as const, senderName: "이창업" },
    { idx: 2, message: "현재 운영 중인 직원 인수도 가능한지 궁금합니다.", status: "PENDING" as const },
    { idx: 3, message: "주변 상권 분석 자료가 있으면 공유 부탁드립니다.", status: "PENDING" as const, senderName: "김투자" },
    { idx: 3, message: "실제 월 순이익이 어느 정도인지 알 수 있을까요?", status: "REPLIED" as const, senderName: "최사장" },
    { idx: 4, message: "인테리어 시설 상태가 궁금합니다. 최근 리모델링 한 적 있나요?", status: "PENDING" as const, senderName: "정매수" },
    { idx: 5, message: "해당 매물 아직 거래 가능한가요? 급하게 찾고 있습니다.", status: "PENDING" as const, senderName: "한창업", senderPhone: "010-5555-1234" },
  ];

  for (let i = 0; i < inquiryData.length; i++) {
    const inq = inquiryData[i];
    if (!createdListings[inq.idx]) continue;
    await prisma.inquiry.upsert({
      where: { id: `seed-inquiry-${i}` },
      update: {},
      create: {
        id: `seed-inquiry-${i}`,
        listingId: createdListings[inq.idx].id,
        senderId: buyer.id,
        receiverId: seller.id,
        message: inq.message,
        status: inq.status,
        senderName: inq.senderName ?? null,
        senderPhone: inq.senderPhone ?? null,
        isRead: inq.status !== "PENDING",
      },
    });
  }

  // Update inquiryCount on listings that received inquiries
  const inquiryCountMap: Record<number, number> = {};
  for (const inq of inquiryData) {
    inquiryCountMap[inq.idx] = (inquiryCountMap[inq.idx] ?? 0) + 1;
  }
  for (const [idxStr, count] of Object.entries(inquiryCountMap)) {
    const idx = Number(idxStr);
    if (createdListings[idx]) {
      await prisma.listing.update({
        where: { id: createdListings[idx].id },
        data: { inquiryCount: count },
      });
    }
  }

  console.log("  Inquiries: 10 (PENDING×7, REPLIED×2, CANCELLED×1)");

  // ──────────────────────────────────────────────
  // 6. Sample Notifications
  // ──────────────────────────────────────────────
  await prisma.notification.upsert({
    where: { id: "seed-notif-1" },
    update: {},
    create: {
      id: "seed-notif-1",
      userId: seller.id,
      sourceType: "INQUIRY",
      title: "새 문의가 도착했습니다",
      message: `"${createdListings[0].title}" 매물에 새로운 문의가 있습니다.`,
      link: `/dashboard/inquiries`,
    },
  });

  await prisma.notification.upsert({
    where: { id: "seed-notif-2" },
    update: {},
    create: {
      id: "seed-notif-2",
      userId: buyer.id,
      sourceType: "SYSTEM",
      title: "권리샵에 오신 것을 환영합니다!",
      message: "프리미엄 구독으로 더 많은 기능을 이용해보세요.",
      link: "/premium/checkout",
    },
  });
  console.log("  Notifications: 2");

  // ──────────────────────────────────────────────
  // 7. Sample Franchises
  // ──────────────────────────────────────────────
  const franchises = [
    // 커피
    { brandName: "이디야커피", category: "외식", subcategory: "커피", monthlyAvgSales: BigInt(18_500_000), startupCost: BigInt(62_000_000), storeCount: 3200, dataYear: 2023 },
    { brandName: "메가MGC커피", category: "외식", subcategory: "커피", monthlyAvgSales: BigInt(30_210_000), startupCost: BigInt(74_220_000), storeCount: 2709, dataYear: 2023 },
    { brandName: "컴포즈커피", category: "외식", subcategory: "커피", monthlyAvgSales: BigInt(22_800_000), startupCost: BigInt(55_000_000), storeCount: 2450, dataYear: 2023 },
    { brandName: "빽다방", category: "외식", subcategory: "커피", monthlyAvgSales: BigInt(25_600_000), startupCost: BigInt(48_000_000), storeCount: 1050, dataYear: 2023 },
    // 치킨
    { brandName: "맘스터치", category: "외식", subcategory: "치킨", monthlyAvgSales: BigInt(42_800_000), startupCost: BigInt(95_000_000), storeCount: 1420, dataYear: 2023 },
    { brandName: "BBQ", category: "외식", subcategory: "치킨", monthlyAvgSales: BigInt(38_500_000), startupCost: BigInt(110_000_000), storeCount: 1750, dataYear: 2023 },
    { brandName: "교촌치킨", category: "외식", subcategory: "치킨", monthlyAvgSales: BigInt(35_200_000), startupCost: BigInt(98_000_000), storeCount: 1280, dataYear: 2023 },
    // 한식/분식/피자
    { brandName: "본죽", category: "외식", subcategory: "한식", monthlyAvgSales: BigInt(22_000_000), startupCost: BigInt(65_000_000), storeCount: 1350, dataYear: 2023 },
    { brandName: "한솥도시락", category: "외식", subcategory: "도시락", monthlyAvgSales: BigInt(28_000_000), startupCost: BigInt(52_000_000), storeCount: 680, dataYear: 2023 },
    { brandName: "도미노피자", category: "외식", subcategory: "피자", monthlyAvgSales: BigInt(55_000_000), startupCost: BigInt(180_000_000), storeCount: 480, dataYear: 2023 },
    { brandName: "죠스떡볶이", category: "외식", subcategory: "분식", monthlyAvgSales: BigInt(19_500_000), startupCost: BigInt(42_000_000), storeCount: 520, dataYear: 2023 },
    // 도소매/서비스
    { brandName: "CU", category: "도소매", subcategory: "편의점", monthlyAvgSales: BigInt(48_000_000), startupCost: BigInt(80_000_000), storeCount: 17200, dataYear: 2023 },
    { brandName: "GS25", category: "도소매", subcategory: "편의점", monthlyAvgSales: BigInt(51_000_000), startupCost: BigInt(85_000_000), storeCount: 16800, dataYear: 2023 },
    { brandName: "올리브영", category: "도소매", subcategory: "화장품", monthlyAvgSales: BigInt(78_000_000), startupCost: BigInt(150_000_000), storeCount: 1300, dataYear: 2023 },
    { brandName: "크린토피아", category: "서비스", subcategory: "세탁", monthlyAvgSales: BigInt(12_500_000), startupCost: BigInt(45_000_000), storeCount: 2100, dataYear: 2023 },
  ];

  for (const f of franchises) {
    await prisma.franchise.upsert({
      where: { id: `seed-franchise-${f.brandName}` },
      update: {},
      create: { id: `seed-franchise-${f.brandName}`, ...f },
    });
  }
  console.log(`  Franchises: ${franchises.length}`);

  // ──────────────────────────────────────────────
  // 8. Sample Board Posts
  // ──────────────────────────────────────────────
  const boardPosts = [
    { category: "공지사항", title: "권리샵 오픈 안내", content: "안녕하세요, 권리샵이 정식 오픈하였습니다.\n\n상가 점포 매매·양도 전문 플랫폼으로서 안전하고 투명한 거래를 지원합니다.\n\n많은 이용 부탁드립니다." },
    { category: "이용가이드", title: "매물 등록 방법 가이드", content: "1. 회원가입 후 로그인합니다.\n2. '점포 팔기' 메뉴를 클릭합니다.\n3. 매물 정보(업종, 가격, 위치 등)를 입력합니다.\n4. 사진을 첨부하면 매물 노출에 유리합니다.\n5. 등록 완료 후 관리자 검토를 거쳐 게시됩니다." },
    { category: "창업정보", title: "2026년 유망 창업 아이템 TOP 10", content: "올해 가장 주목받는 창업 아이템을 소개합니다.\n\n1. 무인매장 (카페, 아이스크림)\n2. 건강식 전문점\n3. 반려동물 서비스\n4. 셀프 세탁소\n5. 스터디카페\n6. 배달 전문점\n7. 키즈카페\n8. 네일아트\n9. 코인 노래방\n10. 밀키트 전문점\n\n지역별 상권 분석과 함께 참고하시기 바랍니다." },
    { category: "창업정보", title: "상가 임대차 계약 시 꼭 확인해야 할 5가지", content: "상가 계약 전 반드시 확인해야 할 사항들:\n\n1. 권리금 보호: 상가건물 임대차보호법 적용 여부\n2. 임대차 기간: 최소 5년 보장 여부\n3. 원상복구 조건: 인테리어 철거 범위\n4. 관리비 내역: 포함/별도 항목 확인\n5. 영업 제한 조건: 업종 변경 가능 여부\n\n전문가 자문을 받으시길 권장합니다." },
    { category: "알림공지", title: "소상공인 지원금 신청 안내 (2026년)", content: "정부 소상공인 지원 정책이 확대되었습니다.\n\n- 신규 창업자 대상 최대 5,000만원 저리 대출\n- 기존 소상공인 운영자금 3,000만원 지원\n- 디지털 전환 지원금 500만원\n\n신청기간: 2026년 3월 1일 ~ 12월 31일\n자세한 내용은 소상공인시장진흥공단 홈페이지를 참조하세요." },
    { category: "이용가이드", title: "프리미엄 서비스 이용 안내", content: "프리미엄 회원이 되시면 다음과 같은 혜택을 받으실 수 있습니다.\n\n- 매물 상단 노출 (검색 결과 우선 표시)\n- 상세 매출 분석 리포트\n- 비교 매물 분석\n- 전문가 상담 무료 연결\n- 계약서 템플릿 제공\n\n자세한 내용은 '프리미엄' 페이지를 확인해주세요." },
  ];

  for (let i = 0; i < boardPosts.length; i++) {
    await prisma.boardPost.upsert({
      where: { id: `seed-post-${i}` },
      update: {},
      create: { id: `seed-post-${i}`, ...boardPosts[i], isPublished: true },
    });
  }
  console.log(`  Board posts: ${boardPosts.length}`);

  // ──────────────────────────────────────────────
  // 9. Sample Banners
  // ──────────────────────────────────────────────
  const banners = [
    {
      title: "권리샵 그랜드 오픈",
      imageUrl: "gradient:linear-gradient(135deg, #1B3A5C 0%, #0B3B57 100%)",
      linkUrl: "/listings",
      sortOrder: 0,
    },
    {
      title: "프리미엄 회원 혜택",
      imageUrl: "gradient:linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      linkUrl: "/premium",
      sortOrder: 1,
    },
    {
      title: "안전한 거래, 권리샵과 함께",
      imageUrl: "gradient:linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      linkUrl: "/legal/terms",
      sortOrder: 2,
    },
  ];

  for (let i = 0; i < banners.length; i++) {
    await prisma.banner.upsert({
      where: { id: `seed-banner-${i}` },
      update: {},
      create: { id: `seed-banner-${i}`, ...banners[i], isActive: true },
    });
  }
  console.log(`  Banners: ${banners.length}`);

  // ──────────────────────────────────────────────
  // 10. Report Plans (권리분석 리포트)
  // ──────────────────────────────────────────────
  const reportPlans = [
    {
      id: "rplan-basic",
      name: "BASIC" as const,
      displayName: "권리진단서",
      price: BigInt(30_000),
      features: ["적정 권리금 산정 (영업/시설/바닥)", "수익성·입지·리스크 진단", "종합 등급 + AI 코멘트", "임대차 체크리스트 20항목", "PDF 리포트 다운로드", "권리진단 완료 배지 부여"],
    },
  ];

  for (const plan of reportPlans) {
    await prisma.reportPlan.upsert({
      where: { id: plan.id },
      update: { displayName: plan.displayName, price: plan.price, features: plan.features },
      create: plan,
    });
  }
  // Delete old PREMIUM plan if exists
  await prisma.reportPlan.deleteMany({ where: { id: "rplan-premium" } });
  console.log("  Report plans: 1 (unified)");

  // ──────────────────────────────────────────────
  // 10b. Subscription Plans (구독 플랜)
  // ──────────────────────────────────────────────
  const subscriptionPlans = [
    {
      id: "subplan-free",
      name: "FREE" as const,
      displayName: "무료",
      price: 0,
      yearlyPrice: 0,
      features: [
        { text: "매물 검색 & 조회", included: true },
        { text: "매물 등록 (월 3건)", included: true },
        { text: "권리 안전도 등급 확인", included: true },
        { text: "기본 매물 비교 (2개)", included: true },
        { text: "권리진단서 샘플 미리보기", included: true },
        { text: "시세 비교 위젯", included: false },
        { text: "창업 시뮬레이터", included: false },
        { text: "권리진단서 발급", included: false },
      ],
      sortOrder: 0,
    },
    {
      id: "subplan-pro",
      name: "PRO" as const,
      displayName: "프로",
      price: 9_900,
      yearlyPrice: 95_040,
      features: [
        { text: "매물 검색 & 조회", included: true },
        { text: "매물 등록 (월 10건)", included: true },
        { text: "권리 안전도 등급 확인", included: true },
        { text: "매물 비교 (최대 4개)", included: true },
        { text: "시세 비교 위젯 전체 이용", included: true },
        { text: "창업 시뮬레이터 전체 이용", included: true },
        { text: "권리진단서 1회/월 무료", included: true },
        { text: "BASIC 광고 1회/월 무료", included: true },
      ],
      sortOrder: 1,
    },
    {
      id: "subplan-premium",
      name: "PREMIUM" as const,
      displayName: "프리미엄",
      price: 29_900,
      yearlyPrice: 287_040,
      features: [
        { text: "PRO 전체 포함", included: true },
        { text: "매물 등록 무제한", included: true },
        { text: "권리진단서 2회/월 무료", included: true },
        { text: "PREMIUM 광고 1회/월 무료", included: true },
        { text: "전문가 상담 월 2회 무료", included: true },
        { text: "안심거래 배지 자동 부여", included: true },
        { text: "시뮬레이터 PDF 다운로드", included: true },
      ],
      sortOrder: 2,
    },
  ];

  for (const plan of subscriptionPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.id },
      update: { isActive: false },
      create: { ...plan, isActive: false },
    });
  }
  console.log("  Subscription plans: 3");

  // ──────────────────────────────────────────────
  // 11. Market Prices (시세 데이터)
  // ──────────────────────────────────────────────
  const marketPriceData: { subRegion: string; businessType: string; avgDeposit: number; avgMonthlyRent: number; avgKeyMoney: number; avgMonthlySales: number; sampleCount: number }[] = [
    // 강남구
    { subRegion: "강남구", businessType: "CAFE_BAKERY", avgDeposit: 50_000_000, avgMonthlyRent: 3_500_000, avgKeyMoney: 130_000_000, avgMonthlySales: 28_000_000, sampleCount: 42 },
    { subRegion: "강남구", businessType: "KOREAN_FOOD", avgDeposit: 80_000_000, avgMonthlyRent: 5_500_000, avgKeyMoney: 200_000_000, avgMonthlySales: 55_000_000, sampleCount: 31 },
    { subRegion: "강남구", businessType: "CHICKEN", avgDeposit: 30_000_000, avgMonthlyRent: 2_800_000, avgKeyMoney: 90_000_000, avgMonthlySales: 32_000_000, sampleCount: 18 },
    { subRegion: "강남구", businessType: "SERVICE", avgDeposit: 30_000_000, avgMonthlyRent: 2_500_000, avgKeyMoney: 80_000_000, avgMonthlySales: 20_000_000, sampleCount: 24 },
    { subRegion: "강남구", businessType: "BAR_PUB", avgDeposit: 50_000_000, avgMonthlyRent: 4_500_000, avgKeyMoney: 160_000_000, avgMonthlySales: 45_000_000, sampleCount: 15 },
    { subRegion: "강남구", businessType: "RETAIL", avgDeposit: 40_000_000, avgMonthlyRent: 3_000_000, avgKeyMoney: 60_000_000, avgMonthlySales: 50_000_000, sampleCount: 20 },
    // 마포구
    { subRegion: "마포구", businessType: "CAFE_BAKERY", avgDeposit: 30_000_000, avgMonthlyRent: 2_200_000, avgKeyMoney: 80_000_000, avgMonthlySales: 20_000_000, sampleCount: 38 },
    { subRegion: "마포구", businessType: "CHICKEN", avgDeposit: 25_000_000, avgMonthlyRent: 2_000_000, avgKeyMoney: 70_000_000, avgMonthlySales: 30_000_000, sampleCount: 22 },
    { subRegion: "마포구", businessType: "BAR_PUB", avgDeposit: 35_000_000, avgMonthlyRent: 3_000_000, avgKeyMoney: 120_000_000, avgMonthlySales: 38_000_000, sampleCount: 28 },
    { subRegion: "마포구", businessType: "KOREAN_FOOD", avgDeposit: 40_000_000, avgMonthlyRent: 3_200_000, avgKeyMoney: 100_000_000, avgMonthlySales: 35_000_000, sampleCount: 19 },
    { subRegion: "마포구", businessType: "WESTERN_FOOD", avgDeposit: 45_000_000, avgMonthlyRent: 3_500_000, avgKeyMoney: 110_000_000, avgMonthlySales: 30_000_000, sampleCount: 12 },
    // 송파구
    { subRegion: "송파구", businessType: "CAFE_BAKERY", avgDeposit: 40_000_000, avgMonthlyRent: 2_800_000, avgKeyMoney: 100_000_000, avgMonthlySales: 22_000_000, sampleCount: 35 },
    { subRegion: "송파구", businessType: "KOREAN_FOOD", avgDeposit: 70_000_000, avgMonthlyRent: 4_800_000, avgKeyMoney: 180_000_000, avgMonthlySales: 48_000_000, sampleCount: 26 },
    { subRegion: "송파구", businessType: "CHICKEN", avgDeposit: 25_000_000, avgMonthlyRent: 2_200_000, avgKeyMoney: 75_000_000, avgMonthlySales: 28_000_000, sampleCount: 16 },
    { subRegion: "송파구", businessType: "ENTERTAINMENT", avgDeposit: 60_000_000, avgMonthlyRent: 5_000_000, avgKeyMoney: 200_000_000, avgMonthlySales: 40_000_000, sampleCount: 8 },
    // 서초구
    { subRegion: "서초구", businessType: "CAFE_BAKERY", avgDeposit: 45_000_000, avgMonthlyRent: 3_200_000, avgKeyMoney: 120_000_000, avgMonthlySales: 25_000_000, sampleCount: 30 },
    { subRegion: "서초구", businessType: "SERVICE", avgDeposit: 25_000_000, avgMonthlyRent: 2_200_000, avgKeyMoney: 70_000_000, avgMonthlySales: 18_000_000, sampleCount: 21 },
    { subRegion: "서초구", businessType: "KOREAN_FOOD", avgDeposit: 60_000_000, avgMonthlyRent: 4_500_000, avgKeyMoney: 150_000_000, avgMonthlySales: 42_000_000, sampleCount: 17 },
    // 용산구
    { subRegion: "용산구", businessType: "BAR_PUB", avgDeposit: 40_000_000, avgMonthlyRent: 3_800_000, avgKeyMoney: 140_000_000, avgMonthlySales: 42_000_000, sampleCount: 25 },
    { subRegion: "용산구", businessType: "CAFE_BAKERY", avgDeposit: 35_000_000, avgMonthlyRent: 2_800_000, avgKeyMoney: 90_000_000, avgMonthlySales: 22_000_000, sampleCount: 20 },
    { subRegion: "용산구", businessType: "WESTERN_FOOD", avgDeposit: 50_000_000, avgMonthlyRent: 4_000_000, avgKeyMoney: 130_000_000, avgMonthlySales: 35_000_000, sampleCount: 10 },
    // 성동구
    { subRegion: "성동구", businessType: "CAFE_BAKERY", avgDeposit: 25_000_000, avgMonthlyRent: 1_800_000, avgKeyMoney: 60_000_000, avgMonthlySales: 18_000_000, sampleCount: 28 },
    { subRegion: "성동구", businessType: "RETAIL", avgDeposit: 30_000_000, avgMonthlyRent: 1_800_000, avgKeyMoney: 40_000_000, avgMonthlySales: 45_000_000, sampleCount: 15 },
    { subRegion: "성동구", businessType: "CHICKEN", avgDeposit: 20_000_000, avgMonthlyRent: 1_500_000, avgKeyMoney: 50_000_000, avgMonthlySales: 25_000_000, sampleCount: 12 },
    // 광진구
    { subRegion: "광진구", businessType: "CAFE_BAKERY", avgDeposit: 30_000_000, avgMonthlyRent: 2_000_000, avgKeyMoney: 70_000_000, avgMonthlySales: 19_000_000, sampleCount: 22 },
    { subRegion: "광진구", businessType: "CHICKEN", avgDeposit: 22_000_000, avgMonthlyRent: 1_800_000, avgKeyMoney: 55_000_000, avgMonthlySales: 27_000_000, sampleCount: 14 },
    { subRegion: "광진구", businessType: "KOREAN_FOOD", avgDeposit: 45_000_000, avgMonthlyRent: 3_000_000, avgKeyMoney: 120_000_000, avgMonthlySales: 38_000_000, sampleCount: 11 },
    // 강서구
    { subRegion: "강서구", businessType: "PIZZA", avgDeposit: 20_000_000, avgMonthlyRent: 1_500_000, avgKeyMoney: 50_000_000, avgMonthlySales: 30_000_000, sampleCount: 16 },
    { subRegion: "강서구", businessType: "CAFE_BAKERY", avgDeposit: 22_000_000, avgMonthlyRent: 1_600_000, avgKeyMoney: 55_000_000, avgMonthlySales: 16_000_000, sampleCount: 19 },
    { subRegion: "강서구", businessType: "CHICKEN", avgDeposit: 18_000_000, avgMonthlyRent: 1_300_000, avgKeyMoney: 45_000_000, avgMonthlySales: 26_000_000, sampleCount: 20 },
    // 노원구
    { subRegion: "노원구", businessType: "ENTERTAINMENT", avgDeposit: 50_000_000, avgMonthlyRent: 4_500_000, avgKeyMoney: 180_000_000, avgMonthlySales: 35_000_000, sampleCount: 7 },
    { subRegion: "노원구", businessType: "CAFE_BAKERY", avgDeposit: 18_000_000, avgMonthlyRent: 1_200_000, avgKeyMoney: 40_000_000, avgMonthlySales: 14_000_000, sampleCount: 25 },
    { subRegion: "노원구", businessType: "CHICKEN", avgDeposit: 15_000_000, avgMonthlyRent: 1_100_000, avgKeyMoney: 35_000_000, avgMonthlySales: 22_000_000, sampleCount: 18 },
    // 영등포구
    { subRegion: "영등포구", businessType: "CAFE_BAKERY", avgDeposit: 35_000_000, avgMonthlyRent: 2_500_000, avgKeyMoney: 85_000_000, avgMonthlySales: 21_000_000, sampleCount: 27 },
    { subRegion: "영등포구", businessType: "KOREAN_FOOD", avgDeposit: 55_000_000, avgMonthlyRent: 4_000_000, avgKeyMoney: 140_000_000, avgMonthlySales: 40_000_000, sampleCount: 14 },
    // 중구
    { subRegion: "중구", businessType: "CAFE_BAKERY", avgDeposit: 40_000_000, avgMonthlyRent: 3_000_000, avgKeyMoney: 95_000_000, avgMonthlySales: 24_000_000, sampleCount: 20 },
    { subRegion: "중구", businessType: "KOREAN_FOOD", avgDeposit: 70_000_000, avgMonthlyRent: 5_000_000, avgKeyMoney: 170_000_000, avgMonthlySales: 50_000_000, sampleCount: 13 },
    // 종로구
    { subRegion: "종로구", businessType: "CAFE_BAKERY", avgDeposit: 38_000_000, avgMonthlyRent: 2_800_000, avgKeyMoney: 88_000_000, avgMonthlySales: 22_000_000, sampleCount: 18 },
    { subRegion: "종로구", businessType: "KOREAN_FOOD", avgDeposit: 65_000_000, avgMonthlyRent: 4_500_000, avgKeyMoney: 160_000_000, avgMonthlySales: 46_000_000, sampleCount: 10 },
    // 동작구
    { subRegion: "동작구", businessType: "CAFE_BAKERY", avgDeposit: 22_000_000, avgMonthlyRent: 1_500_000, avgKeyMoney: 50_000_000, avgMonthlySales: 15_000_000, sampleCount: 16 },
    { subRegion: "동작구", businessType: "EDUCATION", avgDeposit: 30_000_000, avgMonthlyRent: 2_000_000, avgKeyMoney: 60_000_000, avgMonthlySales: 20_000_000, sampleCount: 9 },
  ];

  let mpCount = 0;
  for (const mp of marketPriceData) {
    const id = `seed-mp-${mp.subRegion}-${mp.businessType}`.toLowerCase();
    await prisma.marketPrice.upsert({
      where: { id },
      update: {},
      create: {
        id,
        region: "서울특별시",
        subRegion: mp.subRegion,
        businessType: mp.businessType as "CAFE_BAKERY" | "KOREAN_FOOD" | "CHICKEN" | "SERVICE" | "BAR_PUB" | "RETAIL" | "WESTERN_FOOD" | "PIZZA" | "ENTERTAINMENT" | "EDUCATION",
        avgDeposit: BigInt(mp.avgDeposit),
        avgMonthlyRent: BigInt(mp.avgMonthlyRent),
        avgKeyMoney: BigInt(mp.avgKeyMoney),
        avgMonthlySales: BigInt(mp.avgMonthlySales),
        sampleCount: mp.sampleCount,
      },
    });
    mpCount++;
  }
  console.log(`  Market prices: ${mpCount}`);

  // ──────────────────────────────────────────────
  // 12. Experts (전문가)
  // ──────────────────────────────────────────────
  const expertsData = [
    // LAW (법률) - 4명
    {
      id: "seed-expert-law-1",
      name: "김정훈",
      category: "LAW" as const,
      title: "변호사",
      company: "법무법인 한결",
      career: 15,
      description: "상가 권리금 분쟁 및 임대차 관련 법률 자문 전문. 15년간 500건 이상의 상가 관련 소송을 성공적으로 수행하였습니다.",
      specialties: ["권리금분쟁", "임대차계약", "상가임대차보호법"],
      rating: 4.8,
      reviewCount: 32,
      consultCount: 156,
      phone: "02-1234-0001",
      email: "kim.jh@hankyul.law",
      region: "서울특별시",
      isVerified: true,
    },
    {
      id: "seed-expert-law-2",
      name: "박수진",
      category: "LAW" as const,
      title: "변호사",
      company: "법률사무소 정의",
      career: 8,
      description: "부동산 소송 및 계약 분쟁 전문 변호사. 의뢰인의 권리 보호를 최우선으로 합니다.",
      specialties: ["부동산소송", "계약분쟁", "명도소송"],
      rating: 4.6,
      reviewCount: 18,
      consultCount: 89,
      phone: "031-1234-0002",
      email: "park.sj@justice.law",
      region: "경기도",
      isVerified: true,
    },
    {
      id: "seed-expert-law-3",
      name: "이준혁",
      category: "LAW" as const,
      title: "법무사",
      company: "이준혁 법무사사무소",
      career: 12,
      description: "등기 및 권리분석 전문 법무사. 정확한 분석으로 안전한 거래를 지원합니다.",
      specialties: ["등기", "권리분석", "가등기"],
      rating: 4.7,
      reviewCount: 25,
      consultCount: 124,
      phone: "051-1234-0003",
      email: "lee.jh@legal.kr",
      region: "부산광역시",
      isVerified: true,
    },
    {
      id: "seed-expert-law-4",
      name: "최민아",
      category: "LAW" as const,
      title: "변호사",
      company: "법무법인 새빛",
      career: 6,
      description: "상가 권리금 보호 및 임차인 권리 전문. 소상공인의 든든한 법적 파트너입니다.",
      specialties: ["상가권리금", "임차인보호"],
      rating: 4.5,
      reviewCount: 12,
      consultCount: 45,
      phone: "032-1234-0004",
      email: "choi.ma@saebit.law",
      region: "인천광역시",
      isVerified: false,
    },
    // INTERIOR (인테리어) - 4명
    {
      id: "seed-expert-interior-1",
      name: "한승우",
      category: "INTERIOR" as const,
      title: "실장",
      company: "디자인스튜디오 모던",
      career: 10,
      description: "상가 인테리어 디자인 및 시공 전문. 트렌디한 디자인과 합리적인 비용으로 최적의 공간을 만들어 드립니다.",
      specialties: ["상가인테리어", "카페인테리어", "음식점설계"],
      rating: 4.9,
      reviewCount: 45,
      consultCount: 210,
      phone: "02-1234-0005",
      email: "han.sw@modern.design",
      region: "서울특별시",
      isVerified: true,
    },
    {
      id: "seed-expert-interior-2",
      name: "정미래",
      category: "INTERIOR" as const,
      title: "대표",
      company: "인테리어랩",
      career: 7,
      description: "소규모 상가 리모델링 및 인테리어 비용 산정 전문. 예산에 맞는 최적의 솔루션을 제안합니다.",
      specialties: ["소규모상가", "리모델링", "인테리어비용산정"],
      rating: 4.4,
      reviewCount: 15,
      consultCount: 67,
      phone: "031-1234-0006",
      email: "jung.mr@interlab.co",
      region: "경기도",
      isVerified: false,
    },
    {
      id: "seed-expert-interior-3",
      name: "오건호",
      category: "INTERIOR" as const,
      title: "부장",
      company: "세움건설인테리어",
      career: 15,
      description: "대형 상가 및 프랜차이즈 인테리어 시공 전문. 풍부한 경험으로 완벽한 시공을 보장합니다.",
      specialties: ["대형상가", "프랜차이즈인테리어"],
      rating: 4.7,
      reviewCount: 28,
      consultCount: 143,
      phone: "042-1234-0007",
      email: "oh.kh@seum.co.kr",
      region: "대전광역시",
      isVerified: true,
    },
    {
      id: "seed-expert-interior-4",
      name: "김나윤",
      category: "INTERIOR" as const,
      title: "디자이너",
      company: "스페이스플랜",
      career: 5,
      description: "카페 디자인 및 소호 인테리어 전문. 감각적인 공간 컨설팅으로 매장 가치를 높여드립니다.",
      specialties: ["카페디자인", "소호인테리어", "공간컨설팅"],
      rating: 4.3,
      reviewCount: 8,
      consultCount: 34,
      phone: "02-1234-0008",
      email: "kim.ny@spaceplan.kr",
      region: "서울특별시",
      isVerified: false,
    },
    // DEMOLITION (철거) - 3명
    {
      id: "seed-expert-demo-1",
      name: "박대현",
      category: "DEMOLITION" as const,
      title: "대표",
      company: "클린철거",
      career: 20,
      description: "상가 철거 및 원상복구 전문. 20년 경력의 노하우로 깔끔하고 안전한 철거를 약속합니다.",
      specialties: ["상가철거", "원상복구", "폐기물처리"],
      rating: 4.6,
      reviewCount: 22,
      consultCount: 178,
      phone: "02-1234-0009",
      email: "park.dh@cleandemol.kr",
      region: "서울특별시",
      isVerified: true,
    },
    {
      id: "seed-expert-demo-2",
      name: "이상진",
      category: "DEMOLITION" as const,
      title: "팀장",
      company: "한국철거산업",
      career: 12,
      description: "내부 철거 및 구조물 해체 전문. 석면 처리 자격 보유로 안전한 작업을 진행합니다.",
      specialties: ["내부철거", "구조물해체", "석면처리"],
      rating: 4.5,
      reviewCount: 16,
      consultCount: 95,
      phone: "031-1234-0010",
      email: "lee.sj@kdemol.co.kr",
      region: "경기도",
      isVerified: true,
    },
    {
      id: "seed-expert-demo-3",
      name: "최용석",
      category: "DEMOLITION" as const,
      title: "대표",
      company: "신속철거",
      career: 8,
      description: "소규모 철거 및 원상복구 견적 전문. 합리적인 가격과 신속한 작업을 약속합니다.",
      specialties: ["소규모철거", "원상복구견적"],
      rating: 4.3,
      reviewCount: 9,
      consultCount: 52,
      phone: "051-1234-0011",
      email: "choi.ys@quickdemol.kr",
      region: "부산광역시",
      isVerified: false,
    },
    // ACCOUNTING (세무회계) - 4명
    {
      id: "seed-expert-acct-1",
      name: "강현우",
      category: "ACCOUNTING" as const,
      title: "세무사",
      company: "강현우세무회계사무소",
      career: 14,
      description: "창업 세무 및 부가가치세, 종합소득세 전문. 체계적인 세무 관리로 절세를 도와드립니다.",
      specialties: ["창업세무", "부가가치세", "종합소득세"],
      rating: 4.8,
      reviewCount: 38,
      consultCount: 192,
      phone: "02-1234-0012",
      email: "kang.hw@tax.kr",
      region: "서울특별시",
      isVerified: true,
    },
    {
      id: "seed-expert-acct-2",
      name: "윤서현",
      category: "ACCOUNTING" as const,
      title: "회계사",
      company: "정도회계법인",
      career: 9,
      description: "법인세 및 세무조사 대응 전문. 꼼꼼한 절세 컨설팅으로 사업자의 세금 부담을 줄여드립니다.",
      specialties: ["법인세", "세무조사대응", "절세컨설팅"],
      rating: 4.6,
      reviewCount: 20,
      consultCount: 87,
      phone: "031-1234-0013",
      email: "yoon.sh@jungdo.cpa",
      region: "경기도",
      isVerified: true,
    },
    {
      id: "seed-expert-acct-3",
      name: "임재현",
      category: "ACCOUNTING" as const,
      title: "세무사",
      company: "세무법인 한울",
      career: 7,
      description: "개인사업자 및 양도소득세 전문 세무사. 사업 초기부터 안정까지 함께합니다.",
      specialties: ["개인사업자", "양도소득세"],
      rating: 4.4,
      reviewCount: 14,
      consultCount: 63,
      phone: "053-1234-0014",
      email: "lim.jh@hanul.tax",
      region: "대구광역시",
      isVerified: false,
    },
    {
      id: "seed-expert-acct-4",
      name: "송지은",
      category: "ACCOUNTING" as const,
      title: "세무사",
      company: "송지은세무사사무소",
      career: 5,
      description: "신규 창업 세무 및 간편장부 전문. 창업자의 첫 세무를 쉽고 정확하게 도와드립니다.",
      specialties: ["신규창업세무", "간편장부"],
      rating: 4.2,
      reviewCount: 7,
      consultCount: 28,
      phone: "032-1234-0015",
      email: "song.je@tax.kr",
      region: "인천광역시",
      isVerified: false,
    },
    // REALESTATE (부동산) - 3명
    {
      id: "seed-expert-re-1",
      name: "황정민",
      category: "REALESTATE" as const,
      title: "공인중개사",
      company: "황정민부동산",
      career: 18,
      description: "상가 매매 및 권리금 협상 전문. 18년간의 경험으로 최적의 입지와 가격을 분석해드립니다.",
      specialties: ["상가매매", "권리금협상", "입지분석"],
      rating: 4.9,
      reviewCount: 52,
      consultCount: 267,
      phone: "02-1234-0016",
      email: "hwang.jm@realestate.kr",
      region: "서울특별시",
      isVerified: true,
    },
    {
      id: "seed-expert-re-2",
      name: "조영수",
      category: "REALESTATE" as const,
      title: "공인중개사",
      company: "새시대부동산",
      career: 11,
      description: "상가 임대 및 프랜차이즈 입지 분석 전문. 데이터 기반의 상권 분석을 제공합니다.",
      specialties: ["상가임대", "프랜차이즈입지", "상권분석"],
      rating: 4.5,
      reviewCount: 19,
      consultCount: 98,
      phone: "031-1234-0017",
      email: "cho.ys@newera.kr",
      region: "경기도",
      isVerified: true,
    },
    {
      id: "seed-expert-re-3",
      name: "나은채",
      category: "REALESTATE" as const,
      title: "공인중개사",
      company: "드림부동산",
      career: 6,
      description: "소형 상가 및 투자 분석 전문. 합리적인 투자 판단을 도와드립니다.",
      specialties: ["소형상가", "투자분석"],
      rating: 4.3,
      reviewCount: 10,
      consultCount: 41,
      phone: "062-1234-0018",
      email: "na.ec@dream.kr",
      region: "광주광역시",
      isVerified: false,
    },
  ];

  for (const expert of expertsData) {
    await prisma.expert.upsert({
      where: { id: expert.id },
      update: {},
      create: expert,
    });
  }
  console.log(`  Experts: ${expertsData.length}`);

  // ──────────────────────────────────────────────
  // 13. Expert Reviews (전문가 리뷰)
  // ──────────────────────────────────────────────
  // We need a user to be the reviewer. Use the buyer user for all reviews.
  // Create additional review users for variety
  const reviewUsers = [
    { id: "seed-review-user-1", email: "reviewer1@test.com", name: "김민수" },
    { id: "seed-review-user-2", email: "reviewer2@test.com", name: "이영희" },
    { id: "seed-review-user-3", email: "reviewer3@test.com", name: "박지성" },
    { id: "seed-review-user-4", email: "reviewer4@test.com", name: "정수아" },
    { id: "seed-review-user-5", email: "reviewer5@test.com", name: "최준호" },
  ];

  for (const ru of reviewUsers) {
    await prisma.user.upsert({
      where: { email: ru.email },
      update: {},
      create: {
        id: ru.id,
        email: ru.email,
        name: ru.name,
        hashedPassword: password,
        role: "BUYER",
        accountStatus: "ACTIVE",
        emailVerified: new Date(),
      },
    });
  }

  // Review data per expert: each expert gets 3-5 reviews
  const reviewTemplates: Record<string, { rating: number; content: string; daysAgo: number; userId: string }[]> = {
    "seed-expert-law-1": [
      { rating: 5, content: "권리금 분쟁 관련 상담을 받았는데 정말 꼼꼼하게 법적 근거를 설명해주셨습니다. 덕분에 유리하게 합의할 수 있었어요.", daysAgo: 10, userId: "seed-review-user-1" },
      { rating: 5, content: "임대차 계약서 검토를 요청했는데 위험 조항을 정확히 짚어주셨습니다. 매우 전문적입니다.", daysAgo: 35, userId: "seed-review-user-2" },
      { rating: 4, content: "상가임대차보호법에 대해 자세히 알려주셔서 감사합니다. 응답이 조금 늦은 점은 아쉬웠어요.", daysAgo: 60, userId: "seed-review-user-3" },
      { rating: 5, content: "명도 소송 관련 상담이었는데 예상 절차와 기간을 상세히 안내해주셨습니다.", daysAgo: 90, userId: "seed-review-user-4" },
      { rating: 5, content: "변호사님 덕분에 권리금을 온전히 보전할 수 있었습니다. 강력 추천합니다!", daysAgo: 120, userId: "seed-review-user-5" },
    ],
    "seed-expert-law-2": [
      { rating: 5, content: "부동산 소송 관련 깊이 있는 상담을 해주셨습니다. 승소 전략이 정확했어요.", daysAgo: 15, userId: "seed-review-user-1" },
      { rating: 4, content: "계약 분쟁 해결에 큰 도움을 받았습니다. 친절하고 전문적이었습니다.", daysAgo: 45, userId: "seed-review-user-3" },
      { rating: 5, content: "명도소송을 대리해주셨는데 빠른 시간 내에 원만히 해결되었습니다.", daysAgo: 80, userId: "seed-review-user-4" },
      { rating: 4, content: "상담 내용이 명확하고 이해하기 쉬웠습니다. 비용도 합리적이었어요.", daysAgo: 130, userId: "seed-review-user-5" },
    ],
    "seed-expert-law-3": [
      { rating: 5, content: "등기부등본 분석을 꼼꼼하게 해주셔서 위험 요소를 미리 파악할 수 있었습니다.", daysAgo: 12, userId: "seed-review-user-1" },
      { rating: 5, content: "권리분석 결과를 알기 쉽게 설명해주셔서 좋았습니다. 전문성이 느껴졌어요.", daysAgo: 40, userId: "seed-review-user-2" },
      { rating: 4, content: "가등기 관련 문의에 친절하게 답변해주셨습니다. 추천합니다.", daysAgo: 70, userId: "seed-review-user-4" },
      { rating: 5, content: "복잡한 등기 사항을 쉽게 풀어서 설명해주셔서 이해가 잘 됐습니다.", daysAgo: 100, userId: "seed-review-user-5" },
      { rating: 5, content: "상가 매입 전 권리분석을 맡겼는데 숨겨진 위험을 발견해주셨습니다.", daysAgo: 150, userId: "seed-review-user-3" },
    ],
    "seed-expert-law-4": [
      { rating: 5, content: "상가 권리금 보호에 대해 명쾌하게 설명해주셨습니다.", daysAgo: 20, userId: "seed-review-user-1" },
      { rating: 4, content: "임차인으로서 어떤 권리가 있는지 잘 알게 되었어요.", daysAgo: 55, userId: "seed-review-user-2" },
      { rating: 5, content: "젊은 변호사님이지만 실력이 뛰어나십니다. 성의 있는 답변 감사합니다.", daysAgo: 90, userId: "seed-review-user-3" },
    ],
    "seed-expert-interior-1": [
      { rating: 5, content: "카페 인테리어를 맡겼는데 결과물이 정말 만족스러웠습니다. 센스가 뛰어나세요!", daysAgo: 8, userId: "seed-review-user-1" },
      { rating: 5, content: "견적부터 시공까지 체계적으로 진행해주셨습니다. 약속한 기간 내에 완벽하게 마무리!", daysAgo: 25, userId: "seed-review-user-2" },
      { rating: 5, content: "음식점 인테리어 설계를 의뢰했는데 동선까지 꼼꼼하게 고려해주셔서 놀랐습니다.", daysAgo: 50, userId: "seed-review-user-3" },
      { rating: 5, content: "디자인 감각이 정말 좋으십니다. 고객들이 인테리어 칭찬을 많이 합니다.", daysAgo: 80, userId: "seed-review-user-4" },
      { rating: 4, content: "전체적으로 만족스러웠으나 A/S 요청 시 응대가 조금 늦었습니다.", daysAgo: 120, userId: "seed-review-user-5" },
    ],
    "seed-expert-interior-2": [
      { rating: 5, content: "소규모 카페 리모델링을 합리적 비용으로 깔끔하게 진행해주셨습니다.", daysAgo: 18, userId: "seed-review-user-1" },
      { rating: 4, content: "비용 산정이 투명하고 정확했습니다. 숨겨진 추가 비용이 없어서 좋았어요.", daysAgo: 50, userId: "seed-review-user-3" },
      { rating: 4, content: "리모델링 후 매장 분위기가 확 달라졌습니다. 추천합니다.", daysAgo: 100, userId: "seed-review-user-5" },
    ],
    "seed-expert-interior-3": [
      { rating: 5, content: "대형 상가 인테리어를 완벽하게 시공해주셨습니다. 15년 경력답습니다.", daysAgo: 14, userId: "seed-review-user-1" },
      { rating: 5, content: "프랜차이즈 인테리어 기준에 맞춰 정확하게 시공해주셨어요.", daysAgo: 40, userId: "seed-review-user-2" },
      { rating: 4, content: "시공 품질이 우수합니다. 다음에도 의뢰하고 싶어요.", daysAgo: 75, userId: "seed-review-user-3" },
      { rating: 5, content: "공사 기간을 정확히 지켜주셔서 오픈 일정에 맞출 수 있었습니다.", daysAgo: 110, userId: "seed-review-user-4" },
      { rating: 5, content: "전문적인 조언과 깔끔한 시공. 두 가지 모두 만족합니다.", daysAgo: 140, userId: "seed-review-user-5" },
    ],
    "seed-expert-interior-4": [
      { rating: 5, content: "카페 디자인 컨셉을 정말 잘 잡아주셨어요. 감각적이고 트렌디합니다!", daysAgo: 22, userId: "seed-review-user-1" },
      { rating: 4, content: "공간 컨설팅이 유익했습니다. 작은 공간도 넓어 보이게 만들어주셨어요.", daysAgo: 60, userId: "seed-review-user-2" },
      { rating: 4, content: "젊은 디자이너님의 참신한 아이디어가 인상적이었습니다.", daysAgo: 120, userId: "seed-review-user-4" },
    ],
    "seed-expert-demo-1": [
      { rating: 5, content: "상가 철거를 깔끔하게 진행해주셨습니다. 폐기물 처리도 완벽했어요.", daysAgo: 10, userId: "seed-review-user-1" },
      { rating: 4, content: "원상복구 작업이 꼼꼼했습니다. 집주인도 만족하셨어요.", daysAgo: 35, userId: "seed-review-user-2" },
      { rating: 5, content: "20년 경력답게 작업이 빠르고 깔끔합니다. 강추!", daysAgo: 65, userId: "seed-review-user-3" },
      { rating: 4, content: "견적이 정확하고 추가 비용 없이 진행되어 좋았습니다.", daysAgo: 100, userId: "seed-review-user-4" },
      { rating: 5, content: "철거 후 마감 처리까지 완벽하게 해주셨습니다.", daysAgo: 140, userId: "seed-review-user-5" },
    ],
    "seed-expert-demo-2": [
      { rating: 5, content: "내부 철거를 안전하게 진행해주셨습니다. 석면 처리도 전문적으로 해주셨어요.", daysAgo: 15, userId: "seed-review-user-1" },
      { rating: 4, content: "구조물 해체가 필요했는데 경험이 풍부하셔서 안심하고 맡겼습니다.", daysAgo: 50, userId: "seed-review-user-3" },
      { rating: 5, content: "안전 기준을 철저히 지키며 작업해주셔서 믿음이 갔습니다.", daysAgo: 90, userId: "seed-review-user-4" },
      { rating: 4, content: "작업 일정을 정확히 맞춰주셨습니다. 전문적인 팀입니다.", daysAgo: 130, userId: "seed-review-user-5" },
    ],
    "seed-expert-demo-3": [
      { rating: 4, content: "소규모 철거를 빠르고 합리적인 가격에 진행해주셨습니다.", daysAgo: 20, userId: "seed-review-user-1" },
      { rating: 5, content: "원상복구 견적이 다른 곳보다 합리적이었고, 작업도 깔끔했어요.", daysAgo: 70, userId: "seed-review-user-2" },
      { rating: 4, content: "신속하게 처리해주셔서 일정에 차질이 없었습니다.", daysAgo: 130, userId: "seed-review-user-4" },
    ],
    "seed-expert-acct-1": [
      { rating: 5, content: "창업 초기 세무 설정을 체계적으로 도와주셨습니다. 정말 큰 도움이 되었어요.", daysAgo: 8, userId: "seed-review-user-1" },
      { rating: 5, content: "부가가치세 신고를 맡겼는데 절세 포인트를 정확히 잡아주셨습니다.", daysAgo: 30, userId: "seed-review-user-2" },
      { rating: 5, content: "종합소득세 신고 시 꼼꼼한 검토 덕분에 환급을 받을 수 있었습니다.", daysAgo: 55, userId: "seed-review-user-3" },
      { rating: 4, content: "전문적인 상담이었습니다. 세무 관련 궁금증이 모두 해소되었어요.", daysAgo: 85, userId: "seed-review-user-4" },
      { rating: 5, content: "장기적인 세무 계획까지 세워주셔서 감사합니다. 최고의 세무사!", daysAgo: 120, userId: "seed-review-user-5" },
    ],
    "seed-expert-acct-2": [
      { rating: 5, content: "법인세 절세 방안을 상세히 안내해주셨습니다. 매우 전문적이에요.", daysAgo: 12, userId: "seed-review-user-1" },
      { rating: 4, content: "세무조사 대응 상담을 받았는데 마음이 많이 놓였습니다.", daysAgo: 45, userId: "seed-review-user-2" },
      { rating: 5, content: "절세 컨설팅이 탁월합니다. 실질적인 세금 절감 효과가 있었어요.", daysAgo: 80, userId: "seed-review-user-3" },
      { rating: 4, content: "회계사님의 꼼꼼한 리뷰 덕분에 오류 없이 신고할 수 있었습니다.", daysAgo: 130, userId: "seed-review-user-5" },
    ],
    "seed-expert-acct-3": [
      { rating: 5, content: "개인사업자 등록부터 세무 신고까지 원스톱으로 도와주셨습니다.", daysAgo: 18, userId: "seed-review-user-1" },
      { rating: 4, content: "양도소득세 관련 상담이 정확하고 이해하기 쉬웠습니다.", daysAgo: 55, userId: "seed-review-user-3" },
      { rating: 4, content: "친절하고 성실한 세무사님입니다. 추천합니다.", daysAgo: 100, userId: "seed-review-user-4" },
      { rating: 5, content: "사업 초기에 알아야 할 세무 사항을 잘 정리해주셨어요.", daysAgo: 140, userId: "seed-review-user-5" },
    ],
    "seed-expert-acct-4": [
      { rating: 5, content: "신규 창업 세무를 쉽고 친절하게 안내해주셨습니다.", daysAgo: 25, userId: "seed-review-user-1" },
      { rating: 4, content: "간편장부 작성법을 자세히 알려주셔서 감사합니다.", daysAgo: 70, userId: "seed-review-user-2" },
      { rating: 4, content: "젊지만 실력 있는 세무사님입니다. 소통도 원활해요.", daysAgo: 120, userId: "seed-review-user-4" },
    ],
    "seed-expert-re-1": [
      { rating: 5, content: "상가 매매 과정에서 권리금 협상을 탁월하게 해주셨습니다. 최고의 중개사!", daysAgo: 5, userId: "seed-review-user-1" },
      { rating: 5, content: "입지 분석이 정말 정확했습니다. 데이터를 기반으로 설명해주셔서 신뢰가 갔어요.", daysAgo: 25, userId: "seed-review-user-2" },
      { rating: 5, content: "18년 경력답게 시장을 꿰뚫고 계십니다. 안심하고 맡길 수 있었어요.", daysAgo: 50, userId: "seed-review-user-3" },
      { rating: 5, content: "매매 전 과정을 체계적으로 안내해주셔서 처음 창업하는 저도 수월하게 진행했습니다.", daysAgo: 80, userId: "seed-review-user-4" },
      { rating: 4, content: "전문성은 최고입니다. 다만 인기가 많아서 예약이 빠듯했어요.", daysAgo: 110, userId: "seed-review-user-5" },
    ],
    "seed-expert-re-2": [
      { rating: 5, content: "프랜차이즈 입지 분석을 받았는데 상권 데이터가 매우 정확했습니다.", daysAgo: 14, userId: "seed-review-user-1" },
      { rating: 4, content: "상가 임대 계약 과정에서 꼼꼼하게 챙겨주셨습니다.", daysAgo: 45, userId: "seed-review-user-2" },
      { rating: 5, content: "상권 분석 리포트가 매우 유용했습니다. 투자 결정에 큰 도움이 되었어요.", daysAgo: 80, userId: "seed-review-user-3" },
      { rating: 4, content: "경험이 풍부하시고 지역 시장을 잘 파악하고 계십니다.", daysAgo: 120, userId: "seed-review-user-5" },
    ],
    "seed-expert-re-3": [
      { rating: 5, content: "소형 상가 투자 상담이 매우 유익했습니다. 구체적인 수익률까지 분석해주셨어요.", daysAgo: 20, userId: "seed-review-user-1" },
      { rating: 4, content: "광주 지역 상가 시장에 대해 잘 알고 계셔서 도움이 많이 되었습니다.", daysAgo: 65, userId: "seed-review-user-2" },
      { rating: 4, content: "친절하고 성실한 중개사님입니다. 초보 투자자에게도 추천합니다.", daysAgo: 130, userId: "seed-review-user-4" },
    ],
  };

  let reviewCount = 0;
  for (const [expertId, reviews] of Object.entries(reviewTemplates)) {
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const reviewId = `seed-review-${expertId}-${i}`;
      const inquiryId = `seed-expert-inquiry-${expertId}-${i}`;

      // Create a completed inquiry for each review
      await prisma.expertInquiry.upsert({
        where: { id: inquiryId },
        update: {},
        create: {
          id: inquiryId,
          expertId,
          userId: review.userId,
          category: "기타",
          subject: "상담 완료",
          message: "상담이 완료되었습니다.",
          status: "COMPLETED",
          createdAt: new Date(Date.now() - (review.daysAgo + 5) * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - review.daysAgo * 24 * 60 * 60 * 1000),
        },
      });

      // Create the review
      await prisma.expertReview.upsert({
        where: { id: reviewId },
        update: {},
        create: {
          id: reviewId,
          expertId,
          userId: review.userId,
          inquiryId,
          rating: review.rating,
          content: review.content,
          createdAt: new Date(Date.now() - review.daysAgo * 24 * 60 * 60 * 1000),
        },
      });
      reviewCount++;
    }
  }
  console.log(`  Expert reviews: ${reviewCount} (with matching inquiries)`);

  // Set hasDiagnosisBadge on first 2 listings
  for (let i = 0; i < 2 && i < createdListings.length; i++) {
    await prisma.listing.update({
      where: { id: createdListings[i].id },
      data: { hasDiagnosisBadge: true },
    });
  }
  console.log("  hasDiagnosisBadge: first 2 listings");

  console.log("\nSeeding complete!");
  console.log("─────────────────────────────────");
  console.log("  admin@kwonrishop.com  / test1234!");
  console.log("  seller@test.com      / test1234!");
  console.log("  buyer@test.com       / test1234!");
  console.log("  agent@test.com       / test1234!");
  console.log("  franchise@test.com   / test1234!");
  console.log("  expert@test.com      / test1234!");
  console.log("─────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
