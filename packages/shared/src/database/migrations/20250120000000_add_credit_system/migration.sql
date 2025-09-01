-- Add credit system and enhanced subscription management
ALTER TABLE "EmployerProfile" ADD COLUMN "jobCredits" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EmployerProfile" ADD COLUMN "networkAccessEndDate" TIMESTAMP(3);
ALTER TABLE "EmployerProfile" ADD COLUMN "unlimitedPostingEndDate" TIMESTAMP(3);
ALTER TABLE "EmployerProfile" ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "EmployerProfile" ADD COLUMN "renewalPeriod" TEXT; -- 'QUARTERLY' or 'ANNUAL' for Network Access

-- Add listing close date field to Job table
ALTER TABLE "Job" ADD COLUMN "listingCloseDate" TIMESTAMP(3);

-- Update SubscriptionType enum to include quarterly Network Access
ALTER TYPE "SubscriptionType" ADD VALUE 'NETWORK_QUARTERLY';

-- Add index for new fields
CREATE INDEX "EmployerProfile_jobCredits_idx" ON "EmployerProfile"("jobCredits");
CREATE INDEX "EmployerProfile_networkAccessEndDate_idx" ON "EmployerProfile"("networkAccessEndDate");
CREATE INDEX "EmployerProfile_unlimitedPostingEndDate_idx" ON "EmployerProfile"("unlimitedPostingEndDate");
CREATE INDEX "Job_listingCloseDate_idx" ON "Job"("listingCloseDate");
