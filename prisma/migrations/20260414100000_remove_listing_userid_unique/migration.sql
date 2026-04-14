-- Allow multiple Listings per User (one active at a time, enforced in app code).
-- DELETED listings remain in DB to preserve Review/AdPurchase/SellerReport history.

DROP INDEX "Listing_userId_key";

CREATE INDEX "Listing_userId_status_idx" ON "Listing"("userId", "status");
