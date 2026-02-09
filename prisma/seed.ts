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
      name: "김판매",
      hashedPassword: password,
      role: "SELLER",
      accountStatus: "ACTIVE",
      emailVerified: new Date(),
      phone: "010-1234-5678",
      businessName: "서울부동산",
      businessNumber: "123-45-67890",
      subscriptionTier: "BASIC",
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@test.com" },
    update: {},
    create: {
      email: "buyer@test.com",
      name: "이구매",
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
      content: `# 권리샵 이용약관\n\n## 제1조 (목적)\n본 약관은 권리샵(이하 "회사")이 제공하는 부동산 권리 분석 플랫폼 서비스의 이용 조건을 규정합니다.\n\n## 제2조 (면책조항)\n본 서비스에서 제공하는 권리 분석, 시세 정보는 참고용이며 법적 효력이 없습니다.\n\n**중요: 법무 검토를 권장합니다.**`,
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
  // 4. Sample Listings
  // ──────────────────────────────────────────────
  const sampleListings = [
    {
      title: "강남역 인근 전세권 양도",
      description: "강남역 도보 5분, 2024년 신축 아파트 전세권 양도입니다. 전세보증보험 가입 완료, 등기부등본 깨끗합니다. 남향 채광 좋고, 역세권 생활 편리합니다.",
      rightsCategory: "JEONSE" as const,
      propertyType: "APARTMENT" as const,
      price: BigInt(350_000_000),
      address: "강남대로 396",
      city: "서울특별시",
      district: "강남구",
      neighborhood: "역삼동",
      areaM2: 84.5,
      areaPyeong: 25.6,
      floor: 12,
      latitude: 37.4979,
      longitude: 127.0276,
      contactPhone: "010-1234-5678",
    },
    {
      title: "마포구 월세 보증금 승계",
      description: "홍대입구역 도보 7분, 깔끔한 원룸 월세 보증금 승계합니다. 풀옵션(에어컨, 세탁기, 냉장고). 주변 편의시설 다수.",
      rightsCategory: "WOLSE" as const,
      propertyType: "OFFICETEL" as const,
      price: BigInt(10_000_000),
      monthlyRent: BigInt(650_000),
      maintenanceFee: BigInt(80_000),
      address: "양화로 186",
      city: "서울특별시",
      district: "마포구",
      neighborhood: "동교동",
      areaM2: 33.0,
      areaPyeong: 10.0,
      floor: 8,
      latitude: 37.5567,
      longitude: 126.9237,
      contactPhone: "010-1234-5678",
    },
    {
      title: "송파구 아파트 근저당권 매각",
      description: "잠실 주공아파트 재건축 예정 단지 근저당권입니다. 감정가 대비 70% 수준. 재건축 시 시세차익 기대 가능합니다.",
      rightsCategory: "MORTGAGE" as const,
      propertyType: "APARTMENT" as const,
      price: BigInt(180_000_000),
      address: "올림픽로 135",
      city: "서울특별시",
      district: "송파구",
      neighborhood: "잠실동",
      areaM2: 76.0,
      areaPyeong: 23.0,
      floor: 5,
      latitude: 37.5133,
      longitude: 127.1001,
      contactPhone: "010-1234-5678",
    },
    {
      title: "용산구 상가 임차권 양도",
      description: "이태원 메인 거리 1층 상가 임차권 양도합니다. 유동인구 많은 핵심 입지, 현재 카페 운영 중. 권리금 포함 가격입니다.",
      rightsCategory: "LEASE_RIGHT" as const,
      propertyType: "COMMERCIAL" as const,
      price: BigInt(95_000_000),
      monthlyRent: BigInt(3_500_000),
      maintenanceFee: BigInt(200_000),
      address: "이태원로 177",
      city: "서울특별시",
      district: "용산구",
      neighborhood: "이태원동",
      areaM2: 55.0,
      areaPyeong: 16.6,
      floor: 1,
      latitude: 37.5345,
      longitude: 126.9945,
      contactPhone: "010-1234-5678",
    },
    {
      title: "서초구 오피스 지상권",
      description: "교대역 인근 오피스 건물 지상권입니다. 잔여 기간 15년. 안정적 임대수익 가능한 물건입니다.",
      rightsCategory: "SUPERFICIES" as const,
      propertyType: "OFFICE" as const,
      price: BigInt(520_000_000),
      address: "서초대로 256",
      city: "서울특별시",
      district: "서초구",
      neighborhood: "서초동",
      areaM2: 165.0,
      areaPyeong: 49.9,
      floor: 3,
      latitude: 37.4937,
      longitude: 127.0145,
      contactPhone: "010-1234-5678",
    },
    {
      title: "성동구 빌라 전세권 급매",
      description: "왕십리역 도보 10분, 빌라 전세권 급하게 양도합니다. 시세 대비 저렴한 가격. 즉시 입주 가능.",
      rightsCategory: "JEONSE" as const,
      propertyType: "VILLA" as const,
      price: BigInt(150_000_000),
      address: "왕십리로 50",
      city: "서울특별시",
      district: "성동구",
      neighborhood: "행당동",
      areaM2: 59.5,
      areaPyeong: 18.0,
      floor: 3,
      latitude: 37.5612,
      longitude: 127.0368,
      contactPhone: "010-1234-5678",
    },
    {
      title: "경매 낙찰 토지 지분 매각",
      description: "강서구 마곡지구 인근 토지 경매 낙찰분 지분 매각합니다. 개발 호재 지역, 장기 투자 적합.",
      rightsCategory: "AUCTION" as const,
      propertyType: "LAND" as const,
      price: BigInt(280_000_000),
      address: "마곡중앙로 55",
      city: "서울특별시",
      district: "강서구",
      neighborhood: "마곡동",
      areaM2: 200.0,
      areaPyeong: 60.5,
      latitude: 37.5676,
      longitude: 126.8372,
      contactPhone: "010-1234-5678",
    },
    {
      title: "노원구 아파트 가등기 물건",
      description: "노원역 인근 중형 아파트 가등기 물건입니다. 소유권이전청구권 가등기. 법무사 확인 완료.",
      rightsCategory: "PROVISIONAL_REG" as const,
      propertyType: "APARTMENT" as const,
      price: BigInt(210_000_000),
      address: "동일로 1379",
      city: "서울특별시",
      district: "노원구",
      neighborhood: "상계동",
      areaM2: 84.0,
      areaPyeong: 25.4,
      floor: 15,
      latitude: 37.6543,
      longitude: 127.0614,
      contactPhone: "010-1234-5678",
    },
  ];

  const createdListings = [];
  for (const listing of sampleListings) {
    const created = await prisma.listing.upsert({
      where: {
        id: `seed-${listing.district}-${listing.rightsCategory}`.toLowerCase(),
      },
      update: {},
      create: {
        id: `seed-${listing.district}-${listing.rightsCategory}`.toLowerCase(),
        sellerId: seller.id,
        ...listing,
        status: "ACTIVE",
        publishedAt: new Date(),
        expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    createdListings.push(created);
  }
  console.log(`  Listings: ${createdListings.length}`);

  // ──────────────────────────────────────────────
  // 5. Sample Inquiries
  // ──────────────────────────────────────────────
  const inquiryMessages = [
    "안녕하세요, 이 매물에 대해 자세한 정보 부탁드립니다. 실제 방문 가능한 시간이 있을까요?",
    "전세보증보험 가입 여부와 등기부등본 확인 가능한가요?",
    "가격 협상이 가능한지 궁금합니다. 연락 부탁드립니다.",
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
