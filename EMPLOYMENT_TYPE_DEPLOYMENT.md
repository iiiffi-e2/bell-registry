> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Employment Type Feature - Production Deployment Guide

## Overview
This feature adds an employment type preference dropdown to professional profiles, allowing professionals to specify their preferred work arrangement (Full-time, Part-time, Event, Contract, or Seasonal).

## Database Changes

### Migration Required
A new migration has been created: `20250610213930_add_employment_type_to_candidate_profile`

**Migration SQL:**
```sql
-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN "employmentType" TEXT;
```

### Production Deployment Steps

1. **Apply the migration to production database:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Verify the migration:**
   ```bash
   npx prisma db pull
   ```

## Updated Components

### Database Schema
- Added `employmentType` field to `CandidateProfile` model (optional TEXT field)

### UI Components
- Updated profile form with employment type dropdown
- Added employment type display to profile sidebar (all profile views)
- Updated TypeScript interfaces across all profile components

### API Endpoints Updated
- `/api/profile/route.ts` - handles employment type in profile updates
- `/api/professionals/route.ts` - includes employment type in professional listings
- `/api/professionals/[slug]/route.ts` - includes employment type in individual profiles
- `/api/dashboard/candidates/[id]/route.ts` - includes employment type in employer candidate views

### Seed Data
- Updated `prisma/seed.ts` to include varied employment types for demo profiles
- Demo professionals now have realistic employment type preferences based on their roles

## Employment Type Options
- **Full-time** - Traditional full-time positions
- **Part-time** - Reduced hour positions
- **Event** - Event-based or project work
- **Contract** - Contract/freelance work
- **Seasonal** - Seasonal positions

## Feature Locations

### For Professionals:
- **Profile Form**: Employment type dropdown in "Professional Details" section
- **Profile Display**: Shows in sidebar between "Years of Experience" and "Availability"

### For Employers:
- **Candidate Profiles**: Employment type preference visible in sidebar when viewing candidates
- **Public Profiles**: Employment type shown when browsing professional profiles

## Technical Notes

### TypeScript
- All profile interfaces updated to include `employmentType: string | null`
- Backwards compatible - existing profiles without employment type will show as null

### Data Migration
- No data migration required for existing profiles
- Field is optional and defaults to null
- Existing profiles can be updated through the profile edit form

## Testing Checklist

After deployment, verify:
- [ ] Professional can select employment type in profile form
- [ ] Employment type saves correctly
- [ ] Employment type displays in profile sidebar
- [ ] Employment type visible to employers viewing candidates
- [ ] No errors in profile loading/saving
- [ ] Demo data includes employment types

## Rollback Plan

If issues arise, the migration can be rolled back:
```sql
ALTER TABLE "CandidateProfile" DROP COLUMN "employmentType";
```

However, this will result in data loss for any employment types that have been set.

## Notes
- Feature is fully backwards compatible
- No breaking changes to existing functionality
- Optional field - existing workflows continue to work unchanged 