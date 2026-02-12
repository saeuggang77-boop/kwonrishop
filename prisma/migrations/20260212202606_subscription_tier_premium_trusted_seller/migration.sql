-- Rename EXPERT to PREMIUM in SubscriptionTier enum
-- This automatically updates all existing rows using EXPERT
ALTER TYPE "SubscriptionTier" RENAME VALUE 'EXPERT' TO 'PREMIUM';

-- Add isTrustedSeller column to users table
ALTER TABLE "users" ADD COLUMN "isTrustedSeller" BOOLEAN NOT NULL DEFAULT false;
