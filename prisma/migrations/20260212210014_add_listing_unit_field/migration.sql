-- Add unit (호수) field to listings
ALTER TABLE "listings" ADD COLUMN "unit" TEXT;

-- Deactivate BASIC premium ad plan
UPDATE "premium_plans" SET "isActive" = false WHERE "name" = 'BASIC';

-- Deactivate all subscription plans
UPDATE "subscription_plans" SET "isActive" = false;
