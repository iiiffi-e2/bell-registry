> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Email Environment Variables Configuration

This document outlines the environment variables that need to be configured to replace hardcoded email addresses in the Bell Registry application.

## Required Environment Variables

### Server-Side Email Configuration

The following environment variables should be set in your production environment:

```bash
# General email addresses
FROM_EMAIL=noreply@yourdomain.com
WELCOME_EMAIL=welcome@yourdomain.com
NOTIFICATIONS_EMAIL=notifications@yourdomain.com
ALERTS_EMAIL=alerts@yourdomain.com
FEEDBACK_EMAIL=feedback@yourdomain.com
APPEALS_EMAIL=appeals@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# Client-side email (for UI components)
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourdomain.com
```

## Email Service Usage

### FROM_EMAIL
- **Used by**: Forgot password, email verification, job applications, profile reports
- **Purpose**: General "from" address for system emails
- **Default fallback**: `noreply@bellregistry.com`

### WELCOME_EMAIL
- **Used by**: Welcome email service
- **Purpose**: Sending welcome emails to new users
- **Default fallback**: `welcome@bellregistry.com`

### NOTIFICATIONS_EMAIL
- **Used by**: Profile reminders, suspension/ban notifications
- **Purpose**: System notifications and reminders
- **Default fallback**: `notifications@bellregistry.com`

### ALERTS_EMAIL
- **Used by**: Job alerts, employer notifications
- **Purpose**: Job-related alerts and notifications
- **Default fallback**: `alerts@bellregistry.com`

### FEEDBACK_EMAIL
- **Used by**: Feedback system
- **Purpose**: Receiving user feedback and bug reports
- **Default fallback**: `feedback@bellregistry.com`

### APPEALS_EMAIL
- **Used by**: Suspension appeal system
- **Purpose**: Handling account suspension appeals
- **Default fallback**: `appeals@bellregistry.com`

### SUPPORT_EMAIL
- **Used by**: Support contact links in emails and UI
- **Purpose**: User support and assistance
- **Default fallback**: `support@bellregistry.com`

### NEXT_PUBLIC_SUPPORT_EMAIL
- **Used by**: Client-side components (UI)
- **Purpose**: Support contact links in React components
- **Default fallback**: `support@bellregistry.com`

## Files Modified

The following files have been updated to use environment variables instead of hardcoded email addresses:

### Email Services
- `packages/main-app/src/app/api/auth/forgot-password/route.ts`
- `packages/main-app/src/lib/welcome-email-service.ts`
- `packages/main-app/src/app/api/settings/email/route.ts`
- `packages/main-app/src/lib/job-application-email-service.ts`
- `packages/main-app/src/lib/profile-reminder-service.ts`
- `packages/main-app/src/lib/job-alert-service.ts`
- `packages/main-app/src/lib/employer-notification-service.ts`
- `packages/main-app/src/app/api/feedback/route.ts`
- `packages/main-app/src/app/api/auth/suspension-appeal/route.ts`
- `packages/main-app/src/app/api/report-profile/route.ts`
- `packages/shared/src/lib/notification-email-service.ts`

### UI Components
- `packages/main-app/src/components/subscription/SubscriptionPlans.tsx`
- `packages/main-app/src/components/auth/suspension-check.tsx`
- `packages/main-app/src/app/account-suspended/page.tsx`

### New Files
- `packages/main-app/src/lib/constants.ts` - Contains email constants for client-side use

## Configuration Notes

1. **Development vs Production**: In development mode, emails are sent to `delivered@resend.dev` for testing purposes.

2. **Fallback Values**: All email addresses have fallback values to `@bellregistry.com` if environment variables are not set.

3. **Client-Side Variables**: Use `NEXT_PUBLIC_*` prefix for environment variables that need to be accessible in client-side React components.

4. **Email Templates**: Support email links in email templates now use the `SUPPORT_EMAIL` environment variable.

## Deployment Checklist

- [ ] Set all required environment variables in production
- [ ] Verify email domain is properly configured with Resend
- [ ] Test email delivery with new configuration
- [ ] Update any documentation that references old email addresses

## Testing

To test the email configuration:

1. Set the environment variables in your `.env.local` file
2. Test the forgot password functionality
3. Test user registration (welcome email)
4. Test feedback submission
5. Verify support links in UI components work correctly
