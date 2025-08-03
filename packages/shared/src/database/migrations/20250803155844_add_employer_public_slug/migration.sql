-- AddEmployerPublicSlug
-- This migration adds the publicSlug field to EmployerProfile for custom job listing URLs

-- Add publicSlug column to EmployerProfile table
ALTER TABLE "EmployerProfile" ADD COLUMN "publicSlug" TEXT;

-- Add unique constraint for publicSlug
CREATE UNIQUE INDEX "EmployerProfile_publicSlug_key" ON "EmployerProfile"("publicSlug");

-- Add index for performance
CREATE INDEX "EmployerProfile_publicSlug_idx" ON "EmployerProfile"("publicSlug");