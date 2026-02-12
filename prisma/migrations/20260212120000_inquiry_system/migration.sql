-- AlterTable: inquiries - add senderName, senderPhone, status, updatedAt
ALTER TABLE "inquiries" ADD COLUMN "senderName" TEXT;
ALTER TABLE "inquiries" ADD COLUMN "senderPhone" TEXT;
ALTER TABLE "inquiries" ADD COLUMN "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "inquiries" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- AlterTable: listings - add isPhonePublic
ALTER TABLE "listings" ADD COLUMN "isPhonePublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: users - add smsNotificationEnabled
ALTER TABLE "users" ADD COLUMN "smsNotificationEnabled" BOOLEAN NOT NULL DEFAULT true;
