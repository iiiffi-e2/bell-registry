/*
  Warnings:

  - You are about to drop the `TwoFactorVerification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TwoFactorVerification" DROP CONSTRAINT "TwoFactorVerification_userId_fkey";

-- DropTable
DROP TABLE "TwoFactorVerification";
