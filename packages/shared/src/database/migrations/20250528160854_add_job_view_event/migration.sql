/*
  Warnings:

  - Made the column `professionalRole` on table `Job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStatus" ADD VALUE 'INTERVIEWING';
ALTER TYPE "JobStatus" ADD VALUE 'CLOSED';

-- AlterTable
ALTER TABLE "Job" ALTER COLUMN "professionalRole" SET NOT NULL;

-- CreateTable
CREATE TABLE "JobViewEvent" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobViewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobViewEvent_jobId_idx" ON "JobViewEvent"("jobId");

-- CreateIndex
CREATE INDEX "JobViewEvent_userId_idx" ON "JobViewEvent"("userId");

-- AddForeignKey
ALTER TABLE "JobViewEvent" ADD CONSTRAINT "JobViewEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobViewEvent" ADD CONSTRAINT "JobViewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
