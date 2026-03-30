-- AlterTable: Add tier and tierExpiresAt to Equipment
ALTER TABLE "Equipment" ADD COLUMN "tier" "PartnerTier" NOT NULL DEFAULT 'FREE';
ALTER TABLE "Equipment" ADD COLUMN "tierExpiresAt" TIMESTAMP(3);
