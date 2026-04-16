/**
 * ⚠️ 프로덕션 DB의 ListingImage.url을 업종별 loremflickr URL로 일괄 업데이트
 * 실행 전 반드시 사용자 승인 필요.
 *
 * 사용: npx tsx scripts/update-listing-images.ts
 *
 * - ListingImage.url 필드만 수정 (레코드 삭제/추가 없음)
 * - 각 매물의 subCategory 이름 기반으로 업종 관련 이미지로 교체
 * - 에러 발생 시 해당 항목만 건너뛰고 계속 진행
 */

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { buildListingImageUrl, getImageKeyword } from "../src/lib/listing-image-keywords.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("⚠️  프로덕션 DB ListingImage URL 업데이트 시작");
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.slice(0, 40)}...`);
  console.log("");

  const listings = await prisma.listing.findMany({
    include: {
      images: true,
      subCategory: true,
      category: true,
    },
  });

  console.log(`총 매물 수: ${listings.length}개`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const listing of listings) {
    const subCategoryName = listing.subCategory?.name ?? null;
    const mainCategoryName = listing.category?.name ?? null;
    const storeName = (listing as { storeName?: string | null }).storeName ?? null;

    for (const image of listing.images) {
      const newUrl = buildListingImageUrl(
        subCategoryName,
        `listing-${listing.id}-${image.id}`,
        image.type,
        mainCategoryName,
        storeName,
      );

      try {
        await prisma.listingImage.update({
          where: { id: image.id },
          data: { url: newUrl },
        });
        updatedCount++;
      } catch (err) {
        console.error(
          `  ✗ listingImage ${image.id} 업데이트 실패:`,
          (err as Error).message
        );
        errorCount++;
      }
    }

    const resolvedKeyword = getImageKeyword(subCategoryName, mainCategoryName, storeName);
    const categoryLabel = subCategoryName ?? mainCategoryName ?? `name→${resolvedKeyword}`;
    console.log(
      `  ✓ [${categoryLabel}] ${listing.id.slice(-6)} — ${listing.images.length}장 처리`
    );
  }

  console.log("");
  console.log(`완료: ${updatedCount}개 업데이트, ${errorCount}개 실패`);
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
