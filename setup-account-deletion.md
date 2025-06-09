# Account Deletion Setup Guide

## Quick Setup Steps

### 1. Apply Database Changes

#### For Development
```bash
# Migration has already been created and applied locally
npx prisma generate
```

#### For Production
```bash
# Deploy the migration to production database
npx prisma migrate deploy
```

### 2. Add Environment Variable
Add to your `.env` file:
```bash
CRON_SECRET=your-secure-random-string-here
```

### 3. Test the Implementation

#### Test the Modal (Frontend)
1. Start the development server: `npm run dev`
2. Sign in to your account
3. Navigate to `/dashboard/settings`
4. Scroll to the "Delete Account" section
5. Click "Delete My Account" button
6. Test the confirmation flow

#### Test the API (Backend)
```bash
# Test the delete account endpoint (requires authentication)
curl -X DELETE http://localhost:3000/api/settings/delete-account

# Test the purge functionality (development only)
curl -X POST http://localhost:3000/api/test-purge-deleted-accounts
```

### 4. Verify Database Changes
```sql
-- Check if fields exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('isDeleted', 'deletedAt');

-- Check deleted accounts
SELECT id, email, "isDeleted", "deletedAt" 
FROM "User" 
WHERE "isDeleted" = true;
```

## Files Created/Modified

### ✅ Created Files
- `src/components/modals/DeleteAccountModal.tsx` - Modal component
- `src/app/api/settings/delete-account/route.ts` - Delete API endpoint
- `src/app/api/cron/purge-deleted-accounts/route.ts` - Purge cron job
- `src/app/api/test-purge-deleted-accounts/route.ts` - Test endpoint
- `ACCOUNT_DELETION_IMPLEMENTATION.md` - Full documentation

### ✅ Modified Files
- `prisma/schema.prisma` - Added isDeleted and deletedAt fields
- `src/app/dashboard/settings/page.tsx` - Added delete account section
- `src/lib/auth.ts` - Added deleted account checks
- `vercel.json` - Added cron job configuration

## Known Issues & Solutions

### TypeScript Errors
If you see TypeScript errors about `isDeleted` not existing:
1. Run `npx prisma generate`
2. Restart your TypeScript server (Ctrl+Shift+P → "TypeScript: Restart TS Server")

### Import Errors
If the DeleteAccountModal import fails:
1. Ensure the file was created correctly
2. Restart your development server
3. Check the file path is correct

### Modal Not Showing
1. Check browser console for JavaScript errors
2. Verify the component is imported correctly
3. Check if the state management is working

## Production Deployment

### Before Deploying
1. Set `CRON_SECRET` environment variable in Vercel
2. Verify all tests pass
3. Test the deletion flow thoroughly

### After Deploying
1. Monitor cron job logs in Vercel dashboard
2. Test the API endpoints in production
3. Verify the purge job runs correctly at 2:00 AM UTC

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify environment variables are set
3. Ensure database migrations completed successfully
4. Review the comprehensive documentation in `ACCOUNT_DELETION_IMPLEMENTATION.md` 