/*
  Warnings:

  - You are about to drop the column `isAnonymous` on the `CandidateProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CandidateProfile" DROP COLUMN "isAnonymous";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
