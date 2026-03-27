-- CreateEnum
CREATE TYPE "EquipmentCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR');

-- CreateEnum
CREATE TYPE "TradeMethod" AS ENUM ('DIRECT', 'DELIVERY', 'BOTH');

-- CreateEnum
CREATE TYPE "EquipmentCategory" AS ENUM ('KITCHEN', 'REFRIGERATION', 'TABLE_CHAIR', 'DISPLAY', 'COOKING_TOOL', 'POS_ELECTRONIC', 'SIGN', 'INTERIOR', 'OTHER');

-- AlterEnum
ALTER TYPE "AdCategoryScope" ADD VALUE 'EQUIPMENT';

-- AlterTable
ALTER TABLE "AdPurchase" ADD COLUMN     "equipmentId" TEXT;

-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "equipmentId" TEXT,
ALTER COLUMN "listingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "EquipmentCategory" NOT NULL,
    "condition" "EquipmentCondition" NOT NULL,
    "price" INTEGER NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "tradeMethod" "TradeMethod" NOT NULL DEFAULT 'DIRECT',
    "addressRoad" TEXT,
    "addressJibun" TEXT,
    "addressDetail" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "brand" TEXT,
    "modelName" TEXT,
    "purchaseYear" INTEGER,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "bumpedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentImage" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EquipmentFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Equipment_category_idx" ON "Equipment"("category");

-- CreateIndex
CREATE INDEX "Equipment_status_bumpedAt_idx" ON "Equipment"("status", "bumpedAt");

-- CreateIndex
CREATE INDEX "Equipment_status_createdAt_idx" ON "Equipment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Equipment_userId_idx" ON "Equipment"("userId");

-- CreateIndex
CREATE INDEX "Equipment_latitude_longitude_idx" ON "Equipment"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "EquipmentImage_equipmentId_idx" ON "EquipmentImage"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentFavorite_userId_equipmentId_key" ON "EquipmentFavorite"("userId", "equipmentId");

-- AddForeignKey
ALTER TABLE "AdPurchase" ADD CONSTRAINT "AdPurchase_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentImage" ADD CONSTRAINT "EquipmentImage_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentFavorite" ADD CONSTRAINT "EquipmentFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentFavorite" ADD CONSTRAINT "EquipmentFavorite_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
