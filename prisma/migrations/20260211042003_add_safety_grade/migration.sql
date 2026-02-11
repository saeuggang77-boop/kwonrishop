/*
  Warnings:

  - You are about to drop the column `avgKwonriPrice` on the `listing_comparisons` table. All the data in the column will be lost.
  - You are about to drop the column `bathroomCount` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `buildYear` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `expirationDate` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `maintenanceFee` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `propertyType` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `registryNumber` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `rightsCategory` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `rightsPriority` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `roomCount` on the `listings` table. All the data in the column will be lost.
  - Added the required column `businessCategory` to the `listings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeType` to the `listings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BusinessCategory" AS ENUM ('KOREAN_FOOD', 'CHINESE_FOOD', 'JAPANESE_FOOD', 'WESTERN_FOOD', 'CHICKEN', 'PIZZA', 'CAFE_BAKERY', 'BAR_PUB', 'BUNSIK', 'DELIVERY', 'OTHER_FOOD', 'SERVICE', 'RETAIL', 'ENTERTAINMENT', 'EDUCATION', 'ACCOMMODATION', 'OTHER');

-- CreateEnum
CREATE TYPE "StoreType" AS ENUM ('GENERAL_STORE', 'FRANCHISE', 'FOOD_STREET', 'OFFICE', 'COMPLEX_MALL', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetyGrade" AS ENUM ('A', 'B', 'C', 'D');

-- DropIndex
DROP INDEX "listings_propertyType_idx";

-- DropIndex
DROP INDEX "listings_rightsCategory_idx";

-- AlterTable
ALTER TABLE "listing_comparisons" DROP COLUMN "avgKwonriPrice",
ADD COLUMN     "avgPremiumFee" BIGINT;

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "bathroomCount",
DROP COLUMN "buildYear",
DROP COLUMN "expirationDate",
DROP COLUMN "maintenanceFee",
DROP COLUMN "propertyType",
DROP COLUMN "registryNumber",
DROP COLUMN "rightsCategory",
DROP COLUMN "rightsPriority",
DROP COLUMN "roomCount",
ADD COLUMN     "businessCategory" "BusinessCategory" NOT NULL,
ADD COLUMN     "businessSubtype" TEXT,
ADD COLUMN     "managementFee" BIGINT,
ADD COLUMN     "monthlyProfit" BIGINT,
ADD COLUMN     "monthlyRevenue" BIGINT,
ADD COLUMN     "operatingYears" INTEGER,
ADD COLUMN     "premiumFee" BIGINT,
ADD COLUMN     "safetyComment" TEXT,
ADD COLUMN     "safetyGrade" "SafetyGrade",
ADD COLUMN     "storeType" "StoreType" NOT NULL;

-- DropEnum
DROP TYPE "PropertyType";

-- DropEnum
DROP TYPE "RightsCategory";

-- CreateTable
CREATE TABLE "franchises" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "logoUrl" TEXT,
    "monthlyAvgSales" BIGINT,
    "startupCost" BIGINT,
    "storeCount" INTEGER,
    "dataYear" INTEGER,
    "description" TEXT,
    "isPromoting" BOOLEAN NOT NULL DEFAULT false,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "franchises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_posts" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "franchises_category_idx" ON "franchises"("category");

-- CreateIndex
CREATE INDEX "franchises_subcategory_idx" ON "franchises"("subcategory");

-- CreateIndex
CREATE INDEX "board_posts_category_idx" ON "board_posts"("category");

-- CreateIndex
CREATE INDEX "board_posts_createdAt_idx" ON "board_posts"("createdAt");

-- CreateIndex
CREATE INDEX "banners_sortOrder_idx" ON "banners"("sortOrder");

-- CreateIndex
CREATE INDEX "listings_businessCategory_idx" ON "listings"("businessCategory");

-- CreateIndex
CREATE INDEX "listings_storeType_idx" ON "listings"("storeType");
