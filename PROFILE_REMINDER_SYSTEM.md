> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Profile Reminder System

## Overview

The profile reminder system automatically sends email notifications to professionals and employers who haven't logged in for 30+ days, encouraging them to update their profiles to stay visible and competitive.

## Features

### Automated Detection
- Monitors user login activity using `lastLoginAt` timestamps
- Identifies users who haven't logged in for 30+ days
- Tracks when reminders were last sent to prevent spam
- Only targets PROFESSIONAL users (employer reminders disabled for now)

### Smart Reminders
The system provides personalized reminders based on:

- **User Role**: Different messaging for professionals vs employers
- **Profile Completeness**: Analyzes profile data to show completion percentage
- **Time Since Last Login**: Shows exact days since last visit
- **Personalized Suggestions**: Role-specific tips for profile improvement

### Email Content
Each reminder email includes:
- Personalized greeting with days since last login
- Visual profile completion indicator
- Role-specific benefits of keeping profile updated
- Quick improvement suggestions
- Direct login and profile links
- Professional, encouraging tone

## Technical Implementation

### Database Schema Changes
Added to User model:
- `lastLoginAt`: Tracks when user last signed in
- `lastProfileReminderSentAt`: Prevents duplicate reminders

### Files Created
- `src/lib/profile-reminder-service.ts` - Core reminder logic
- `src/app/api/cron/profile-reminders/route.ts` - Cron job endpoint
- `src/app/api/test-profile-reminders/route.ts` - Testing endpoint

### Authentication Updates
Modified `src/lib/auth.ts` to update `lastLoginAt` on every successful sign-in.

### Database Queries
Uses optimized Prisma queries to:
- Find users with last login > 30 days ago
- Only include users who haven't received reminders recently
- Include profile data for completeness analysis
- Limit results to prevent email service overload

### Email Service
- Uses Resend for reliable email delivery
- Supports development mode with test email addresses
- Professional HTML email templates with visual elements
- Comprehensive error handling and logging

## Scheduling

### Production
- Runs weekly on Mondays at 10:00 AM UTC via Vercel cron jobs
- Configured in `vercel.json`
- Requires `CRON_SECRET` environment variable for security

### Development
- Test endpoint available at `/api/test-profile-reminders`
- Only accessible in development mode
- No authentication required for testing

## Configuration

### Environment Variables
- `RESEND_API_KEY` - Required for email sending
- `CRON_SECRET` - Required for production cron job security
- `NEXTAUTH_URL` - Used for generating email links

### Email Settings
- Development: Sends to `delivered@resend.dev`
- Production: Sends to actual user email addresses
- From address: `Bell Registry <notifications@bellregistry.com>`

## Usage

### For Users
No action required - reminders are sent automatically when:
1. User hasn't logged in for 30+ days
2. User is a PROFESSIONAL (employers currently excluded)
3. No reminder has been sent in the last 30 days

### For Administrators
Monitor the system through:
- Server logs for processing status
- Email delivery confirmations
- Error tracking for failed notifications

## Testing

### Manual Testing
```bash
# In development mode only
POST /api/test-profile-reminders
```

### Cron Job Testing
```bash
# Requires CRON_SECRET
POST /api/cron/profile-reminders
Authorization: Bearer YOUR_CRON_SECRET
```

### Database Testing
```sql
-- Check users eligible for reminders
SELECT id, email, "lastLoginAt", "lastProfileReminderSentAt", role
FROM "User" 
WHERE "isDeleted" = false 
AND role = 'PROFESSIONAL'
AND "lastLoginAt" < NOW() - INTERVAL '30 days'
AND ("lastProfileReminderSentAt" IS NULL OR "lastProfileReminderSentAt" < NOW() - INTERVAL '30 days');

-- Update test user to be eligible
UPDATE "User" 
SET "lastLoginAt" = NOW() - INTERVAL '35 days',
    "lastProfileReminderSentAt" = NULL
WHERE email = 'test@example.com';
```

## Monitoring

### Logs
The system provides detailed logging:
- Number of users found needing reminders
- Individual email send confirmations
- Profile completeness calculations
- Error details for failed operations

### Success Metrics
- Users re-engaging after reminders
- Profile update rates post-reminder
- Email delivery success rates
- Reduction in inactive user accounts

## Email Template Features

### Visual Elements
- The Bell Registry logo prominently displayed at the top
- Profile completion progress bar
- Color-coded completion status
- Professional icons and styling
- Mobile-responsive design

### Personalization
- User's actual name
- Days since last login
- Role-specific messaging
- Profile completeness percentage
- Targeted improvement suggestions

### Call-to-Actions
- Primary: "Sign In & Update Profile" button
- Secondary: "View your current profile" link
- Settings: "Manage notification preferences" link

## Future Enhancements

### Planned Features
1. **Employer Reminders**: Enable profile reminders for employers (code ready, just change filter)
2. **Multiple Reminder Cadence**: 30, 60, 90 day intervals
3. **A/B Testing**: Different email templates and timing
4. **Unsubscribe Options**: Allow users to opt-out of reminders
5. **Admin Dashboard**: Interface for monitoring reminder effectiveness
6. **SMS Reminders**: Alternative notification channel
7. **Profile Health Score**: More sophisticated completeness analysis

### Enabling Employer Reminders
To enable employer reminders in the future, simply change the role filter in `findUsersNeedingProfileReminders()`:
```typescript
// Change from:
{ role: 'PROFESSIONAL' }
// To:
{ role: { in: ['PROFESSIONAL', 'EMPLOYER'] } }
```

### Analytics Integration
1. **Email Engagement**: Track opens, clicks, and conversions
2. **Profile Update Tracking**: Measure reminder effectiveness
3. **Retention Analysis**: Impact on user retention rates
4. **ROI Measurement**: Value of re-engaged users

## Security & Privacy

### Data Protection
- Only processes non-sensitive profile metadata
- Secure email delivery through Resend
- Proper authentication for cron endpoints
- Respects user deletion preferences

### Compliance
- Includes unsubscribe options in emails
- Tracks consent for email communications
- Follows email marketing best practices
- Supports GDPR compliance requirements

## Troubleshooting

### Common Issues

1. **Import Errors**: Run `npx prisma generate` after schema changes
2. **TypeScript Errors**: Restart TypeScript server after Prisma regeneration
3. **Cron Jobs Not Running**: Verify `CRON_SECRET` environment variable
4. **Emails Not Sending**: Check `RESEND_API_KEY` configuration

### Logs to Monitor

- `[PROFILE_REMINDERS]` - Main process execution
- `[CRON_PROFILE_REMINDERS]` - Cron job execution
- `[TEST_PROFILE_REMINDERS]` - Development testing

### Database Queries for Debugging

```sql
-- Check last login tracking
SELECT email, "lastLoginAt", "createdAt" 
FROM "User" 
WHERE "lastLoginAt" IS NOT NULL 
ORDER BY "lastLoginAt" DESC 
LIMIT 10;

-- Verify reminder tracking
SELECT email, "lastProfileReminderSentAt", "lastLoginAt"
FROM "User" 
WHERE "lastProfileReminderSentAt" IS NOT NULL
ORDER BY "lastProfileReminderSentAt" DESC;

-- Count eligible users
SELECT COUNT(*) as eligible_users
FROM "User" 
WHERE "isDeleted" = false 
AND role = 'PROFESSIONAL'
AND "lastLoginAt" < NOW() - INTERVAL '30 days'
AND ("lastProfileReminderSentAt" IS NULL OR "lastProfileReminderSentAt" < NOW() - INTERVAL '30 days');
```

## Support

For questions or issues related to profile reminders:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure database schema is up to date
4. Test in development environment first 