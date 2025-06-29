-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMPTZ(6),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_isDeleted_idx" ON "User"("isDeleted");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");
