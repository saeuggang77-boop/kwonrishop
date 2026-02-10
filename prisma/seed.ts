import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://kwonrishop:kwonrishop_dev@localhost:5432/kwonrishop";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...\n");

  // ──────────────────────────────────────────────
  // 1. Users
  // ──────────────────────────────────────────────
  const password = await bcrypt.hash("test1234!", 12);

  const admin = await prisma.user.upsert({
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
      subscriptionTier: "BASIC",
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

  console.log("  Users: admin, seller, buyer");

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
  console.log(`  Listings: ${createdListings.length}`);

  // ──────────────────────────────────────────────
  // 5. Sample Inquiries
  // ──────────────────────────────────────────────
  const inquiryMessages = [
    "안녕하세요, 이 매물에 대해 자세한 정보 부탁드립니다. 실제 매출 자료 확인 가능한가요?",
    "권리금 협상이 가능한지 궁금합니다. 방문 상담 가능한 시간이 있을까요?",
    "현재 운영 중인 직원 인수도 가능한지 궁금합니다.",
  ];

  for (let i = 0; i < 3 && i < createdListings.length; i++) {
    await prisma.inquiry.upsert({
      where: { id: `seed-inquiry-${i}` },
      update: {},
      create: {
        id: `seed-inquiry-${i}`,
        listingId: createdListings[i].id,
        senderId: buyer.id,
        receiverId: seller.id,
        message: inquiryMessages[i],
      },
    });
  }
  console.log("  Inquiries: 3");

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
    { brandName: "메가MGC커피", category: "외식", subcategory: "커피", monthlyAvgSales: BigInt(30_210_000), startupCost: BigInt(74_220_000), storeCount: 2709, dataYear: 2023 },
    { brandName: "맘스터치", category: "외식", subcategory: "치킨", monthlyAvgSales: BigInt(42_800_000), startupCost: BigInt(95_000_000), storeCount: 1420, dataYear: 2023 },
    { brandName: "이디야커피", category: "외식", subcategory: "커피", monthlyAvgSales: BigInt(18_500_000), startupCost: BigInt(62_000_000), storeCount: 3200, dataYear: 2023 },
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
  console.log("  Franchises: 6");

  // ──────────────────────────────────────────────
  // 8. Sample Board Posts
  // ──────────────────────────────────────────────
  const boardPosts = [
    { category: "창업정보", title: "2026년 유망 창업 아이템 TOP 10", content: "올해 가장 주목받는 창업 아이템을 소개합니다. 무인매장, 건강식 전문점, 반려동물 서비스 등이 상위권을 차지했습니다." },
    { category: "창업정보", title: "상가 임대차 계약 시 꼭 확인해야 할 5가지", content: "상가 계약 전 반드시 확인해야 할 사항들: 권리금 보호, 임대차 기간, 원상복구 조건, 관리비 내역, 영업 제한 조건 등을 정리했습니다." },
    { category: "뉴스", title: "소상공인 지원금 신청 안내 (2026년)", content: "정부 소상공인 지원 정책이 확대되었습니다. 신규 창업자 대상 최대 5,000만원 저리 대출이 가능합니다." },
  ];

  for (let i = 0; i < boardPosts.length; i++) {
    await prisma.boardPost.upsert({
      where: { id: `seed-post-${i}` },
      update: {},
      create: { id: `seed-post-${i}`, ...boardPosts[i] },
    });
  }
  console.log("  Board posts: 3");

  console.log("\nSeeding complete!");
  console.log("─────────────────────────────────");
  console.log("  admin@kwonrishop.com / test1234!");
  console.log("  seller@test.com     / test1234!");
  console.log("  buyer@test.com      / test1234!");
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
