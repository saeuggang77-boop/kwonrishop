-- CreateEnum
CREATE TYPE "PartnerServiceType" AS ENUM ('INTERIOR', 'SIGNAGE', 'EQUIPMENT', 'CLEANING', 'ACCOUNTING', 'LEGAL', 'POS_SYSTEM', 'DELIVERY', 'MARKETING', 'CONSULTING', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnerTier" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'VIP');

-- CreateEnum
CREATE TYPE "AdCategoryScope" AS ENUM ('LISTING', 'FRANCHISE', 'PARTNER', 'COMMON');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('BUYER', 'SELLER', 'FRANCHISE', 'PARTNER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'BUYER';
COMMIT;

-- AlterTable
ALTER TABLE "AdProduct" ADD COLUMN     "categoryScope" "AdCategoryScope" NOT NULL DEFAULT 'LISTING';

-- AlterTable
ALTER TABLE "AdPurchase" ADD COLUMN     "partnerServiceId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roleSelectedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PartnerService" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "companyName" TEXT NOT NULL,
    "serviceType" "PartnerServiceType" NOT NULL,
    "description" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "website" TEXT,
    "addressRoad" TEXT,
    "addressJibun" TEXT,
    "addressDetail" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "serviceArea" TEXT[],
    "tier" "PartnerTier" NOT NULL DEFAULT 'FREE',
    "tierExpiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "bumpedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerImage" (
    "id" TEXT NOT NULL,
    "partnerServiceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ImageType" NOT NULL DEFAULT 'OTHER',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerService_userId_key" ON "PartnerService"("userId");

-- CreateIndex
CREATE INDEX "PartnerService_serviceType_idx" ON "PartnerService"("serviceType");

-- CreateIndex
CREATE INDEX "PartnerService_status_bumpedAt_idx" ON "PartnerService"("status", "bumpedAt");

-- CreateIndex
CREATE INDEX "PartnerService_status_createdAt_idx" ON "PartnerService"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerService_latitude_longitude_idx" ON "PartnerService"("latitude", "longitude");

-- AddForeignKey
ALTER TABLE "PartnerService" ADD CONSTRAINT "PartnerService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerImage" ADD CONSTRAINT "PartnerImage_partnerServiceId_fkey" FOREIGN KEY ("partnerServiceId") REFERENCES "PartnerService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdPurchase" ADD CONSTRAINT "AdPurchase_partnerServiceId_fkey" FOREIGN KEY ("partnerServiceId") REFERENCES "PartnerService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
