-- AddExceptionalOpportunityField
-- This migration adds the exceptionalOpportunity field to Job for highlighting what makes a position special

-- Add exceptionalOpportunity column to Job table
ALTER TABLE "Job" ADD COLUMN "exceptionalOpportunity" TEXT;

-- Add index for performance on the new field
CREATE INDEX "Job_exceptionalOpportunity_idx" ON "Job"("exceptionalOpportunity"); 