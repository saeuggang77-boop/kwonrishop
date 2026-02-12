-- Add new values to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'AGENT';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FRANCHISE';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EXPERT';

-- Add expertCategory column to users
ALTER TABLE "users" ADD COLUMN "expertCategory" TEXT;
