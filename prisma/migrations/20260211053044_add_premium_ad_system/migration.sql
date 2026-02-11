-- CreateEnum
CREATE TYPE "PremiumAdTier" AS ENUM ('BASIC', 'PREMIUM', 'VIP');

-- CreateEnum
CREATE TYPE "PremiumAdStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "premiumRank" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "premium_plans" (
    "id" TEXT NOT NULL,
    "name" "PremiumAdTier" NOT NULL,
    "displayName" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "features" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_listings" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "PremiumAdStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premium_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "premium_plans_name_key" ON "premium_plans"("name");

-- CreateIndex
CREATE INDEX "premium_listings_listingId_idx" ON "premium_listings"("listingId");

-- CreateIndex
CREATE INDEX "premium_listings_status_idx" ON "premium_listings"("status");

-- CreateIndex
CREATE INDEX "premium_listings_endDate_idx" ON "premium_listings"("endDate");

-- AddForeignKey
ALTER TABLE "premium_listings" ADD CONSTRAINT "premium_listings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_listings" ADD CONSTRAINT "premium_listings_planId_fkey" FOREIGN KEY ("planId") REFERENCES "premium_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
