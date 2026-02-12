-- CreateEnum
CREATE TYPE "ExpertCategory" AS ENUM ('LAW', 'INTERIOR', 'DEMOLITION', 'ACCOUNTING', 'REALESTATE');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'REPLIED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "experts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileImage" TEXT,
    "category" "ExpertCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT,
    "career" INTEGER NOT NULL,
    "description" TEXT,
    "specialties" JSONB NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "consultCount" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT,
    "email" TEXT,
    "region" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_inquiries" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_reviews" (
    "id" TEXT NOT NULL,
    "expertId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "experts_category_idx" ON "experts"("category");

-- CreateIndex
CREATE INDEX "experts_region_idx" ON "experts"("region");

-- CreateIndex
CREATE INDEX "experts_rating_idx" ON "experts"("rating");

-- CreateIndex
CREATE INDEX "expert_inquiries_expertId_idx" ON "expert_inquiries"("expertId");

-- CreateIndex
CREATE INDEX "expert_inquiries_userId_idx" ON "expert_inquiries"("userId");

-- CreateIndex
CREATE INDEX "expert_inquiries_status_idx" ON "expert_inquiries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "expert_reviews_inquiryId_key" ON "expert_reviews"("inquiryId");

-- CreateIndex
CREATE INDEX "expert_reviews_expertId_idx" ON "expert_reviews"("expertId");

-- AddForeignKey
ALTER TABLE "expert_inquiries" ADD CONSTRAINT "expert_inquiries_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "experts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_inquiries" ADD CONSTRAINT "expert_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_inquiries" ADD CONSTRAINT "expert_inquiries_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_reviews" ADD CONSTRAINT "expert_reviews_expertId_fkey" FOREIGN KEY ("expertId") REFERENCES "experts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_reviews" ADD CONSTRAINT "expert_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_reviews" ADD CONSTRAINT "expert_reviews_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "expert_inquiries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
