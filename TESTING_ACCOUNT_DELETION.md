> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Testing Account Deletion Implementation

This guide walks you through testing the complete account deletion feature in development.

## Prerequisites

1. Ensure you're in development mode (`NODE_ENV=development`)
2. Have a running development server (`npm run dev`)
3. Have access to your database (for verification)

## Test Scenarios

### 1. Test Basic Account Deletion Flow

#### Step 1: Create a Test Account or Use Existing One
- Sign up or use an existing account
- Note the user ID and email for verification

#### Step 2: Delete the Account via UI
1. Navigate to `/dashboard/settings`
2. Scroll to the "Delete Account" section
3. Click "Delete Account" button
4. In the modal:
   - Type "DELETE" in the confirmation field
   - Click "Delete My Account"
5. Verify you're signed out and redirected

#### Step 3: Verify Immediate Soft Delete
Check that the account is marked as deleted but not purged:

```bash
# Using Prisma Studio (recommended)
npx prisma studio

# Or using psql/database client to check
# Look for the user with isDeleted: true and email changed to deleted_{userId}@deleted.com
```

### 2. Test the Account Purge Logic

#### Step 1: Create Test Data with Old Deletion Dates

Create a simple script to test old deletions:

```javascript
// Create file: scripts/create-test-deleted-account.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestDeletedAccount() {
  // Create a test user that was "deleted" 35 days ago
  const thirtyFiveDaysAgo = new Date();
  thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
  
  const testUser = await prisma.user.create({
    data: {
      email: 'test-deleted-old@example.com',
      name: 'Test Deleted User',
      isDeleted: true,
      deletedAt: thirtyFiveDaysAgo,
      password: 'deleted_password_hash',
    }
  });
  
  console.log('Created test deleted user:', testUser.id);
  return testUser;
}

createTestDeletedAccount()
  .then(() => {
    console.log('Test data created successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error creating test data:', error);
    process.exit(1);
  });
```

#### Step 2: Run the Test Script

```bash
# Create the script directory
mkdir -p scripts

# Run the script (you'll need to create the file above)
node scripts/create-test-deleted-account.js
```

#### Step 3: Test the Purge Endpoint

Now test what accounts would be purged:

```bash
# Using curl
curl -X POST http://localhost:3000/api/test-purge-deleted-accounts

# Using PowerShell (Windows)
Invoke-RestMethod -Uri "http://localhost:3000/api/test-purge-deleted-accounts" -Method POST

# Using a tool like Postman or Insomnia
# POST to: http://localhost:3000/api/test-purge-deleted-accounts
```

Expected response:
```json
{
  "success": true,
  "message": "Test mode: Would purge 1 accounts",
  "accountsThatWouldBePurged": [
    {
      "id": "user_id_here",
      "email": "test-deleted-old@example.com",
      "deletedAt": "2024-11-09T...",
      "daysSinceDeleted": 35
    }
  ],
  "note": "This is a test run - no accounts were actually deleted"
}
```

### 3. Test Authentication Blocks

#### Step 1: Try to Sign In with Deleted Account
1. Delete an account through the UI
2. Try to sign in with the same credentials
3. Verify you get an authentication error

#### Step 2: Test OAuth with Deleted Account
1. If using Google OAuth, try signing in with Google using the same email
2. Should be blocked from accessing the application

### 4. Test API Endpoints Directly

#### Test Account Deletion API

```bash
# First, get a valid session token by signing in through the UI
# Then test the delete account API directly

curl -X DELETE http://localhost:3000/api/settings/delete-account \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your_session_token_here"

# PowerShell version
$headers = @{
    "Content-Type" = "application/json"
    "Cookie" = "next-auth.session-token=your_session_token_here"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/settings/delete-account" -Method DELETE -Headers $headers
```

## Verification Steps

### Database Verification

```sql
-- Check deleted accounts
SELECT id, email, "isDeleted", "deletedAt", "createdAt"
FROM "User" 
WHERE "isDeleted" = true;

-- Check accounts older than 30 days
SELECT id, email, "deletedAt",
       EXTRACT(EPOCH FROM (NOW() - "deletedAt")) / 86400 as days_since_deleted
FROM "User" 
WHERE "isDeleted" = true 
  AND "deletedAt" < NOW() - INTERVAL '30 days';
```

### Expected Behaviors

1. **Immediate Deletion**:
   - User marked as `isDeleted: true`
   - Email changed to `deleted_{userId}@deleted.com`
   - Sensitive data cleared
   - User signed out immediately

2. **Authentication Blocks**:
   - Cannot sign in with original credentials
   - Cannot sign in via OAuth
   - Existing sessions invalidated

3. **Purge Logic**:
   - Test endpoint shows accounts that would be purged
   - Only accounts deleted >30 days ago are candidates
   - Related data would be removed via CASCADE

## Troubleshooting

### Common Issues

1. **Test endpoint returns 403**: Make sure `NODE_ENV=development`
2. **No accounts to purge**: Create test data with old deletion dates
3. **Database connection errors**: Check your DATABASE_URL
4. **Session issues**: Clear browser cookies and sign in again

### Debug Commands

```bash
# Check environment
echo $NODE_ENV

# Check database connection
npx prisma db execute --stdin --schema prisma/schema.prisma
# Then type: SELECT 1;

# Reset test data
npx prisma db seed  # if you have a seed file
```

## Production Testing Notes

⚠️ **Important**: The test endpoint only works in development mode. In production:

1. Monitor the cron job logs in Vercel
2. Use database queries to verify purge functionality
3. Set up monitoring alerts for the purge job
4. Test the UI deletion flow with non-critical accounts

## Clean Up Test Data

After testing, clean up test accounts:

```sql
-- Remove test accounts (be very careful with this!)
DELETE FROM "User" WHERE email LIKE 'test-%@example.com';
``` 