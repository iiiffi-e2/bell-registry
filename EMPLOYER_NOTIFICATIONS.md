# Employer Notification System

## Overview

The employer notification system automatically sends email notifications to employers when their job postings haven't received any applications within the last 3 days. This helps employers identify underperforming job listings and provides actionable suggestions to improve them.

## Features

### Automatic Detection
- Monitors all active job postings
- Identifies jobs posted more than 3 days ago with zero applications
- Groups multiple jobs by employer to send consolidated notifications

### Smart Suggestions
The system analyzes each job posting and provides personalized improvement suggestions based on:

- **Salary Information**: Suggests adding or adjusting salary ranges
- **Description Quality**: Recommends optimal description length (200-1000 characters)
- **Requirements**: Advises on the number of requirements (3-8 optimal)
- **Job Details**: Suggests adding missing job type or employment type information
- **Visibility**: Recommends featuring jobs for increased visibility
- **Location Specificity**: Suggests adding more detailed location information
- **Expiry Dates**: Warns about jobs expiring soon

### Email Content
Each notification email includes:
- List of jobs without applications
- Specific improvement suggestions for each job
- Direct links to edit job postings
- General tips for better job postings
- Professional, encouraging tone

## Technical Implementation

### Files Created
- `src/lib/employer-notification-service.ts` - Core notification logic
- `src/app/api/cron/employer-notifications/route.ts` - Cron job endpoint
- `src/app/api/test-employer-notifications/route.ts` - Testing endpoint

### Database Queries
The system uses efficient Prisma queries to:
- Find active jobs older than 3 days with no applications
- Include employer information for personalized emails
- Group results by employer to minimize email volume

### Email Service
- Uses Resend for reliable email delivery
- Supports development mode with test email addresses
- Includes professional HTML email templates
- Handles errors gracefully with logging

## Scheduling

### Production
- Runs daily at 9:00 AM UTC via Vercel cron jobs
- Configured in `vercel.json`
- Requires `CRON_SECRET` environment variable for security

### Development
- Test endpoint available at `/api/test-employer-notifications`
- Only accessible in development mode
- No authentication required for testing

## Configuration

### Environment Variables
- `RESEND_API_KEY` - Required for email sending
- `CRON_SECRET` - Required for production cron job security
- `NEXTAUTH_URL` - Used for generating email links

### Email Settings
- Development: Sends to `delivered@resend.dev`
- Production: Sends to actual employer email addresses
- From address: `Bell Registry <alerts@thebellregistry.com>`

## Usage

### For Employers
No action required - notifications are sent automatically when:
1. A job posting is active
2. The job was posted more than 3 days ago
3. The job has received zero applications

### For Administrators
Monitor the system through:
- Server logs for processing status
- Email delivery confirmations
- Error tracking for failed notifications

## Testing

### Manual Testing
```bash
# In development mode only
POST /api/test-employer-notifications
```

### Cron Job Testing
```bash
# Requires CRON_SECRET
POST /api/cron/employer-notifications
Authorization: Bearer YOUR_CRON_SECRET
```

## Monitoring

### Logs
The system provides detailed logging:
- Number of jobs found without applications
- Number of employers notified
- Individual email send confirmations
- Error details for failed operations

### Success Metrics
- Jobs found without applications
- Emails sent successfully
- Employer engagement with edit links
- Reduction in jobs without applications over time

## Future Enhancements

Potential improvements could include:
- Customizable notification frequency per employer
- A/B testing different suggestion algorithms
- Integration with job performance analytics
- Employer notification preferences in settings
- Follow-up notifications for continued inactivity

## Error Handling

The system includes robust error handling:
- Individual email failures don't stop the entire process
- Detailed error logging for debugging
- Graceful degradation when external services are unavailable
- Retry logic for transient failures 