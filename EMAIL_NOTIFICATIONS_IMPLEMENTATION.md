> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Email Notifications for Account Suspensions and Bans

This document outlines the implementation of automated email notifications that are sent to users when their account is suspended, unsuspended, or banned.

## Overview

The system automatically sends professional, branded email notifications to users when admin actions are taken against their accounts. This ensures users are always informed about changes to their account status.

## Features Implemented

### 1. **Suspension Notification Email**
- **Sent when**: An admin suspends a user's account
- **Content includes**:
  - Clear explanation that the account has been suspended
  - Suspension reason (if provided by admin)
  - Admin notes (if provided)
  - Date of suspension
  - What this means for the user (restricted access, etc.)
  - Next steps the user can take
  - Links to appeal the suspension and contact support

### 2. **Ban Notification Email**
- **Sent when**: An admin permanently bans a user's account
- **Content includes**:
  - Clear explanation that the account has been permanently banned
  - Date of ban
  - What this means (permanent loss of access)
  - Contact information for support
  - Note that the decision is final

### 3. **Unsuspension Notification Email**
- **Sent when**: An admin lifts a user's suspension
- **Content includes**:
  - Good news that the suspension has been lifted
  - Date of restoration
  - What the user can now do (full access restored)
  - Links to dashboard and profile
  - Welcome back message

## Technical Implementation

### Email Service (`packages/shared/src/lib/notification-email-service.ts`)

```typescript
// Main functions exported:
export async function sendSuspensionNotification(data: SuspensionNotificationData)
export async function sendBanNotification(data: BanNotificationData) 
export async function sendUnsuspensionNotification(data: UnsuspensionNotificationData)
```

**Key features**:
- Uses Resend for email delivery
- Professional HTML email templates with branding
- Development mode simulation (emails go to test address)
- Error handling that doesn't fail the admin action
- Comprehensive logging

### Admin Integration (`packages/admin-portal/src/app/api/profiles/[id]/action/route.ts`)

The admin action route has been updated to automatically send emails when:
- A user is suspended (`suspend` action)
- A user is unsuspended (`unsuspend` action) 
- A user is banned (`ban` action)

**Error handling**: If the email fails to send, the admin action still succeeds and the error is logged. This ensures admin operations aren't blocked by email issues.

### Email Templates

All emails include:
- **Professional branding** with The Bell Registry logo
- **Clear, user-friendly language** explaining the situation
- **Specific next steps** the user can take
- **Contact information** for support
- **Consistent styling** across all notification types
- **Mobile-responsive design**

## Development & Testing

### Test Endpoints

**Admin Test Interface**: `/test-notifications` (in admin portal)
- Test the suspension appeal form functionality
- Test individual notification emails with custom data
- View test results and debug information
- Admin-specific testing interface

**Test Notification Emails**: `/api/test-suspension-notifications` (in admin portal)
- Endpoint to test all three types of notification emails
- Only available in development mode
- Accepts parameters for customizing test data

### Testing in Development

```bash
# Start the admin portal
cd packages/admin-portal
npm run dev

# Navigate to admin test page
http://localhost:3001/test-notifications

# Use the admin testing interface to test:
# - Test Suspension Email (with custom data)
# - Test Ban Email
# - Test Unsuspension Email
# - Test Appeal Submission
```

### Production Configuration

**Required environment variables**:
- `RESEND_API_KEY`: Your Resend API key
- `ADMIN_EMAIL`: Email address to receive admin notifications
- `NEXT_PUBLIC_APP_URL`: Your app's public URL for email links

**Email addresses used**:
- **Development**: `onboarding@resend.dev` (test emails)
- **Production**: `notifications@bellregistry.com`

## User Experience Flow

### For Suspended Users:

1. **Admin suspends user** → **Email sent immediately**
2. **User receives notification** with suspension details
3. **User can click links** to:
   - View full suspension details at `/account-suspended`
   - Submit an appeal through the form
   - Contact support directly via email

### For Banned Users:

1. **Admin bans user** → **Email sent immediately**  
2. **User receives notification** explaining permanent ban
3. **User can contact support** if they have questions

### For Restored Users:

1. **Admin lifts suspension** → **Email sent immediately**
2. **User receives good news** about account restoration
3. **User can click links** to:
   - Access their dashboard immediately
   - Update their profile
   - Resume normal platform activities

## Integration with Existing Systems

### Suspension Check Component
- The existing suspension check system continues to work
- Shows suspension popup to users when they log in
- "Learn More" button now leads to a comprehensive page
- Appeal functionality is fully integrated

### Appeal System  
- Appeals are submitted through `/account-suspended` page
- Admin receives detailed appeal emails
- User receives confirmation emails
- Full tracking and logging

### Admin Dashboard
- All email sending is logged in admin audit logs
- No changes needed to existing admin interfaces
- Email failures don't block admin actions

## Security & Privacy

- **No sensitive data** in email templates
- **Secure email delivery** through Resend
- **Development mode protection** prevents accidental production emails
- **Graceful error handling** maintains system stability
- **Audit logging** of all email activities

## Future Enhancements

Potential improvements that could be added:
- **Email templates** in multiple languages
- **Email preferences** for users to opt-out of certain notifications
- **Rich text formatting** for admin notes in emails
- **Email tracking** to see if users opened the emails
- **Automated follow-up** emails for unresolved suspensions

## Troubleshooting

### Common Issues:

1. **Emails not sending**:
   - Check `RESEND_API_KEY` environment variable
   - Check console logs for error messages
   - Verify Resend account status

2. **Test emails not received**:
   - In development, emails go to `delivered@resend.dev`
   - Check Resend dashboard for delivery status
   - Verify environment variables are set correctly

3. **Links in emails not working**:
   - Check `NEXT_PUBLIC_APP_URL` environment variable
   - Ensure the domain is correctly configured

### Monitoring:

- All email operations are logged with `[SUSPENSION_NOTIFICATION]`, `[BAN_NOTIFICATION]`, `[UNSUSPENSION_NOTIFICATION]` prefixes
- Admin actions that trigger emails are logged in the admin audit system
- Email failures are logged but don't prevent admin actions from completing

## Admin Portal Integration

The test interface is properly located in the **admin portal** where it belongs:

- **Location**: `packages/admin-portal/src/app/test-notifications/page.tsx`
- **Access**: Available through admin dashboard in development mode
- **Features**: Custom test data, comprehensive testing interface
- **API Endpoints**: Located in admin portal for proper separation of concerns

### Accessing the Test Interface

1. **Start admin portal**: `cd packages/admin-portal && npm run dev`
2. **Login as admin**: Access at `http://localhost:3001`
3. **Navigate to dashboard**: Will show development tools section
4. **Click "Test Email Notifications"**: Opens comprehensive testing interface

## Summary

This implementation provides a complete, professional email notification system that:
- ✅ **Automatically notifies users** of account status changes
- ✅ **Provides clear next steps** and appeal processes  
- ✅ **Integrates seamlessly** with existing admin and user systems
- ✅ **Handles errors gracefully** without blocking admin operations
- ✅ **Includes comprehensive testing** in the admin portal
- ✅ **Maintains security and privacy** standards
- ✅ **Provides excellent user experience** with professional branding
- ✅ **Proper separation of concerns** with admin tools in admin portal

The system is production-ready and will significantly improve user communication and satisfaction around account management. Admin testing tools are appropriately located in the admin portal for better organization and security. 