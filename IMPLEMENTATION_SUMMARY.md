# Job View Tracking Implementation

## Overview
We have successfully implemented job view tracking functionality that tracks when users view job listings. The implementation includes:

### 1. Database Schema Changes
- Added `JobViewEvent` model to track individual job views
- Added relationship between `Job` and `JobViewEvent`
- Added relationship between `User` and `JobViewEvent` (optional for anonymous users)

### 2. API Endpoints

#### Job View Tracking
- `POST /api/jobs/[slug]/view` - Records a view event for a specific job
- Only tracks views from users who are NOT the job creator (employer/agency)
- Supports both authenticated and anonymous users
- **Rate Limiting**: Users can only increment view count once per hour per job
- **Duplicate Prevention**: Prevents multiple tracking calls from the same page load

#### Employer Dashboard APIs
- Updated `GET /api/dashboard/employer/jobs` - Now includes view counts for each job
- Updated `GET /api/dashboard/employer/stats` - Now includes total views across all jobs

### 3. Frontend Integration

#### Public Job Details Page (`/jobs/[slug]`)
- Automatically tracks views when users visit job detail pages
- Makes a POST request to the view tracking endpoint after loading job details
- **Prevents duplicate calls** using React refs to track if view has been recorded for current page load
- Silently handles any tracking failures
- Includes debug logging for tracking results

#### Employer Dashboard
- Job listings table shows view counts for each job
- Total views widget displays aggregate view count
- Views are displayed alongside applicant counts

### 4. Business Logic
- **Excluded Views**: Job creators (employers/agencies) viewing their own jobs do not increment view counts
- **Included Views**: All other users (professionals, other employers, anonymous users) increment view counts
- **Anonymous Tracking**: Views from non-logged-in users are tracked but without user association
- **Rate Limiting**: All users (authenticated and anonymous) can only increment views once per hour per job using cookie-based tracking
- **Duplicate Prevention**: Multiple API calls from the same page load are prevented

### 5. Implementation Details

#### View Tracking Rules
1. When a user visits a job detail page (`/jobs/[slug]`), a view is tracked
2. The system checks if the viewer is the job creator
3. If the viewer is NOT the creator, it checks for a rate-limiting cookie
4. If no valid cookie exists, a new `JobViewEvent` record is created and a cookie is set
5. Cookie-based rate limiting works for both authenticated and anonymous users
6. Frontend prevents duplicate API calls within the same page session

#### Rate Limiting Logic
- **All Users**: Can only increment view count once per hour per job using cookies
- **Cookie-Based**: Uses HTTP-only cookies with job-specific names (`job_viewed_{jobId}`)
- **Time Window**: 1 hour (3600 seconds)
- **Performance**: No database queries needed for rate limiting checks
- **Privacy**: Cookies are HTTP-only and secure in production

#### Cookie Implementation
- **Cookie Name Format**: `job_viewed_{jobId}` (e.g., `job_viewed_abc123`)
- **Cookie Value**: Timestamp when view was recorded
- **Cookie Settings**:
  - `maxAge`: 1 hour (3600 seconds)
  - `httpOnly`: true (prevents JavaScript access)
  - `secure`: true in production (HTTPS only)
  - `sameSite`: 'lax' (CSRF protection)

#### Database Structure
```sql
JobViewEvent {
  id: String (UUID)
  jobId: String (Foreign Key to Job)
  userId: String? (Optional Foreign Key to User)
  viewedAt: DateTime (Timestamp of view)
}
```

#### Error Handling
- View tracking failures do not affect the main job viewing functionality
- Errors are logged but users can still view job details even if tracking fails
- API endpoints return appropriate HTTP status codes
- Frontend resets tracking state on errors to allow retry

### 6. API Response Format
```json
{
  "success": true,
  "tracked": true|false,
  "reason": "rate_limited" | "own_job" | null
}
```

### 7. Files Modified
- `prisma/schema.prisma` - Added JobViewEvent model
- `src/app/api/jobs/[slug]/view/route.ts` - View tracking endpoint with rate limiting
- `src/app/api/dashboard/employer/jobs/route.ts` - Added view counts
- `src/app/api/dashboard/employer/stats/route.ts` - Added total views
- `src/app/jobs/[slug]/page.tsx` - Added view tracking call with duplicate prevention

### 8. Security & Performance Features
- **Rate Limiting**: Cookie-based prevention of view manipulation (no database overhead)
- **Duplicate Prevention**: Prevents accidental multiple tracking from UI
- **SQL Injection Protection**: Uses parameterized queries
- **Error Boundaries**: Tracking failures don't break core functionality
- **Debug Logging**: Console logging for troubleshooting (can be removed in production)
- **Performance Optimized**: No database queries for rate limiting
- **Cross-Session Tracking**: Works for both authenticated and anonymous users

### 9. Future Enhancements
- Configurable rate limiting windows (currently 1 hour)
- Analytics dashboard showing view trends over time
- View-to-application conversion rates
- Popular job categories based on views
- Geographic view distribution
- Time-based view analytics (daily/weekly/monthly)
- View heatmaps and user engagement metrics 