> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Survey Feature Implementation

## Overview

A comprehensive user survey system has been implemented to collect feedback from users two days after they sign up. The survey appears as both a modal popup and a dismissible banner on the dashboard, directing users to a Google Form for feedback collection.

## Features

### Timing Logic
- **Trigger**: Survey appears 2 days after user signup
- **Modal Display**: Shows as a modal on the first login of each day (when survey is eligible)
- **Banner Display**: Shows as a dismissible banner on the dashboard when survey is eligible
- **One-time**: Once dismissed, the survey will not appear again for that user

### User Interface Components

#### Survey Modal
- **Professional Design**: Clean, branded modal with The Bell Registry styling
- **Clear Messaging**: Encourages user feedback with friendly, professional copy
- **Two Actions**:
  - **"Take Survey"**: Opens Google Form in new tab and marks survey as dismissed
  - **"Maybe Later"**: Dismisses the modal but keeps banner visible
- **X Button**: Close modal without dismissing (banner remains)

#### Survey Banner
- **Dashboard Integration**: Appears at the top of dashboard content
- **Blue Theme**: Matches application color scheme
- **Multiple Dismiss Options**:
  - Take Survey button (opens form and dismisses)
  - Maybe Later link (dismisses banner)
  - X button (dismisses banner)
- **Responsive Design**: Works on desktop and mobile

### Backend Logic
- **Database Tracking**: Uses `surveyDismissedAt` field in User table
- **Smart Timing**: Calculates days since signup to determine eligibility
- **Secure API**: Requires authentication to check status or dismiss survey
- **Efficient Queries**: Uses optimized database queries for performance

## Implementation Details

### Database Schema
Added to User model in `prisma/schema.prisma`:
```sql
surveyDismissedAt DateTime? @db.Timestamptz(6)
```

### Files Created/Modified

#### New Files
1. `src/components/modals/survey-modal.tsx` - Survey modal component
2. `src/components/survey/survey-banner.tsx` - Dashboard banner component
3. `src/lib/survey-service.ts` - Core survey logic and database operations
4. `src/hooks/use-survey.ts` - React hook for survey state management
5. `src/app/api/survey/status/route.ts` - API endpoint to check survey status
6. `src/app/api/survey/dismiss/route.ts` - API endpoint to dismiss survey
7. `src/app/api/test-survey/route.ts` - Development testing endpoint
8. `prisma/migrations/20250616183230_add_survey_dismissed_at/` - Database migration
9. `SURVEY_FEATURE.md` - This documentation file

#### Modified Files
1. `src/app/dashboard/layout.tsx` - Integration of survey components
2. `prisma/schema.prisma` - Added surveyDismissedAt field

## Configuration

### Google Form Integration
- **Survey URL**: `https://docs.google.com/forms/d/e/1FAIpQLSfi8WG5Xne8t-jqSI269rk7onph11UajjD0TUg77diGeCLxiQ/viewform`
- **Target**: Opens in new tab (`_blank`)
- **Auto-dismiss**: Automatically marks survey as dismissed when user clicks "Take Survey"

### Database Migration
Applied migration adds the `surveyDismissedAt` field:
```sql
ALTER TABLE "User" ADD COLUMN "surveyDismissedAt" TIMESTAMPTZ;
```

## Usage

### For Users
1. **Day 1-2**: No survey appears (too early)
2. **Day 2+**: Survey becomes eligible
3. **First login of day**: Modal appears automatically
4. **Subsequent logins**: Only banner appears (if not dismissed)
5. **Taking survey**: Opens Google Form, survey permanently dismissed
6. **Dismissing**: Can dismiss modal/banner, survey permanently dismissed

### For Developers

#### Survey Status Response
```typescript
interface SurveyStatus {
  shouldShowSurvey: boolean;    // True if user is eligible (2+ days, not dismissed)
  shouldShowModal: boolean;     // True if modal should auto-show
  shouldShowBanner: boolean;    // True if banner should be visible
  daysSinceSignup: number;      // Days since user created account
}
```

#### API Endpoints
- `GET /api/survey/status` - Check if user should see survey
- `POST /api/survey/dismiss` - Mark survey as dismissed for user
- `GET/POST /api/test-survey` - Development testing (dev only)

#### React Hook Usage
```typescript
const {
  surveyStatus,           // Current survey status
  isLoading,             // Loading state
  isModalOpen,           // Modal visibility
  setIsModalOpen,        // Control modal visibility
  dismissSurvey,         // Function to dismiss survey
} = useSurvey();
```

## Testing

### Development Testing
Use the test endpoint to verify functionality:

```bash
# Check survey status
GET /api/test-survey

# Test dismissing survey
POST /api/test-survey
Content-Type: application/json
{
  "action": "dismiss"
}
```

### Manual Testing Scenarios
1. **New User**: Create account, wait 2 days, check modal appears
2. **Existing User**: Check that users created 2+ days ago see survey
3. **Dismissal**: Verify survey doesn't reappear after dismissal
4. **Modal Timing**: Check modal only shows on first daily login
5. **Banner Persistence**: Verify banner stays visible until dismissed

### Database Testing
Check survey status directly:
```sql
SELECT 
  id, 
  email, 
  "createdAt", 
  "surveyDismissedAt",
  EXTRACT(DAYS FROM (NOW() - "createdAt")) as days_since_signup
FROM "User" 
WHERE "surveyDismissedAt" IS NULL
  AND "createdAt" < NOW() - INTERVAL '2 days';
```

## User Experience Flow

### First-Time Experience (Day 2+)
1. User logs into dashboard
2. Modal appears with survey request
3. User can:
   - Take survey → Google Form opens, survey dismissed
   - Click "Maybe Later" → Modal closes, banner remains
   - Click X → Modal closes, banner remains

### Subsequent Visits
1. If not dismissed: Banner appears on dashboard
2. User can take survey or dismiss from banner
3. Once dismissed: Never appears again

## Error Handling

### Client-Side
- Failed API calls are logged to console
- Survey state gracefully handles loading and error states
- User interactions remain functional even if backend fails

### Server-Side
- Comprehensive error logging with prefixed messages
- Database query failures are caught and logged
- API endpoints return appropriate HTTP status codes
- Development mode provides detailed error information

## Performance Considerations

### Database
- Indexed fields for efficient querying (`lastLoginAt`, etc.)
- Raw SQL queries for optimal performance
- Minimal data transfer (only necessary fields)

### Frontend
- Survey status cached in React state
- Lazy loading of survey components
- Minimal re-renders through efficient state management

## Security Features

- **Authentication Required**: All API endpoints require valid session
- **Input Validation**: Server-side validation of all inputs
- **SQL Injection Protection**: Uses parameterized queries
- **Development Restrictions**: Test endpoints only work in development

## Future Enhancements

Potential improvements that could be implemented:
1. **Multiple Survey Types**: Support different surveys for different user segments
2. **Survey Scheduling**: Configure different timing rules via admin panel
3. **A/B Testing**: Test different survey messaging or timing
4. **Analytics Integration**: Track survey completion rates and responses
5. **Custom Survey Forms**: Build surveys directly in the application
6. **Reminder System**: Send email reminders for incomplete surveys
7. **Survey Responses**: Store and analyze responses within the application
8. **Admin Dashboard**: View survey statistics and manage survey settings

## Monitoring and Maintenance

### Key Metrics to Track
- Survey appearance rate (eligible users who see survey)
- Modal display rate (users who see modal vs banner only)
- Survey completion rate (users who click "Take Survey")
- Dismissal rate (users who dismiss without taking survey)
- Days-to-completion (average time from eligibility to completion)

### Regular Maintenance
- Monitor survey completion rates and adjust messaging if needed
- Review database performance for survey-related queries
- Update Google Form link if survey changes
- Clean up old survey data if privacy policies require

### Troubleshooting
- Check database migration status if survey not appearing
- Verify Google Form link is accessible
- Review server logs for API endpoint errors
- Test survey flow after any authentication changes
``` 