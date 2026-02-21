-- AlterTable: 노출 순환 시스템용 필드 추가 (additive only — 기존 컬럼 삭제 없음)
ALTER TABLE "listings" ADD COLUMN "isRecommended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "premiumExposureOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN "recommendExposureOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "listings" ADD COLUMN "listingExposureOrder" INTEGER NOT NULL DEFAULT 0;

-- 데이터 마이그레이션: isPremium=true, premiumRank>=3 → premiumExposureOrder (createdAt 순)
UPDATE "listings" SET "premiumExposureOrder" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "listings"
  WHERE "isPremium" = true AND "premiumRank" >= 3 AND "status" = 'ACTIVE'
) sub
WHERE "listings".id = sub.id;

-- 데이터 마이그레이션: isPremium=true, premiumRank=2 → isRecommended + recommendExposureOrder
UPDATE "listings" SET "isRecommended" = true, "recommendExposureOrder" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "listings"
  WHERE "isPremium" = true AND "premiumRank" = 2 AND "status" = 'ACTIVE'
) sub
WHERE "listings".id = sub.id;

-- 데이터 마이그레이션: 일반 매물 → listingExposureOrder (createdAt 순)
UPDATE "listings" SET "listingExposureOrder" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "listings"
  WHERE "isPremium" = false AND "status" = 'ACTIVE'
) sub
WHERE "listings".id = sub.id;

-- 인덱스: 프리미엄 큐 순환 조회 최적화
CREATE INDEX "Listing_premium_exposure_idx"
  ON "listings" ("premiumExposureOrder")
  WHERE "isPremium" = true AND "premiumRank" >= 3;

-- 인덱스: 추천 큐 순환 조회 최적화
CREATE INDEX "Listing_recommend_exposure_idx"
  ON "listings" ("recommendExposureOrder")
  WHERE "isRecommended" = true;

-- 인덱스: 일반 매물 큐 순환 조회 최적화
CREATE INDEX "Listing_listing_exposure_idx"
  ON "listings" ("listingExposureOrder")
  WHERE "isPremium" = false AND "isRecommended" = false;
