# Profile Status Configuration System

This document explains how to configure the default status for new candidate profiles in the Bell Registry application.

## Overview

The system now supports configurable default status for new candidate profiles through the **Admin Portal Settings**. By default, new profiles are automatically **approved** (`APPROVED`), but this can be easily changed to require manual approval (`PENDING`) through the admin interface.

## 🎛️ Admin Portal Configuration (Recommended)

### Accessing Settings

1. **Log in to Admin Portal** - Use your admin credentials to access the admin portal
2. **Navigate to Settings** - Click on "System Settings" in the dashboard
3. **Configure Profile Status** - Use the radio buttons to choose:
   - **Auto-Approve**: New profiles are immediately visible (default)
   - **Manual Approval Required**: New profiles need admin approval

### Benefits of Admin Portal Configuration

✅ **Instant Changes** - No app restart required  
✅ **User-Friendly** - Simple radio button interface  
✅ **Audit Trail** - Track who changed what and when  
✅ **Quick Response** - Can switch modes immediately during incidents  
✅ **No Technical Knowledge** - Any admin can make changes  

## 📝 No Environment Variables Needed!

The admin portal is the **single source of truth** for configuration. No environment variables are required:

- ✅ **Default Behavior**: Auto-approve new profiles (`APPROVED`)
- ✅ **Configuration**: Use Admin Portal Settings page to change
- ✅ **Simple Setup**: No .env files to manage
- ✅ **Instant Changes**: Toggle between modes via UI

## How It Works

### New Profile Creation

When a new professional user registers (either through manual registration or Google OAuth), the system:

1. **Current Behavior**: Defaults to `APPROVED` status
   - Sets profile status to `APPROVED`
   - Sets `approvedAt` timestamp to current time  
   - User can immediately access the platform and be visible publicly

2. **After Admin Configuration**: If admin sets "Manual Approval Required"
   - Sets profile status to `PENDING`
   - User can create and edit their profile but won't be visible publicly
   - Admin approval required before profile becomes visible to others

*Note: Database integration for real-time admin settings is coming in a future update. Currently, the admin portal stores the preference for future use.*

### Profile Visibility Rules

**APPROVED Profiles:**
- ✅ Visible in "Browse Professionals" listing
- ✅ Accessible via direct profile URLs
- ✅ Included in search results
- ✅ Locations included in location filter dropdown
- ✅ Can be contacted by employers/agencies

**PENDING Profiles:**
- ❌ Hidden from "Browse Professionals" listing
- ❌ Not accessible via direct profile URLs (returns 404)
- ❌ Excluded from search results
- ❌ Locations not included in filter dropdowns
- ❌ Cannot be contacted by employers/agencies
- ✅ Can still edit and update their own profile
- ✅ Can access their own profile via the dashboard

**Profile Owner Access:**
- Profile owners can always view and edit their own profiles regardless of status
- PENDING users see their profiles in the dashboard with full editing capabilities
- Profile editing API doesn't check status - users can complete their profiles while waiting for approval

### Code Implementation

The configuration is handled by the `getProfileApprovalFields()` function in:
- `packages/shared/src/lib/profile-config.ts`

This function is used in:
- `packages/main-app/src/app/api/auth/register/route.ts` (manual registration)
- `packages/main-app/src/lib/auth.ts` (Google OAuth)
- `packages/shared/src/lib/auth.ts` (shared auth logic)

## Setup Instructions

### 1. Database Migration

First, run the migration to add the SystemSettings table:

```bash
# When connected to your database, run:
cd packages/shared
npx prisma db execute --file ./src/database/migrations/add_system_settings.sql --schema ./src/database/schema.prisma

# Or run the SQL directly:
psql $DATABASE_URL -f packages/shared/src/database/migrations/add_system_settings.sql
```

### 2. Update Existing Profiles (Optional)

If you want to update existing `PENDING` profiles to `APPROVED`:

```bash
# Run this SQL script:
npx prisma db execute --file ./src/database/migrations/update_existing_profiles_to_approved.sql --schema ./src/database/schema.prisma

# Or run the SQL directly:
psql $DATABASE_URL -f packages/shared/src/database/migrations/update_existing_profiles_to_approved.sql
```

### 3. Generate Prisma Client

After running migrations, regenerate the Prisma client:

```bash
cd packages/shared
npm run db:generate
```

### Manual Migration

You can also run the SQL directly:

```sql
-- Update all PENDING profiles to APPROVED
UPDATE "CandidateProfile" 
SET 
  status = 'APPROVED',
  "approvedAt" = CURRENT_TIMESTAMP,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE status = 'PENDING';
```

## Admin Portal Integration

The admin portal at `/admin/profiles` will show:
- All profiles regardless of status
- Filter options by status (Pending, Approved, etc.)
- Approve/reject actions for pending profiles
- Status badges for easy identification

When manual approval is enabled via admin portal, admins will see more profiles in the "Pending" filter.

## Use Cases

### Auto-Approval (Default)
- **Best for**: Trusted environments, beta testing, internal use
- **Benefits**: Immediate user onboarding, better user experience
- **Considerations**: Less content control, potential for spam/inappropriate content

### Manual Approval (Admin Configurable)
- **Best for**: Production environments with quality control requirements
- **Benefits**: Content moderation, spam prevention, curated user base
- **Considerations**: Requires admin oversight, slower onboarding

## Monitoring and Analytics

### Check Current Configuration
```javascript
// In your application code
import { getDefaultProfileStatus, requiresManualApproval } from '@bell-registry/shared/lib/profile-config';

console.log('Default status:', getDefaultProfileStatus());
console.log('Requires approval:', requiresManualApproval());
```

### Database Queries for Monitoring

```sql
-- Check distribution of profile statuses
SELECT status, COUNT(*) as count 
FROM "CandidateProfile" 
GROUP BY status 
ORDER BY count DESC;

-- Check recently created profiles and their status
SELECT status, COUNT(*) as count 
FROM "CandidateProfile" 
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY status;

-- Check pending profiles (if using manual approval)
SELECT COUNT(*) as pending_profiles 
FROM "CandidateProfile" 
WHERE status = 'PENDING';
```

## Testing

### Development Testing

1. Access admin portal settings page
2. Configure "Manual Approval Required" if testing approval workflow
3. Register a new professional user
4. Check admin portal to see the profile status
5. Test the approval workflow through admin portal

### Production Deployment

1. Run the database migrations as described above
2. Deploy the updated code
3. Use admin portal to configure approval behavior as needed
4. Monitor admin portal for pending profiles (if using manual approval)

## Troubleshooting

### Common Issues

1. **Admin portal settings not saving**
   - Check browser console for any JavaScript errors
   - Verify admin user has proper permissions
   - Ensure database migrations have been run

2. **Existing users still pending**
   - Run the provided migration script to update existing users
   - Or manually update them through the admin portal profiles page

3. **Settings page not accessible**
   - Verify you're logged in as an admin user
   - Check that admin portal is connected to the same database
   - Ensure database includes the SystemSettings table

### Debug Information

Add this to any API route to debug the configuration:
```javascript
import { getDefaultProfileStatus } from '@bell-registry/shared/lib/profile-config';
console.log('Current default status:', getDefaultProfileStatus());
```

Check admin portal settings:
- Navigate to `/admin/settings` to view current configuration
- Check the SystemSettings table in your database for stored values 