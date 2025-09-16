# Slack Integration Setup for Bell Registry

This document outlines how to set up Slack notifications for new user registrations in Bell Registry.

## Overview

The Bell Registry application now sends Slack notifications whenever a new professional, employer, or agency signs up. This helps the team track new registrations in real-time.

## Features

- 🎉 Rich Slack notifications with user details
- 👨‍💼 Role-specific emojis and formatting
- 📊 Registration method tracking (manual vs OAuth)
- 🏢 Company information for employers/agencies
- 🔗 Professional referral tracking
- ⏰ Timestamp with Eastern timezone
- 🔗 Quick links to admin portal

## Setup Instructions

### 1. Create a Slack Webhook

1. Go to your Slack workspace
2. Navigate to **Apps** → **Manage** → **Custom Integrations** → **Incoming Webhooks**
3. Click **Add to Slack**
4. Choose the channel where you want to receive notifications (e.g., `#registrations`, `#team-updates`)
5. Click **Add Incoming WebHooks Integration**
6. Copy the **Webhook URL** (it will look like: `https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX`)

### 2. Configure Environment Variable

Add the Slack webhook URL to your environment variables:

#### For Development (.env.local)
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX
```

#### For Production (Vercel/your hosting platform)
Set the environment variable `SLACK_WEBHOOK_URL` with your webhook URL.

### 3. Set Up Local Environment

Create a `.env.local` file in your `packages/main-app` directory:

```bash
# packages/main-app/.env.local
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX
```

Replace `TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXXXXXXXXXXX` with your actual webhook URL from step 1.

### 4. Test the Integration

You can test the Slack integration using the test endpoint:

#### Test Basic Connectivity
```bash
curl -X POST http://localhost:3000/api/test-slack-notification \
  -H "Content-Type: application/json" \
  -d '{"type": "test"}'
```

#### Test Registration Notification
```bash
curl -X POST http://localhost:3000/api/test-slack-notification \
  -H "Content-Type: application/json" \
  -d '{"type": "registration"}'
```

## Notification Details

### What Gets Sent

When a new user registers, the Slack notification includes:

- **User Information**: Full name, email, role
- **Registration Method**: Manual registration or OAuth provider (Google)
- **Role-Specific Details**:
  - For Employers/Agencies: Company name
  - For Professionals: Membership access type, referral information
- **Timestamp**: Registration time in Eastern timezone
- **Quick Actions**: Link to admin portal for user management

### Notification Format

```
🎉 New professional registration!

Name: John Doe 👨‍💼
Email: john.doe@example.com
Role: PROFESSIONAL
Registration Method: Manual Registration

Membership Access: Professional Referral
Referred by: Jane Smith

Registration Time: December 15, 2024 at 2:30 PM

View in admin portal: https://admin.bellregistry.com/
```

## Integration Points

The Slack notifications are integrated into the following registration flows:

### 1. Manual Registration
- **File**: `packages/main-app/src/app/api/auth/register/route.ts`
- **Trigger**: After successful user creation and profile setup
- **Data**: All form data including company name, referral info, etc.

### 2. OAuth Registration (Google)
- **File**: `packages/main-app/src/lib/auth.ts`
- **Trigger**: After successful OAuth user creation
- **Data**: Name, email, role, OAuth provider

## Configuration Options

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SLACK_WEBHOOK_URL` | Yes | Slack webhook URL for notifications | None |

### Customization

You can customize the notifications by modifying `packages/main-app/src/lib/slack-notification-service.ts`:

- **Message format**: Update the `blocks` structure
- **Role emojis**: Modify `getRoleEmoji()` function
- **Additional fields**: Add more data to the notification
- **Timezone**: Change from Eastern to your preferred timezone

## Error Handling

- Slack notifications are **non-blocking** - registration will succeed even if Slack notification fails
- Errors are logged to console for debugging
- Missing webhook URL logs a warning but doesn't throw an error

## Troubleshooting

### Common Issues

1. **No notifications received**
   - Check that `SLACK_WEBHOOK_URL` is set correctly
   - Verify the webhook URL is still valid in Slack
   - Check server logs for error messages

2. **Notifications going to wrong channel**
   - The channel is determined by the webhook configuration in Slack
   - Recreate the webhook for a different channel if needed

3. **Missing information in notifications**
   - Check that the registration form is sending all expected fields
   - Verify the data mapping in `slack-notification-service.ts`

### Testing Checklist

- [ ] Test manual professional registration
- [ ] Test manual employer registration  
- [ ] Test manual agency registration
- [ ] Test Google OAuth registration
- [ ] Verify all user data appears correctly
- [ ] Check timezone display
- [ ] Confirm admin portal links work

## Security Considerations

- **Webhook URL**: Keep your Slack webhook URL secret - it allows posting to your Slack workspace
- **User Data**: The notifications include email addresses and names - ensure your Slack workspace access is properly controlled
- **Environment Variables**: Use secure environment variable management in production

## Monitoring

Monitor Slack notifications through:

- **Server logs**: Check for failed notification attempts
- **Slack channel**: Verify notifications are being received
- **Test endpoint**: Use `/api/test-slack-notification` for periodic testing

## Future Enhancements

Potential improvements to consider:

- **Batch notifications**: Group multiple registrations into digest messages
- **Role-based channels**: Send different roles to different channels
- **Interactive buttons**: Add Slack buttons for quick actions like user approval
- **Registration analytics**: Include daily/weekly registration summaries
- **Alert thresholds**: Notify if registration volume is unusually high/low

## Support

If you encounter issues with the Slack integration:

1. Check the server logs for error messages
2. Test the webhook URL manually using curl
3. Verify all environment variables are set correctly
4. Use the test endpoint to isolate issues
