-- Fix preferredRole values to match dropdown options for demo users only
-- This ensures production demo profiles match development

-- Update William Chen and Marcus Bennett to 'Executive Protection'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Executive Protection'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" IN ('william.chen@gmail.com', 'marcus.bennett@gmail.com')
);

-- Update Victoria Hughes to 'Yacht Steward | Stewardess'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Yacht Steward | Stewardess'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'victoria.hughes@gmail.com'
);

-- Update David Foster to 'Head Gardener'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Head Gardener'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'david.foster@gmail.com'
);

-- Update Olivia Chang to 'House Manager'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'House Manager'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'olivia.chang@gmail.com'
);

-- Update Thomas Blackwood to 'Driver'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Driver'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'thomas.blackwood@gmail.com'
);

-- Update Grace Kim to 'Nanny | Educator'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Nanny | Educator'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'grace.kim@gmail.com'
);

-- Update Daniel Morgan to 'Estate IT Director'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Estate IT Director'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'daniel.morgan@gmail.com'
);

-- Update Sophia Petrov to 'Family Assistant'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Family Assistant'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'sophia.petrov@gmail.com'
);

-- Update Lucas Rivera to 'Yacht Captain'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Yacht Captain'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'lucas.rivera@gmail.com'
);

-- Update Emma Sinclair to 'Laundress'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Laundress'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'emma.sinclair@gmail.com'
);

-- Update Benjamin Crawford to 'Construction Manager'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Construction Manager'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'benjamin.crawford@gmail.com'
);

-- Update Natalie Windsor to 'Executive Assistant'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Executive Assistant'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'natalie.windsor@gmail.com'
);

-- Update Christopher Sterling to 'Yacht Engineer'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Yacht Engineer'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'christopher.sterling@gmail.com'
);

-- Update Amelia Fairfax to 'Private Teacher'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Private Teacher'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'amelia.fairfax@gmail.com'
);

-- Update Harrison Pierce to 'Property Manager'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Property Manager'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'harrison.pierce@gmail.com'
);

-- Update Charlotte Beaumont to 'Housekeeper'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Housekeeper'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'charlotte.beaumont@gmail.com'
);

-- Update Julian Ashworth to 'Houseman'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Houseman'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'julian.ashworth@gmail.com'
);

-- Update Penelope Rothschild to 'Office Manager'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Office Manager'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'penelope.rothschild@gmail.com'
);

-- Update Sebastian Voss to 'Landscape Director'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Landscape Director'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'sebastian.voss@gmail.com'
);

-- Update Gabrielle Laurent to 'Personal Chef'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Personal Chef'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'gabrielle.laurent@gmail.com'
);

-- Update Maxwell Thorne to 'Chief of Staff'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Chief of Staff'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'maxwell.thorne@gmail.com'
);

-- Update Marie DuBois to 'Executive Housekeeper'
UPDATE "CandidateProfile" 
SET "preferredRole" = 'Executive Housekeeper'
WHERE "userId" IN (
  SELECT id FROM "User" 
  WHERE "isDemo" = true 
  AND "email" = 'marie.dubois@gmail.com'
); 