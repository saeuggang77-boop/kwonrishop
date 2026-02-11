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
      safetyGrade: "D" as const,
      safetyComment: "매출증빙 없음, 권리금 적정성 미확인",
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
  // 4b. Premium Plans & Premium Listings
  // ──────────────────────────────────────────────
  const premiumPlans = [
    { id: "plan-basic", name: "BASIC" as const, displayName: "BASIC", price: BigInt(100_000), durationDays: 30, features: ["매물 목록 상단 노출", "BASIC 배지 표시", "일반 테두리 하이라이트"], sortOrder: 0 },
    { id: "plan-premium", name: "PREMIUM" as const, displayName: "PREMIUM", price: BigInt(200_000), durationDays: 30, features: ["매물 목록 상단 노출", "PREMIUM 배지 표시", "보라색 프리미엄 테두리", "홈페이지 추천 섹션 노출"], sortOrder: 1 },
    { id: "plan-vip", name: "VIP" as const, displayName: "VIP", price: BigInt(300_000), durationDays: 30, features: ["매물 목록 최상단 노출", "VIP 골드 배지", "골드 프리미엄 테두리", "홈페이지 추천 섹션 최우선", "상세페이지 VIP 전용 헤더"], sortOrder: 2 },
  ];

  for (const plan of premiumPlans) {
    await prisma.premiumPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }
  console.log("  Premium plans: 3");

  // Set premium status on sample listings: 강남역 카페 → VIP, 홍대 치킨호프 → PREMIUM, 잠실 한식당 → BASIC
  const premiumMappings = [
    { listingIdx: 0, planId: "plan-vip", rank: 3 },
    { listingIdx: 1, planId: "plan-premium", rank: 2 },
    { listingIdx: 2, planId: "plan-basic", rank: 1 },
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
  console.log("  Premium listings: 3");

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
      imageUrl: "gradient:linear-gradient(135deg, #2EC4B6 0%, #0B3B57 100%)",
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
      displayName: "BASIC 분석",
      price: BigInt(20_000),
      features: ["권리금 적정성 평가", "지역/업종 평균 비교", "권리 위험요소 기본 분석", "종합 위험 등급 판정"],
    },
    {
      id: "rplan-premium",
      name: "PREMIUM" as const,
      displayName: "PREMIUM 분석",
      price: BigInt(40_000),
      features: ["BASIC 전체 항목 포함", "임대차 계약 체크리스트 20항목", "상세 위험요소 분석", "PDF 리포트 다운로드"],
    },
  ];

  for (const plan of reportPlans) {
    await prisma.reportPlan.upsert({
      where: { id: plan.id },
      update: {},
      create: plan,
    });
  }
  console.log("  Report plans: 2");

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

  // Update seller to PRO membership for testing
  await prisma.user.update({
    where: { email: "seller@test.com" },
    data: { subscriptionTier: "BASIC" },
  });
  console.log("  seller@test.com → BASIC (PRO member)");

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
