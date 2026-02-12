-- DropForeignKey
ALTER TABLE "report_data" DROP CONSTRAINT "report_data_listingId_fkey";

-- DropForeignKey
ALTER TABLE "report_purchases" DROP CONSTRAINT "report_purchases_listingId_fkey";

-- AlterTable
ALTER TABLE "report_data" ALTER COLUMN "listingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "report_purchases" ALTER COLUMN "listingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "report_purchases" ADD CONSTRAINT "report_purchases_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_data" ADD CONSTRAINT "report_data_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
