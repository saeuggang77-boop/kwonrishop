-- CreateTable
CREATE TABLE "market_prices" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "subRegion" TEXT NOT NULL,
    "businessType" "BusinessCategory" NOT NULL,
    "avgDeposit" BIGINT NOT NULL,
    "avgMonthlyRent" BIGINT NOT NULL,
    "avgKeyMoney" BIGINT NOT NULL,
    "avgMonthlySales" BIGINT NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "market_prices_region_subRegion_idx" ON "market_prices"("region", "subRegion");

-- CreateIndex
CREATE INDEX "market_prices_businessType_idx" ON "market_prices"("businessType");

-- CreateIndex
CREATE UNIQUE INDEX "market_prices_region_subRegion_businessType_key" ON "market_prices"("region", "subRegion", "businessType");
