-- Migration to add openToWork field to CandidateProfile table
-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD COLUMN "openToWork" BOOLEAN NOT NULL DEFAULT false; 