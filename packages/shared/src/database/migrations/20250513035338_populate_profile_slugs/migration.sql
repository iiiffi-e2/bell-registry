-- Update existing users with a profile slug
UPDATE "User"
SET "profileSlug" = LOWER(CONCAT(
  COALESCE("firstName", ''),
  CASE WHEN "firstName" IS NOT NULL AND "lastName" IS NOT NULL THEN '-' ELSE '' END,
  COALESCE("lastName", '')
))
WHERE "firstName" IS NOT NULL AND "lastName" IS NOT NULL AND "profileSlug" IS NULL; 