-- Migration: Update salary field from JSONB to TEXT in Job table
-- This field will store salary information as text to allow for flexible formats like ranges, hourly rates, etc.

ALTER TABLE "Job" ALTER COLUMN "salary" TYPE TEXT;
