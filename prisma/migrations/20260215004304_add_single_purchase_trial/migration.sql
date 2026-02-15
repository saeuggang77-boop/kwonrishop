-- CreateEnum
CREATE TYPE "PaidServiceType" AS ENUM ('JUMP_UP', 'URGENT_TAG', 'AUTO_REFRESH');

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'TRIAL';

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "ctaText" TEXT,
ADD COLUMN     "subtitle" TEXT;

-- AlterTable
ALTER TABLE "inquiries" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "listing_likes" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_comments" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paid_services" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "type" "PaidServiceType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "price" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paid_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosis_reports" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "fairPremiumBusiness" INTEGER NOT NULL,
    "fairPremiumFacility" INTEGER NOT NULL,
    "fairPremiumFloor" INTEGER NOT NULL,
    "fairPremiumTotal" INTEGER NOT NULL,
    "premiumGap" DOUBLE PRECISION NOT NULL,
    "premiumVerdict" TEXT NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,
    "avgProfitMargin" DOUBLE PRECISION NOT NULL,
    "roiMonths" INTEGER NOT NULL,
    "avgRoiMonths" INTEGER NOT NULL,
    "profitRating" INTEGER NOT NULL,
    "footTraffic" TEXT NOT NULL,
    "competitorDensity" TEXT NOT NULL,
    "stationDistance" TEXT NOT NULL,
    "locationRating" INTEGER NOT NULL,
    "leaseRemaining" TEXT NOT NULL,
    "buildingAge" TEXT NOT NULL,
    "premiumProtection" BOOLEAN NOT NULL,
    "riskRating" INTEGER NOT NULL,
    "overallGrade" TEXT NOT NULL,
    "overallComment" TEXT NOT NULL,
    "diagnosisNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosis_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_integrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "lastSynced" TIMESTAMP(3),
    "salesData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "single_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "single_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_likes_userId_idx" ON "listing_likes"("userId");

-- CreateIndex
CREATE INDEX "listing_likes_listingId_idx" ON "listing_likes"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_likes_listingId_userId_key" ON "listing_likes"("listingId", "userId");

-- CreateIndex
CREATE INDEX "listing_comments_listingId_createdAt_idx" ON "listing_comments"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "listing_comments_userId_idx" ON "listing_comments"("userId");

-- CreateIndex
CREATE INDEX "listing_comments_parentId_idx" ON "listing_comments"("parentId");

-- CreateIndex
CREATE INDEX "paid_services_listingId_type_status_idx" ON "paid_services"("listingId", "type", "status");

-- CreateIndex
CREATE INDEX "paid_services_userId_idx" ON "paid_services"("userId");

-- CreateIndex
CREATE INDEX "paid_services_endDate_idx" ON "paid_services"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosis_reports_listingId_key" ON "diagnosis_reports"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "diagnosis_reports_diagnosisNumber_key" ON "diagnosis_reports"("diagnosisNumber");

-- CreateIndex
CREATE INDEX "diagnosis_reports_listingId_idx" ON "diagnosis_reports"("listingId");

-- CreateIndex
CREATE INDEX "sales_integrations_listingId_idx" ON "sales_integrations"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_integrations_userId_provider_key" ON "sales_integrations"("userId", "provider");

-- CreateIndex
CREATE INDEX "single_purchases_userId_listingId_idx" ON "single_purchases"("userId", "listingId");

-- CreateIndex
CREATE INDEX "single_purchases_expiresAt_idx" ON "single_purchases"("expiresAt");

-- AddForeignKey
ALTER TABLE "listing_likes" ADD CONSTRAINT "listing_likes_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_likes" ADD CONSTRAINT "listing_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_comments" ADD CONSTRAINT "listing_comments_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_comments" ADD CONSTRAINT "listing_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_comments" ADD CONSTRAINT "listing_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "listing_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paid_services" ADD CONSTRAINT "paid_services_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paid_services" ADD CONSTRAINT "paid_services_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosis_reports" ADD CONSTRAINT "diagnosis_reports_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_integrations" ADD CONSTRAINT "sales_integrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_integrations" ADD CONSTRAINT "sales_integrations_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "single_purchases" ADD CONSTRAINT "single_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "single_purchases" ADD CONSTRAINT "single_purchases_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
