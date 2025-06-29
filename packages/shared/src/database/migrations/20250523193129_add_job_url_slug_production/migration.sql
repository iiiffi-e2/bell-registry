-- AlterTable
ALTER TABLE "Job" ADD COLUMN "urlSlug" TEXT;

-- Update existing records with a default value
UPDATE "Job" SET "urlSlug" = CONCAT(LOWER(REPLACE(title, ' ', '-')), '-', id) WHERE "urlSlug" IS NULL;

-- Make the column required
ALTER TABLE "Job" ALTER COLUMN "urlSlug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Job_urlSlug_key" ON "Job"("urlSlug");
