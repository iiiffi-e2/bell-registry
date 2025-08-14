-- AlterTable
ALTER TABLE "User" ADD COLUMN "profileSlug" TEXT;

-- Update existing users with a profile slug, ensuring uniqueness
UPDATE "User"
SET "profileSlug" = LOWER(CONCAT(
  COALESCE("firstName", 'user'),
  CASE WHEN "firstName" IS NOT NULL AND "lastName" IS NOT NULL THEN '-' ELSE '' END,
  COALESCE("lastName", ''),
  '-',
  "id"
))
WHERE "firstName" IS NOT NULL AND "lastName" IS NOT NULL;

-- Update users without names
UPDATE "User"
SET "profileSlug" = CONCAT('user-', "id")
WHERE "firstName" IS NULL OR "lastName" IS NULL;

-- CreateIndex (after ensuring all values are unique)
CREATE UNIQUE INDEX "User_profileSlug_key" ON "User"("profileSlug"); 