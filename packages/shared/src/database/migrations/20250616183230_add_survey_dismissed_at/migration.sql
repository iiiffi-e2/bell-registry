-- This is an empty migration.

-- Add survey dismissed at field to User table
ALTER TABLE "User" ADD COLUMN "surveyDismissedAt" TIMESTAMPTZ;