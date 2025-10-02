> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Production Migration Guide - New Business Rules

## Overview

This guide explains how to apply the new business rules to existing agencies and employers in production.

## What This Migration Does

### For Existing AGENCY Users:
- ✅ Sets `jobCredits` to 5 (if not already 5)
- ✅ Sets `jobPostLimit` to 5 (if not already 5)
- ✅ Only affects agencies with TRIAL subscription type
- ✅ Gives them their 5 free job posts retroactively

### For Existing EMPLOYER Users:
- ✅ Sets `jobCredits` to 0 (if not already 0)
- ✅ Sets `jobPostLimit` to 0 (if not already 0) 
- ✅ Only affects employers with TRIAL subscription type
- ✅ Removes any free trial benefits

## Safety Features

- **Selective Updates**: Only updates profiles that actually need changes
- **Dry Run Info**: Shows how many profiles will be affected before making changes
- **TRIAL Only**: Only affects users with TRIAL subscription (not paid subscribers)
- **Idempotent**: Safe to run multiple times
- **No Data Loss**: Preserves all existing subscription and billing data

## How to Run in Production

### Option 1: Using the Migration Script (Recommended)

1. **SSH into your production server**
2. **Navigate to your app directory**
3. **Run the migration script:**
   ```bash
   cd /path/to/your/app
   npx ts-node scripts/fix-existing-employer-profiles.ts
   ```

### Option 2: Direct Database Query (Advanced)

If you prefer to run SQL directly:

```sql
-- Update EMPLOYER profiles to have 0 credits
UPDATE "EmployerProfile" 
SET 
  "jobCredits" = 0,
  "jobPostLimit" = 0
WHERE "userId" IN (
  SELECT "id" FROM "User" WHERE "role" = 'EMPLOYER'
)
AND "subscriptionType" = 'TRIAL'
AND ("jobCredits" != 0 OR "jobPostLimit" != 0);

-- Update AGENCY profiles to have 5 credits  
UPDATE "EmployerProfile" 
SET 
  "jobCredits" = 5,
  "jobPostLimit" = 5
WHERE "userId" IN (
  SELECT "id" FROM "User" WHERE "role" = 'AGENCY'  
)
AND "subscriptionType" = 'TRIAL'
AND ("jobCredits" != 5 OR "jobPostLimit" != 5);
```

### Option 3: API Endpoint (Individual Users)

For individual fixes, you can create a temporary admin endpoint:

```typescript
// Create: /api/admin/fix-user-profile/route.ts
// Allow admins to fix individual user profiles
```

## Expected Output

When you run the migration, you should see:

```
🔧 Fixing existing employer and agency profiles for new business rules...

⚠️  This script will update existing TRIAL profiles to match new business rules:
   - EMPLOYER profiles: Set to 0 credits, 0 limit
   - AGENCY profiles: Set to 5 credits, 5 limit
   - Only affects profiles that need updating

📊 Profiles that will be updated:
   - 3 EMPLOYER profiles
   - 2 AGENCY profiles

🚀 Proceeding with updates...

📋 Step 1: Updating EMPLOYER profiles...
   ✅ Updated 3 employer profiles

📋 Step 2: Updating AGENCY profiles...
   ✅ Updated 2 agency profiles

📊 Verification - Current profile status:

👔 EMPLOYER profiles (sample):
   - John Smith: 0 credits, limit: 0
   - Jane Doe: 0 credits, limit: 0

🏢 AGENCY profiles (sample):  
   - ABC Agency: 5 credits, limit: 5
   - XYZ Recruiting: 5 credits, limit: 5

✅ Migration completed successfully!

📝 Summary:
   - Fixed 3 employer profiles (0 credits, 0 limit)
   - Fixed 2 agency profiles (5 credits, 5 limit)
```

## Verification Steps

After running the migration:

1. **Check Agency Dashboards:**
   - Should show welcome message with 5 free credits
   - Should be able to post jobs without upgrade prompts

2. **Check Employer Dashboards:**
   - Should show welcoming "purchase credits" message
   - Should require credit purchase to post jobs

3. **Verify Database:**
   ```sql
   SELECT u.role, ep."jobCredits", ep."jobPostLimit", ep."subscriptionType"
   FROM "User" u 
   JOIN "EmployerProfile" ep ON u.id = ep."userId"
   WHERE u.role IN ('EMPLOYER', 'AGENCY')
   AND ep."subscriptionType" = 'TRIAL';
   ```

## Rollback Plan (If Needed)

If something goes wrong, you can rollback by:

```sql
-- Rollback to old behavior (everyone gets 5 credits)
UPDATE "EmployerProfile" 
SET 
  "jobCredits" = 5,
  "jobPostLimit" = 5
WHERE "subscriptionType" = 'TRIAL';
```

## Post-Migration

After successful migration:
- ✅ Remove the migration script
- ✅ Remove any debug code
- ✅ Monitor user feedback
- ✅ Update documentation

## Timeline

- **Estimated Runtime**: < 1 minute for most databases
- **Downtime**: None (updates are atomic)
- **Best Time to Run**: During low traffic hours as a precaution
