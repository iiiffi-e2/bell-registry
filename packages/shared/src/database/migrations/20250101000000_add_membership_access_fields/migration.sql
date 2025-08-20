-- Add membership access fields to User table
-- Migration: 20250101000000_add_membership_access_fields

-- First, create the enum type
CREATE TYPE "MembershipAccessType" AS ENUM ('BELL_REGISTRY_REFERRAL', 'PROFESSIONAL_REFERRAL', 'NEW_APPLICANT');

-- Add the new columns to the User table
ALTER TABLE "User" ADD COLUMN "membershipAccess" "MembershipAccessType" NOT NULL DEFAULT 'NEW_APPLICANT';
ALTER TABLE "User" ADD COLUMN "referralProfessionalName" TEXT;

-- Create an index on membershipAccess for better query performance
CREATE INDEX "User_membershipAccess_idx" ON "User"("membershipAccess");

-- Add a comment to document the new fields
COMMENT ON COLUMN "User"."membershipAccess" IS 'How the user gained access to the platform';
COMMENT ON COLUMN "User"."referralProfessionalName" IS 'Name of the professional who referred this user (if applicable)'; 