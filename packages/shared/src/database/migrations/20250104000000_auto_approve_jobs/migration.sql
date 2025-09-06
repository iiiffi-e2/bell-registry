-- Auto-approve all existing jobs that are currently pending
-- This migration ensures that jobs are not held up for admin approval

UPDATE "Job" 
SET 
  "adminStatus" = 'APPROVED',
  "approvedAt" = NOW()
WHERE 
  "adminStatus" = 'PENDING'
  AND "approvedAt" IS NULL;
