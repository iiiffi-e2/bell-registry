/*
  Warnings:

  - You are about to drop the column `payCurrency` on the `CandidateProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('TRIAL', 'SPOTLIGHT', 'BUNDLE', 'UNLIMITED', 'NETWORK');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "CandidateProfile" DROP COLUMN "payCurrency",
ADD COLUMN     "payType" TEXT DEFAULT 'Salary';

-- AlterTable
ALTER TABLE "EmployerProfile" ADD COLUMN     "hasNetworkAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobPostLimit" INTEGER DEFAULT 5,
ADD COLUMN     "jobsPostedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "subscriptionType" "SubscriptionType" NOT NULL DEFAULT 'TRIAL';

-- CreateTable
CREATE TABLE "BillingHistory" (
    "id" TEXT NOT NULL,
    "employerProfileId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "description" TEXT NOT NULL,
    "subscriptionType" "SubscriptionType" NOT NULL,
    "stripeSessionId" TEXT,
    "stripeInvoiceId" TEXT,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillingHistory_employerProfileId_idx" ON "BillingHistory"("employerProfileId");

-- CreateIndex
CREATE INDEX "BillingHistory_status_idx" ON "BillingHistory"("status");

-- CreateIndex
CREATE INDEX "BillingHistory_createdAt_idx" ON "BillingHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "BillingHistory" ADD CONSTRAINT "BillingHistory_employerProfileId_fkey" FOREIGN KEY ("employerProfileId") REFERENCES "EmployerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
