-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastLoginAt" TIMESTAMPTZ(6),
ADD COLUMN     "lastProfileReminderSentAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "User_lastLoginAt_idx" ON "User"("lastLoginAt");

-- CreateIndex
CREATE INDEX "User_lastProfileReminderSentAt_idx" ON "User"("lastProfileReminderSentAt");
