-- Migration: Update existing PENDING profiles to APPROVED
-- This script updates all candidate profiles with PENDING status to APPROVED
-- Run this after implementing the configurable default system

BEGIN;

-- Update all PENDING profiles to APPROVED
UPDATE "CandidateProfile" 
SET 
  status = 'APPROVED',
  "approvedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE status = 'PENDING';

-- Log the number of updated records
-- (This will be shown in the migration output)
SELECT COUNT(*) as updated_profiles 
FROM "CandidateProfile" 
WHERE status = 'APPROVED' AND "approvedAt" >= CURRENT_TIMESTAMP - INTERVAL '1 minute';

COMMIT; 