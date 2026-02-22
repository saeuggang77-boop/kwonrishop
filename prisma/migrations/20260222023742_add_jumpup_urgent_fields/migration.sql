-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "isJumpUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jumpUpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "jumpUpExposureOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "urgentExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "listings_isJumpUp_jumpUpExposureOrder_idx" ON "listings"("isJumpUp", "jumpUpExposureOrder");
