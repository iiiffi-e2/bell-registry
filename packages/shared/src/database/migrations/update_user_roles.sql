-- First, update existing users from CANDIDATE to PROFESSIONAL
UPDATE "User" SET role = 'PROFESSIONAL' WHERE role = 'CANDIDATE';

-- Then modify the enum
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM ('PROFESSIONAL', 'EMPLOYER', 'AGENCY', 'ADMIN');

-- Convert the column to use the new enum
ALTER TABLE "User" 
  ALTER COLUMN role TYPE "UserRole" 
  USING (
    CASE role::text
      WHEN 'CANDIDATE' THEN 'PROFESSIONAL'
      ELSE role::text
    END
  )::"UserRole";

-- Drop the old enum
DROP TYPE "UserRole_old"; 