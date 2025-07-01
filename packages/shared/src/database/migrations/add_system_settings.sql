-- Migration: Add SystemSettings table for admin-configurable settings
-- This allows admins to configure platform settings via the admin portal

BEGIN;

-- Create the SystemSettings table
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "settingKey" TEXT NOT NULL,
    "settingValue" TEXT NOT NULL,
    "description" TEXT,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on settingKey
CREATE UNIQUE INDEX "SystemSettings_settingKey_key" ON "SystemSettings"("settingKey");

-- Create indexes for performance
CREATE INDEX "SystemSettings_settingKey_idx" ON "SystemSettings"("settingKey");
CREATE INDEX "SystemSettings_updatedAt_idx" ON "SystemSettings"("updatedAt");

-- Add foreign key constraint to User table
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Insert default setting for profile status (set to APPROVED for existing behavior)
INSERT INTO "SystemSettings" ("id", "settingKey", "settingValue", "description", "updatedBy", "updatedAt", "createdAt")
SELECT 
    gen_random_uuid(),
    'DEFAULT_PROFILE_STATUS',
    'APPROVED',
    'Default status for new professional profiles',
    id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" 
WHERE role = 'ADMIN' 
LIMIT 1;

-- If no admin user exists, create with a placeholder (to be updated later)
INSERT INTO "SystemSettings" ("id", "settingKey", "settingValue", "description", "updatedBy", "updatedAt", "createdAt")
SELECT 
    gen_random_uuid(),
    'DEFAULT_PROFILE_STATUS',
    'APPROVED',
    'Default status for new professional profiles (set by system)',
    (SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "SystemSettings" WHERE "settingKey" = 'DEFAULT_PROFILE_STATUS'
) AND EXISTS (
    SELECT 1 FROM "User" WHERE role = 'ADMIN'
);

COMMIT; 