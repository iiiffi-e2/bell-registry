# Welcome Email Feature

## Overview

The welcome email feature automatically sends a personalized welcome email to new users when they sign up for an account, whether they register via email/password or Google OAuth. The email includes The Bell Registry logo, a welcome message, helpful tips for getting started, and a prominent sign-in button.

## Features

### Email Content
- **The Bell Registry logo** prominently displayed at the top
- **Personalized welcome message** using the user's first name
- **Role-specific content** tailored for professionals vs employers/agencies
- **Next steps guidance** with actionable tips for getting started
- **Platform benefits** highlighting why they chose The Bell Registry
- **Sign-in button** that directs users to the login page
- **Support contact** information for assistance

### Role-Specific Messaging

#### For Professionals
- Focus on finding opportunities in luxury private service
- Tips for completing their professional profile
- Guidance on browsing jobs and setting up alerts
- Emphasis on career advancement in the private service sector

#### For Employers/Agencies
- Focus on finding top-tier domestic professionals
- Tips for completing company profile and posting jobs
- Guidance on browsing candidate profiles
- Emphasis on vetted professionals and luxury market expertise

## Technical Implementation

### Files Added/Modified

1. **`src/lib/welcome-email-service.ts`** - New service for sending welcome emails
2. **`src/app/api/auth/register/route.ts`** - Modified to send welcome emails after registration
3. **`src/lib/auth.ts`** - Modified to send welcome emails for Google OAuth signups
4. **`src/app/api/test-welcome-email/route.ts`** - Test endpoint for development

### Integration Points

The welcome email is triggered in two scenarios:

1. **Email/Password Registration** - After successful user creation in `/api/auth/register`
2. **Google OAuth Registration** - When a new user signs up via Google OAuth

### Email Service Configuration

The system uses Resend for email delivery with the following configuration:

- **Development**: Emails sent to `delivered@resend.dev`
- **Production**: Emails sent to actual user email addresses
- **From Address**: `The Bell Registry <welcome@thebellregistry.com>`

## Environment Variables Required

Make sure these environment variables are configured:

```
RESEND_API_KEY=your_resend_api_key
NEXTAUTH_URL=your_domain_url
```

## Testing

### Development Testing

Use the test endpoint to verify email functionality:

```bash
POST /api/test-welcome-email
Content-Type: application/json

{
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "PROFESSIONAL"
}
```

### Test Different Roles

Test with different user roles:

```bash
# Professional
{
  "role": "PROFESSIONAL"
}

# Employer
{
  "role": "EMPLOYER"
}

# Agency
{
  "role": "AGENCY"
}
```

## Error Handling

- Email sending errors are logged but do not fail the registration process
- Users can still complete registration even if email delivery fails
- Comprehensive error logging for debugging email issues

## Email Template Features

- **Responsive design** that works on desktop and mobile
- **Professional styling** matching The Bell Registry branding
- **Clear call-to-action** with the sign-in button
- **Helpful onboarding content** to guide new users
- **Support contact** for user assistance

## Production Considerations

1. **Email Deliverability**: Ensure Resend is properly configured with domain verification
2. **Rate Limiting**: Monitor email sending rates to avoid hitting service limits
3. **Error Monitoring**: Set up alerts for email delivery failures
4. **A/B Testing**: Consider testing different email content for better engagement

## Future Enhancements

Potential improvements to consider:

1. **Email Templates**: Move to template-based system for easier content management
2. **Personalization**: Include more personalized content based on user preferences
3. **Follow-up Sequences**: Add onboarding email series for better user engagement
4. **Analytics**: Track email open rates and click-through rates
5. **Preferences**: Allow users to opt-out of welcome emails (if required by regulations)

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check Resend API key and configuration
2. **Wrong email content**: Verify role detection and template logic
3. **Broken links**: Ensure NEXTAUTH_URL is correctly set
4. **Missing logo**: Check that logo file exists at `/images/brand/logo-full.png`

### Debugging

Enable detailed logging to troubleshoot issues:

```javascript
console.log(`Welcome email sent to ${userData.email}:`, emailResponse);
```

Check the server logs for email sending status and any error messages. 