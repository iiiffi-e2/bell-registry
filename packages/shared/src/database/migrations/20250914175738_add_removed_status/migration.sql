-- AddRemovedStatus
-- Add REMOVED to ProfileStatus enum
ALTER TYPE "ProfileStatus" ADD VALUE 'REMOVED';

-- Add removed status fields to User table
ALTER TABLE "User" ADD COLUMN "isRemoved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "removedAt" TIMESTAMPTZ(6);
ALTER TABLE "User" ADD COLUMN "removedBy" TEXT;

-- Add indexes for the new fields
CREATE INDEX "User_isRemoved_idx" ON "User"("isRemoved");
CREATE INDEX "User_removedAt_idx" ON "User"("removedAt");

-- Add foreign key constraint for removedBy
ALTER TABLE "User" ADD CONSTRAINT "User_removedBy_fkey" FOREIGN KEY ("removedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
