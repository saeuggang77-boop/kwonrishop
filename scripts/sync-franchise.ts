import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

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

async function main() {
  const yr = "2024";
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

  console.log(`\n완료! 총 ${totalSynced}건 동기화, 에러 ${errors}건`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
