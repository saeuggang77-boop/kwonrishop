-- CreateEnum
CREATE TYPE "ReportPlanTier" AS ENUM ('BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "ReportPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'COMPLETED');

-- CreateTable
CREATE TABLE "report_plans" (
    "id" TEXT NOT NULL,
    "name" "ReportPlanTier" NOT NULL,
    "displayName" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "features" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "ReportPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_data" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "analysisResult" JSONB NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_plans_name_key" ON "report_plans"("name");

-- CreateIndex
CREATE INDEX "report_purchases_userId_idx" ON "report_purchases"("userId");

-- CreateIndex
CREATE INDEX "report_purchases_listingId_idx" ON "report_purchases"("listingId");

-- CreateIndex
CREATE INDEX "report_purchases_status_idx" ON "report_purchases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "report_data_purchaseId_key" ON "report_data"("purchaseId");

-- CreateIndex
CREATE INDEX "report_data_listingId_idx" ON "report_data"("listingId");

-- AddForeignKey
ALTER TABLE "report_purchases" ADD CONSTRAINT "report_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_purchases" ADD CONSTRAINT "report_purchases_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_purchases" ADD CONSTRAINT "report_purchases_planId_fkey" FOREIGN KEY ("planId") REFERENCES "report_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_data" ADD CONSTRAINT "report_data_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "report_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_data" ADD CONSTRAINT "report_data_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
