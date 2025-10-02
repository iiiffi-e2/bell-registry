> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Account Deletion Implementation

## Overview

A comprehensive account deletion system has been implemented that allows users to safely delete their accounts from the dashboard settings page. The system follows a two-phase approach: immediate soft deletion with data clearing, followed by permanent deletion after 30 days.

## Features Implemented

### 1. Database Schema Updates

**File:** `prisma/schema.prisma`

Added new fields to the User model:
- `isDeleted: Boolean @default(false)` - Flag to mark deleted accounts
- `deletedAt: DateTime?` - Timestamp when account was deleted
- Database indexes for efficient querying on both fields

**Migration:** 
- Development: Already applied via `npx prisma migrate dev`
- Production: Run `npx prisma migrate deploy` to apply migration

### 2. Delete Account Modal Component

**File:** `src/components/modals/DeleteAccountModal.tsx`

Features:
- ⚠️ Clear warning about permanent deletion
- 📝 List of what will be deleted (profile, applications, messages, etc.)
- 🔒 Requires typing "DELETE" to confirm
- ❌ "Nevermind" button to cancel
- 🚫 Automatic sign-out and redirect after deletion

### 3. Settings Page Integration

**File:** `src/app/dashboard/settings/page.tsx`

Added:
- New "Delete Account" section with warnings
- Integration with existing email/password change functionality
- State management for the delete modal

### 4. API Endpoint for Account Deletion

**File:** `src/app/api/settings/delete-account/route.ts`

Functionality:
- 🔐 Authentication verification
- 🏷️ Marks account as deleted (`isDeleted: true`)
- 🧹 Immediately clears sensitive data:
  - Email changed to `deleted_{userId}@deleted.com`
  - Personal information (firstName, lastName, phoneNumber)
  - Profile image and slug
  - Password and reset tokens
- 📝 Comprehensive logging for monitoring

### 5. Background Job for Data Purging

**File:** `src/app/api/cron/purge-deleted-accounts/route.ts`

Features:
- 🕐 Runs daily at 2:00 AM UTC via Vercel cron
- 🗑️ Permanently deletes accounts deleted more than 30 days ago
- 🔒 Protected by `CRON_SECRET` environment variable
- 🔄 CASCADE deletion removes all related data automatically
- 📊 Detailed logging and error handling
- 📈 Returns count of purged accounts

### 6. Development Test Endpoint

**File:** `src/app/api/test-purge-deleted-accounts/route.ts`

Features:
- 🧪 Development-only endpoint for testing
- 📋 Shows what would be purged without actually deleting
- 📊 Returns detailed information about accounts to be purged
- 📅 Calculates days since deletion

### 7. Vercel Cron Configuration

**File:** `vercel.json`

Added:
```json
{
  "path": "/api/cron/purge-deleted-accounts",
  "schedule": "0 2 * * *"
}
```

### 8. Authentication Protection

**File:** `src/lib/auth.ts`

Enhanced security:
- 🚫 Prevents deleted accounts from signing in
- 🔄 JWT callback checks for deleted accounts on every request
- 🚪 Automatic session invalidation for deleted accounts
- 🔐 Works with both credentials and Google OAuth

## Security Features

1. **Immediate Data Clearing**: Sensitive information is cleared immediately upon deletion
2. **Grace Period**: 30-day period before permanent deletion
3. **Authentication Blocks**: Deleted accounts cannot sign in
4. **Session Invalidation**: Active sessions are terminated
5. **Confirmation Required**: Users must type "DELETE" to confirm
6. **Audit Trail**: Comprehensive logging for monitoring

## User Experience Flow

1. User navigates to **Dashboard → Settings**
2. Scrolls to **"Delete Account"** section
3. Clicks **"Delete My Account"** button
4. Modal appears with warnings and confirmation
5. User must type **"DELETE"** in confirmation field
6. Can click **"Nevermind"** to cancel or **"Delete Account"** to proceed
7. Account is marked as deleted and user is signed out
8. Redirect to home page with deletion confirmation

## Data Retention & Compliance

- **Immediate**: Sensitive personal data cleared
- **30 days**: Account and all related data permanently deleted
- **Compliance**: Follows GDPR "right to be forgotten" principles
- **Audit**: Complete logging for compliance verification

## Environment Variables Required

```bash
# For production cron job security
CRON_SECRET=your-secure-random-string
```

## API Endpoints

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/settings/delete-account` | DELETE | Delete user account | Required |
| `/api/cron/purge-deleted-accounts` | POST | Purge old deleted accounts | CRON_SECRET |
| `/api/test-purge-deleted-accounts` | POST | Test purge functionality | Dev only |

## Testing

### 1. Manual Testing
1. Create a test account
2. Navigate to Settings → Delete Account
3. Test the confirmation flow
4. Verify account is marked as deleted
5. Try to sign in (should fail)

### 2. Development Testing
```bash
# Test the purge functionality
POST http://localhost:3000/api/test-purge-deleted-accounts
Content-Type: application/json
```

### 3. Production Monitoring
- Monitor cron job logs in Vercel dashboard
- Check account deletion rates
- Verify data purging effectiveness

## Database Queries for Monitoring

```sql
-- Count deleted accounts
SELECT COUNT(*) FROM "User" WHERE "isDeleted" = true;

-- Accounts eligible for purging
SELECT COUNT(*) FROM "User" 
WHERE "isDeleted" = true 
AND "deletedAt" < NOW() - INTERVAL '30 days';

-- Recent deletions
SELECT "deletedAt", COUNT(*) 
FROM "User" 
WHERE "isDeleted" = true 
GROUP BY "deletedAt"
ORDER BY "deletedAt" DESC;
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Run `npx prisma generate` after schema changes
2. **TypeScript Errors**: Restart TypeScript server after Prisma regeneration
3. **Cron Jobs Not Running**: Verify `CRON_SECRET` environment variable
4. **Modal Not Appearing**: Check component import paths

### Logs to Monitor

- `[DELETE_ACCOUNT]` - Account deletion attempts
- `[PURGE_DELETED_ACCOUNTS]` - Purge job execution
- `[TEST_PURGE_DELETED_ACCOUNTS]` - Development testing

## Future Enhancements

1. **Email Notifications**: Notify users before permanent deletion
2. **Data Export**: Allow users to download their data before deletion
3. **Deletion Reasons**: Collect feedback on why users are leaving
4. **Admin Dashboard**: Interface for administrators to monitor deletions
5. **Bulk Operations**: Tools for handling multiple account deletions

## Compliance Notes

This implementation supports GDPR compliance by:
- Providing clear information about data deletion
- Allowing users to delete their accounts
- Permanently removing all personal data after 30 days
- Maintaining audit logs for compliance verification

## Support

For questions or issues related to account deletion:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure database schema is up to date with `npx prisma db push`
4. Test in development environment first 