-- Migration: Fix existing employer and agency profiles for new business rules
-- This migration applies the new business rules to existing TRIAL users:
-- - EMPLOYER users: Set to 0 credits, 0 job post limit  
-- - AGENCY users: Set to 5 credits, 5 job post limit

-- Update EMPLOYER profiles to have 0 credits (new business rule: no free trial)
UPDATE "EmployerProfile" 
SET 
  "jobCredits" = 0,
  "jobPostLimit" = 0
WHERE "userId" IN (
  SELECT "id" FROM "User" WHERE "role" = 'EMPLOYER'
)
AND "subscriptionType" = 'TRIAL'
AND ("jobCredits" != 0 OR "jobPostLimit" != 0);

-- Update AGENCY profiles to have 5 credits (new business rule: 5 free credits)
UPDATE "EmployerProfile" 
SET 
  "jobCredits" = 5,
  "jobPostLimit" = 5
WHERE "userId" IN (
  SELECT "id" FROM "User" WHERE "role" = 'AGENCY'  
)
AND "subscriptionType" = 'TRIAL'
AND ("jobCredits" != 5 OR "jobPostLimit" != 5);
