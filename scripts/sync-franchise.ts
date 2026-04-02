import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getDisclosureContent } from "../src/lib/api/ftc-disclosure";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fetchPage(page: number, yr: string) {
  const params = new URLSearchParams({
    serviceKey: process.env.FTC_API_KEY || "",
    pageNo: String(page),
    numOfRows: "100",
    yr,
    resultType: "json",
  });
  const res = await fetch(
    `https://apis.data.go.kr/1130000/FftcBrandFrcsStatsService/getBrandFrcsStats?${params}`
  );
  return res.json();
}

async function findLatestYear(testFn: (yr: string) => Promise<number>): Promise<string> {
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 3; y--) {
    const count = await testFn(String(y));
    if (count > 0) {
      console.log(`최신 데이터 연도: ${y}년 (${count}건)`);
      return String(y);
    }
  }
  return String(currentYear - 1);
}

async function main() {
  // 통계 API: 최신 연도 자동 탐색
  const yr = await findLatestYear(async (y) => {
    const res = await fetchPage(1, y);
    return res.resultCode === "00" ? res.totalCount : 0;
  });
  let totalSynced = 0;
  let errors = 0;

  const first = await fetchPage(1, yr);
  if (first.resultCode !== "00") {
    console.error("API Error:", first.resultMsg);
    process.exit(1);
  }

  const totalPages = Math.ceil(first.totalCount / 100);
  console.log(`총 ${first.totalCount}건, ${totalPages}페이지`);

  for (let page = 1; page <= totalPages; page++) {
    try {
      const data = page === 1 ? first : await fetchPage(page, yr);
      if (data.resultCode !== "00") {
        console.error(`Page ${page} error`);
        continue;
      }

      for (const item of data.items || []) {
        try {
          const ftcId = `${item.corpNm}_${item.brandNm}`.replace(/\s+/g, "");

          await prisma.franchiseBrand.upsert({
            where: { ftcId },
            update: {
              brandName: item.brandNm,
              companyName: item.corpNm,
              industry: `${item.indutyLclasNm} > ${item.indutyMlsfcNm}`,
              totalStores: item.frcsCnt || 0,
              avgRevenue: item.avrgSlsAmt || 0,
              ftcRawData: {
                newStores: item.newFrcsRgsCnt,
                contractEnd: item.ctrtEndCnt,
                contractCancel: item.ctrtCncltnCnt,
                revenuePerArea: item.arUnitAvrgSlsAmt,
                year: item.yr,
              },
            },
            create: {
              ftcId,
              brandName: item.brandNm,
              companyName: item.corpNm,
              industry: `${item.indutyLclasNm} > ${item.indutyMlsfcNm}`,
              totalStores: item.frcsCnt || 0,
              avgRevenue: item.avrgSlsAmt || 0,
              tier: "FREE",
              ftcRawData: {
                newStores: item.newFrcsRgsCnt,
                contractEnd: item.ctrtEndCnt,
                contractCancel: item.ctrtCncltnCnt,
                revenuePerArea: item.arUnitAvrgSlsAmt,
                year: item.yr,
              },
            },
          });
          totalSynced++;
        } catch (e: any) {
          errors++;
          if (errors <= 3) console.error(`upsert 에러:`, e.message);
        }
      }

      console.log(`진행: ${page}/${totalPages} (${totalSynced}건 완료, 에러 ${errors}건)`);
    } catch (e: any) {
      console.error(`Page ${page} fetch error:`, e.message);
    }
  }

  console.log(`\n통계 API 완료! 총 ${totalSynced}건 동기화, 에러 ${errors}건`);

  // === 1.5단계: 브랜드 목록 API (대표자명/사업자번호/주요상품/가맹사업개시일) ===
  console.log("\n=== 브랜드 목록 API 동기화 시작 ===");
  let brandListSynced = 0;
  let brandListErrors = 0;

  try {
    const BRAND_API_KEY = process.env.FTC_API_KEY || "";
    // 브랜드 목록 API: 최신 연도 자동 탐색
    const brandListYr = await findLatestYear(async (y) => {
      const params = new URLSearchParams({
        serviceKey: BRAND_API_KEY,
        pageNo: "1",
        numOfRows: "1",
        resultType: "json",
        jngBizCrtraYr: y,
      });
      const res = await fetch(
        `https://apis.data.go.kr/1130000/FftcBrandRlsInfo2_Service/getBrandinfo?${params}`
      );
      const data = await res.json();
      return data.resultCode === "00" ? data.totalCount : 0;
    });
    let blPage = 1;
    let blTotalPages = 1;

    do {
      const blParams = new URLSearchParams({
        serviceKey: BRAND_API_KEY,
        pageNo: String(blPage),
        numOfRows: "100",
        resultType: "json",
        jngBizCrtraYr: brandListYr,
      });
      const blRes = await fetch(
        `https://apis.data.go.kr/1130000/FftcBrandRlsInfo2_Service/getBrandinfo?${blParams}`
      );
      const blData = await blRes.json();

      if (blData.resultCode !== "00") {
        console.error(`브랜드 목록 API 에러:`, blData.resultMsg);
        break;
      }

      if (blPage === 1) {
        blTotalPages = Math.ceil(blData.totalCount / 100);
        console.log(`브랜드 목록 총 ${blData.totalCount}건, ${blTotalPages}페이지`);
      }

      for (const item of blData.items || []) {
        try {
          const ftcId = `${item.corpNm}_${item.brandNm}`.replace(/\s+/g, "");
          const existing = await prisma.franchiseBrand.findUnique({
            where: { ftcId },
            select: {
              id: true,
              representativeName: true,
              businessNumber: true,
              franchiseStartDate: true,
              majorProductName: true,
            },
          });

          if (!existing) continue;

          const updateData: Record<string, any> = {};

          // 대표자명: 기존 null일 때만
          if (!existing.representativeName && item.jnghdqrtrsRprsvNm) {
            updateData.representativeName = item.jnghdqrtrsRprsvNm.trim();
          }
          // 사업자번호: 기존 null/빈값일 때만
          if ((!existing.businessNumber || existing.businessNumber === "") && item.brno) {
            updateData.businessNumber = item.brno.trim();
          }
          // 가맹사업개시일: YYYYMMDD → "YYYY년 M월 D일"
          if (!existing.franchiseStartDate && item.jngBizStrtDate) {
            const d = item.jngBizStrtDate.trim();
            if (d.length === 8) {
              const y = parseInt(d.substring(0, 4), 10);
              const m = parseInt(d.substring(4, 6), 10);
              const day = parseInt(d.substring(6, 8), 10);
              updateData.franchiseStartDate = `${y}년 ${m}월 ${day}일`;
            }
          }
          // 주요상품명
          if (!existing.majorProductName && item.majrGdsNm) {
            updateData.majorProductName = item.majrGdsNm.trim();
          }

          if (Object.keys(updateData).length > 0) {
            try {
              await prisma.franchiseBrand.update({
                where: { id: existing.id },
                data: updateData,
              });
              brandListSynced++;
            } catch (ue: any) {
              // businessNumber unique constraint 충돌 시 → businessNumber 빼고 재시도
              if (ue.message?.includes("businessNumber") && updateData.businessNumber) {
                delete updateData.businessNumber;
                if (Object.keys(updateData).length > 0) {
                  await prisma.franchiseBrand.update({
                    where: { id: existing.id },
                    data: updateData,
                  });
                  brandListSynced++;
                }
              } else {
                throw ue;
              }
            }
          }
        } catch (e: any) {
          brandListErrors++;
          if (brandListErrors <= 3) console.error(`브랜드 목록 upsert 에러:`, e.message);
        }
      }

      console.log(`브랜드 목록 진행: ${blPage}/${blTotalPages} (${brandListSynced}건 업데이트, 에러 ${brandListErrors}건)`);
      blPage++;

      if (blPage <= blTotalPages) {
        await new Promise((r) => setTimeout(r, 300));
      }
    } while (blPage <= blTotalPages);
  } catch (e: any) {
    console.error(`브랜드 목록 API 전체 에러:`, e.message);
  }

  console.log(`\n브랜드 목록 API 완료! ${brandListSynced}건 업데이트, 에러 ${brandListErrors}건`);

  // === 2단계: 정보공개서 API 동기화 ===
  if (process.env.FTC_DISCLOSURE_API_KEY) {
    console.log("\n=== 정보공개서 API 동기화 시작 ===");

    const DISCLOSURE_BASE = "https://franchise.ftc.go.kr/api/search.do";
    const DISCLOSURE_KEY = process.env.FTC_DISCLOSURE_API_KEY;
    const HEADERS = {
      "Referer": "https://franchise.ftc.go.kr/",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    };

    let discMatched = 0;
    let discErrors = 0;

    // 정보공개서 목록 연도별 순회 (현재 연도부터 6년 전까지)
    const discCurrentYear = new Date().getFullYear();
    const discYears = Array.from({ length: 7 }, (_, i) => String(discCurrentYear - i));
    for (const discYr of discYears) {
      try {
        let discPage = 1;
        let discTotalPages = 1;

        do {
          const listUrl = `${DISCLOSURE_BASE}?type=list&yr=${discYr}&serviceKey=${encodeURIComponent(DISCLOSURE_KEY)}&pageNo=${discPage}&numOfRows=100&viewType=xml`;

          const res = await fetch(listUrl, { headers: HEADERS });
          const xml = await res.text();

          const totalMatch = xml.match(/<totalCount>(\d+)<\/totalCount>/);
          const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
          discTotalPages = Math.ceil(total / 100);

          // Parse items
          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let match;
          while ((match = itemRegex.exec(xml)) !== null) {
            const itemXml = match[1];
            const corpNm = (itemXml.match(/<corpNm>([^<]*)<\/corpNm>/) || [])[1]?.trim() || "";
            const brandNm = (itemXml.match(/<brandNm>([^<]*)<\/brandNm>/) || [])[1]?.trim() || "";
            const brno = (itemXml.match(/<brno>([^<]*)<\/brno>/) || [])[1]?.trim() || "";
            const jngIfrmpSn = (itemXml.match(/<jngIfrmpSn>([^<]*)<\/jngIfrmpSn>/) || [])[1]?.trim() || "";

            if (!corpNm || !brandNm) continue;

            try {
              const ftcId = `${corpNm}_${brandNm}`.replace(/\s+/g, "");
              const existing = await prisma.franchiseBrand.findUnique({
                where: { ftcId },
                select: { id: true, businessNumber: true, ftcDocId: true },
              });

              if (!existing) continue;

              const updateData: Record<string, any> = {};
              if (!existing.businessNumber || existing.businessNumber === "") {
                updateData.businessNumber = brno;
              }
              if (!existing.ftcDocId) {
                updateData.ftcDocId = jngIfrmpSn;
              }

              if (Object.keys(updateData).length > 0) {
                await prisma.franchiseBrand.update({
                  where: { id: existing.id },
                  data: updateData,
                });
                discMatched++;
              }
            } catch (e: any) {
              discErrors++;
            }
          }

          console.log(`정보공개서 yr=${discYr} page=${discPage}/${discTotalPages} (matched=${discMatched})`);
          discPage++;

          if (discPage <= discTotalPages) {
            await new Promise((r) => setTimeout(r, 500));
          }
        } while (discPage <= discTotalPages);
      } catch (e: any) {
        console.error(`정보공개서 yr=${discYr} error:`, e.message);
        discErrors++;
      }
    }

    // 본문 파싱: SEO 확장 데이터가 없는 브랜드 대상
    console.log("\n=== 정보공개서 본문 파싱 시작 ===");
    const brandsNeedContent = await prisma.franchiseBrand.findMany({
      where: {
        ftcDocId: { not: null },
        headquarterAddress: null,
      },
      select: { id: true, ftcDocId: true, brandName: true },
    });

    let contentParsed = 0;
    for (const brand of brandsNeedContent) {
      try {
        const parsed = await getDisclosureContent(brand.ftcDocId!);
        if (!parsed) continue;

        const contentUpdate: Record<string, any> = {};
        if (parsed.representativeName) {
          contentUpdate.representativeName = parsed.representativeName;
        }
        if (parsed.representativePhone) {
          contentUpdate.representativePhone = parsed.representativePhone;
        }
        // 가맹비 (천원→만원 변환, 상한선 검증)
        if (parsed.franchiseFee !== undefined) {
          const val = Math.round(parsed.franchiseFee / 10);
          if (val <= 10000) contentUpdate.franchiseFee = val;
        }
        if (parsed.educationFee !== undefined) {
          const val = Math.round(parsed.educationFee / 10);
          if (val <= 5000) contentUpdate.educationFee = val;
        }
        if (parsed.depositFee !== undefined) {
          const val = Math.round(parsed.depositFee / 10);
          if (val <= 10000) contentUpdate.depositFee = val;
        }
        if (parsed.headquarterAddress) contentUpdate.headquarterAddress = parsed.headquarterAddress;
        if (parsed.establishedDate) contentUpdate.establishedDate = parsed.establishedDate;
        if (parsed.franchiseStartDate) contentUpdate.franchiseStartDate = parsed.franchiseStartDate;
        if (parsed.contractPeriod) contentUpdate.contractPeriod = parsed.contractPeriod;
        if (parsed.interiorCost) contentUpdate.interiorCost = parsed.interiorCost;
        if (parsed.adPromotionFee) contentUpdate.adPromotionFee = parsed.adPromotionFee;
        if (parsed.territoryProtection !== undefined) contentUpdate.territoryProtection = parsed.territoryProtection;
        if (parsed.companyOwnedStores !== undefined) contentUpdate.companyOwnedStores = parsed.companyOwnedStores;
        if (parsed.financialSummary) contentUpdate.financialSummary = parsed.financialSummary;
        if (parsed.regionalStores) contentUpdate.regionalStores = parsed.regionalStores;

        if (Object.keys(contentUpdate).length > 0) {
          await prisma.franchiseBrand.update({
            where: { id: brand.id },
            data: contentUpdate,
          });
          contentParsed++;
        }

        await new Promise((r) => setTimeout(r, 1000));
      } catch (e: any) {
        discErrors++;
        if (discErrors <= 5) console.error(`본문 파싱 에러 (${brand.brandName}):`, e.message);
      }
    }

    console.log(`\n정보공개서 완료! matched=${discMatched}, contentParsed=${contentParsed}, errors=${discErrors}`);
  } else {
    console.log("\nFTC_DISCLOSURE_API_KEY 미설정 - 정보공개서 동기화 건너뜀");
  }

  await prisma.$disconnect();
}

function extractSpans(html: string): string[] {
  const regex = /<span[^>]*>([^<]*)<\/span>/g;
  const texts: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    const t = m[1].trim();
    if (t) texts.push(t);
  }
  return texts;
}

function extractFee(html: string, labels: string[]): number | undefined {
  for (const label of labels) {
    const idx = html.indexOf(`>${label}</span>`);
    if (idx < 0) continue;
    const trStart = html.lastIndexOf("<tr", idx);
    const trEnd = html.indexOf("</tr>", idx);
    if (trStart < 0 || trEnd < 0) continue;
    const spans = extractSpans(html.substring(trStart, trEnd));
    const li = spans.findIndex((s) => s.replace(/[\s\u00a0]/g, "").startsWith(label));
    if (li >= 0 && spans[li + 1]) {
      const cleaned = spans[li + 1].replace(/,/g, "").replace(/[\s\u00a0]/g, "");
      if (!cleaned || cleaned === "-" || cleaned === "없음") return undefined;
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? undefined : num;
    }
  }
  return undefined;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
