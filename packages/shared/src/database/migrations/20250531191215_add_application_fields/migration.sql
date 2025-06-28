/*
  Warnings:

  - A unique constraint covering the columns `[jobId,candidateId]` on the table `JobApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "coverLetterUrl" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "resumeUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_jobId_candidateId_key" ON "JobApplication"("jobId", "candidateId");
