> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Production Deployment Guide - Account Deletion Feature

## Overview

This guide covers the steps needed to safely deploy the account deletion feature to production.

## Pre-Deployment Checklist

### ✅ Database Migration
A proper migration file has been created:
- **File**: `prisma/migrations/20250609202748_add_account_deletion_fields/migration.sql`
- **Changes**: Adds `isDeleted` and `deletedAt` fields with indexes

### ✅ Environment Variables
Ensure these are set in your production environment:
```bash
CRON_SECRET=your-secure-random-string-here
```

### ✅ Code Review
Review these key files:
- Database schema changes in `prisma/schema.prisma`
- API endpoint security in `src/app/api/settings/delete-account/route.ts`
- Cron job implementation in `src/app/api/cron/purge-deleted-accounts/route.ts`
- Authentication updates in `src/lib/auth.ts`

## Deployment Steps

### 1. Deploy Code Changes
Deploy your code to production using your normal deployment process (Vercel, etc.)

### 2. Apply Database Migration
```bash
# Run this in your production environment
npx prisma migrate deploy
```

This will:
- Add `isDeleted` boolean field (default: false)
- Add `deletedAt` timestamp field (nullable)
- Create database indexes for efficient querying

### 3. Verify Migration
```sql
-- Check if fields were added correctly
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('isDeleted', 'deletedAt');

-- Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'User' 
AND indexname LIKE '%Deleted%';
```

### 4. Environment Variables
Set in your production environment:
```bash
CRON_SECRET=generate-a-secure-random-string
```

**Important**: Use a cryptographically secure random string for the CRON_SECRET.

### 5. Verify Cron Job
After deployment, check that the cron job is scheduled correctly:
- **Schedule**: Daily at 2:00 AM UTC (`0 2 * * *`)
- **Endpoint**: `/api/cron/purge-deleted-accounts`
- **Method**: POST
- **Authentication**: Bearer token with CRON_SECRET

## Post-Deployment Testing

### 1. Test Account Deletion Flow
1. Create a test account in production
2. Navigate to Settings → Delete Account
3. Verify the modal appears correctly
4. Test the confirmation flow
5. Verify account is marked as deleted (not purged)
6. Verify user is signed out and cannot sign back in

### 2. Test API Endpoints
```bash
# Test the delete endpoint (requires authentication)
curl -X DELETE https://your-domain.com/api/settings/delete-account \
  -H "Cookie: your-session-cookie"

# Verify cron endpoint is protected
curl -X POST https://your-domain.com/api/cron/purge-deleted-accounts
# Should return 401 Unauthorized

# Test with correct secret
curl -X POST https://your-domain.com/api/cron/purge-deleted-accounts \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Database Verification
```sql
-- Check for deleted accounts
SELECT id, email, "isDeleted", "deletedAt", "createdAt"
FROM "User" 
WHERE "isDeleted" = true;

-- Verify no data corruption
SELECT COUNT(*) as total_users,
       COUNT(CASE WHEN "isDeleted" = true THEN 1 END) as deleted_users,
       COUNT(CASE WHEN "isDeleted" = false THEN 1 END) as active_users
FROM "User";
```

## Monitoring & Alerting

### 1. Cron Job Monitoring
Monitor these aspects of the purge job:
- **Execution Time**: Should run daily at 2:00 AM UTC
- **Success Rate**: Monitor for failures
- **Accounts Purged**: Track the number of accounts being purged
- **Execution Duration**: Should complete within reasonable time

### 2. Application Metrics
Track these metrics:
- **Account Deletion Rate**: Number of accounts deleted per day/week
- **Purge Effectiveness**: Accounts successfully purged vs. failed
- **API Errors**: Monitor delete endpoint for errors

### 3. Database Health
Monitor:
- **Storage Usage**: Ensure purged data is actually being removed
- **Index Performance**: Verify new indexes are being used efficiently
- **Query Performance**: Monitor performance of deletion-related queries

## Logs to Monitor

Look for these log patterns:
- `[DELETE_ACCOUNT]` - Account deletion attempts
- `[PURGE_DELETED_ACCOUNTS]` - Purge job execution
- Authentication failures for deleted accounts

## Rollback Plan

If issues arise, you can rollback safely:

### 1. Code Rollback
Deploy the previous version of your application

### 2. Database Rollback (if needed)
```sql
-- Remove the new fields (CAUTION: This will lose deletion data)
ALTER TABLE "User" DROP COLUMN "isDeleted";
ALTER TABLE "User" DROP COLUMN "deletedAt";

-- Remove indexes
DROP INDEX "User_isDeleted_idx";
DROP INDEX "User_deletedAt_idx";
```

**⚠️ Warning**: Database rollback will lose all account deletion data and allow previously deleted accounts to sign in again.

## Security Considerations

### 1. CRON_SECRET
- Use a cryptographically secure random string
- Rotate periodically
- Never commit to version control
- Store securely in your environment

### 2. Data Clearing
The system immediately clears sensitive data when accounts are deleted:
- Email changed to `deleted_{userId}@deleted.com`
- Personal information cleared
- Authentication tokens invalidated

### 3. Authentication
- Deleted accounts cannot sign in
- Active sessions are invalidated
- JWT tokens are checked on every request

## Compliance Notes

### GDPR Compliance
This implementation supports GDPR requirements:
- ✅ Right to deletion (Article 17)
- ✅ Data processing transparency
- ✅ Audit trail for compliance verification
- ✅ Reasonable time frame for deletion (30 days)

### Data Retention
- **Immediate**: Sensitive personal data cleared
- **30 days**: Complete account and data purging
- **Audit logs**: Maintained for compliance verification

## Support Contacts

If you encounter issues during deployment:
1. Check application logs for error details
2. Verify environment variables are set correctly
3. Ensure database migration completed successfully
4. Review the comprehensive documentation in `ACCOUNT_DELETION_IMPLEMENTATION.md`

---

**Remember**: Always test thoroughly in a staging environment before deploying to production! 