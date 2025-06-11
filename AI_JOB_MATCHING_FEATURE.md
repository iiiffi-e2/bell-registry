# AI-Powered Job Matching Feature Documentation

## Overview

The AI-Powered Job Matching feature revolutionizes how professionals discover relevant job opportunities by using OpenAI's GPT-4 to intelligently analyze compatibility between user profiles and available job listings.

## Key Features

### ✨ Intelligent Analysis
- **AI-Powered Scoring**: Uses GPT-4 to provide 0-100 compatibility scores
- **Multi-Factor Analysis**: Evaluates 6 key matching factors
- **Human-Readable Reasoning**: Clear explanations for each recommendation
- **Top 5 Results**: Shows the most relevant job matches
- **Real-Time Refresh**: Manual refresh capability for updated matches
- **Save Job Functionality**: One-click saving of interesting matches for later review

### 🎯 Detailed Scoring Factors

#### **Role Match** (0-100): Job title similarity to preferred role
- **90-100**: Exact or very similar role match
- **70-89**: Related role with transferable skills  
- **50-69**: Somewhat related role
- **30-49**: Different but possibly relevant
- **0-29**: Unrelated role

#### **Location Match** (0-100): Geographic compatibility with proximity scoring
- **100**: Same city as current/preferred location
- **80-99**: Same metro area or within 25 miles
- **60-79**: Same state or within 50 miles
- **40-59**: Same region or within 100 miles  
- **20-39**: Different region, relocation required
- **0-19**: Very distant, major relocation needed
- **+20 bonus**: If candidate is open to relocation

#### **Salary Match** (0-100): Salary range overlap and adequacy
- **90-100**: Job range fully meets or exceeds candidate expectations
- **70-89**: Good overlap (50%+ of candidate range covered)
- **50-69**: Partial overlap (25-50% coverage)
- **30-49**: Minimal overlap (job max touches candidate min)
- **10-29**: Below expectations but possibly negotiable
- **0-9**: Far below candidate expectations

#### **Experience Match** (0-100): Years of experience vs role requirements
- **90-100**: Perfect experience match for role level
- **70-89**: Good fit, slightly under/over qualified
- **50-69**: Acceptable fit with some gaps
- **30-49**: Under/over qualified but workable
- **0-29**: Significant experience mismatch

#### **Skills Match** (0-100): Skills alignment with job requirements
- **90-100**: Candidate has most/all required skills
- **70-89**: Strong skill overlap
- **50-69**: Moderate skill match
- **30-49**: Some relevant skills
- **0-29**: Few matching skills

#### **Preference Match** (0-100): Alignment with seeking opportunities
- **90-100**: Perfect alignment with stated preferences
- **70-89**: Good match for most preferences
- **50-69**: Mixed alignment
- **30-49**: Some misalignment but acceptable
- **0-29**: Poor fit with preferences

## Technical Implementation

### Database Schema
```prisma
model JobMatch {
  id           String   @id @default(cuid())
  userId       String
  jobId        String
  score        Float    // 0-100 matching score
  reasoning    String   // AI-generated reasoning
  matchFactors Json     // Detailed factor scores
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  job          Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  
  @@unique([userId, jobId])
  @@index([userId])
  @@index([score])
}
```

### API Endpoints

#### GET `/api/ai/job-matches`
Fetches AI-generated job matches for authenticated user.

**Authentication**: Required (NextAuth session)

**Response Example**:
```json
{
  "matches": [
    {
      "jobId": "clw123abc",
      "score": 85,
      "reasoning": "This role is an excellent match because your experience in project management aligns perfectly with the requirements, and the location matches your preferences.",
      "matchFactors": {
        "roleMatch": 90,
        "locationMatch": 80,
        "skillsMatch": 85,
        "experienceMatch": 90,
        "salaryMatch": 75,
        "preferenceMatch": 88
      },
      "job": {
        "id": "clw123abc",
        "title": "Senior Project Manager",
        "location": "New York, NY",
        "urlSlug": "senior-project-manager-nyc",
        "employer": {
          "employerProfile": {
            "companyName": "Tech Solutions Inc."
          }
        }
      },
      "link": "/dashboard/jobs/senior-project-manager-nyc"
    }
  ],
  "totalMatches": 5
}
```

#### POST `/api/ai/job-matches`
Forces refresh of job matches for authenticated user.

**Response**:
```json
{
  "message": "Job matches refreshed successfully",
  "count": 5
}
```

### File Structure
```
src/
├── lib/
│   └── ai-job-matching-service.ts     # Core matching logic
├── app/api/ai/job-matches/
│   └── route.ts                       # API endpoints
├── components/
│   ├── ai-job-matches.tsx            # Main UI component
│   ├── ui/
│   │   └── progress.tsx              # Progress bar component
│   └── dashboard/
│       └── professional-dashboard.tsx # Dashboard integration
```

## AI Service Implementation

### Core Algorithm
1. **Profile Analysis**: Extracts user's skills, preferences, location, salary expectations
2. **Job Scanning**: Retrieves active job listings (max 50 for performance)
3. **AI Analysis**: Sends structured prompt to GPT-4 for compatibility analysis
4. **Score Generation**: AI provides numerical scores and reasoning
5. **Result Processing**: Validates, filters, and sorts results by score

### OpenAI Configuration
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

// Model: GPT-4
// Temperature: 0.3 (consistent, factual responses)
// Max Tokens: 3000 (detailed analysis)
// Token Optimization: Analyzes 20 jobs max, truncated content
```

## User Experience

### Professional Dashboard Integration
The AI Job Matches component appears prominently on the professional dashboard:
- Positioned after profile completion alert and stats
- Before the widgets row for maximum visibility
- Includes refresh button and error handling
- Responsive design for all screen sizes

### Visual Design
- **Match Scores**: Color-coded badges (green: 80+, yellow: 60-79, red: <60)
- **Progress Bars**: Visual representation of each matching factor
- **Company Info**: Company name, location, salary (if available)
- **Action Buttons**: "View Job Details" and "Save Job" (encourages users to read full details before applying)

## Performance & Optimization

### Smart Caching Strategy
- **Intelligent Loading**: Checks for cached matches first, avoids unnecessary AI calls on every page load
- **24-Hour Cache Validity**: Cached matches remain fresh for 24 hours to balance accuracy and efficiency
- **Database Storage**: Results stored in JobMatch table to avoid re-computation
- **Manual Refresh**: Users can force refresh when needed or when cache is stale
- **Visual Indicators**: Shows last updated timestamp and suggests refresh when needed
- **Cost Optimization**: Prevents excessive OpenAI API usage on dashboard reloads

### API Endpoints
- **GET `/api/ai/job-matches/cached`**: Returns cached matches without AI processing
- **POST `/api/ai/job-matches`**: Forces new AI analysis and refreshes cache

### Rate Limiting
- OpenAI API has built-in rate limiting
- 20 job limit per analysis for token optimization
- Timeout protection (30 seconds)

### Error Handling
- Graceful fallbacks for API failures
- User-friendly error messages
- Retry mechanisms for transient failures

## Security Considerations

### Data Privacy
- User data only sent to OpenAI for analysis
- No persistent storage in OpenAI systems
- Match results stored securely in application database

### Authentication
- Requires valid NextAuth session
- User can only access their own matches
- Proper authorization checks on all endpoints

## Deployment Requirements

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_database_connection_string
```

### Database Migration
```bash
# Apply schema changes
npx prisma db push

# Regenerate Prisma client
npx prisma generate
```

### Dependencies
- `openai`: ^4.98.0
- `@prisma/client`: Latest
- `next-auth`: For authentication
- `lucide-react`: For icons

## Monitoring & Analytics

### Key Metrics to Track
- Match generation success rate
- User engagement with recommendations
- Application conversion from matches
- OpenAI API usage and costs
- Response times and error rates

### Logging
- All API errors logged to console
- Failed AI analyses tracked
- User interaction events for analytics

## Future Enhancements

### Planned Improvements
1. **Feedback Loop**: User rating system to improve AI accuracy
2. **Real-Time Updates**: Live match updates as new jobs are posted
3. **Advanced Filtering**: Additional matching criteria and preferences
4. **Batch Notifications**: Email alerts for new high-scoring matches
5. **Machine Learning**: Custom models trained on successful matches

### Scalability Considerations
- Background job processing for large-scale matching
- Redis caching layer for frequently accessed data
- Database optimization for growing user base
- A/B testing framework for prompt optimization

## Troubleshooting

### Common Issues

**"No job matches found"**
- Verify user has complete profile
- Check for active jobs in database
- Confirm OpenAI API key configuration
- Review API logs for errors

**Poor match quality**
- Ensure job descriptions are detailed
- Verify user profile completeness
- Consider refining AI prompt
- Review scoring criteria

**Performance issues**
- Monitor OpenAI API response times
- Check database query performance
- Consider implementing additional caching
- Review rate limiting settings

### Debug Steps
1. Check browser console for client-side errors
2. Review server logs for API failures
3. Verify database connectivity
4. Test OpenAI API key validity
5. Confirm user authentication status

## API Testing

### Manual Testing
```bash
# Test GET endpoint
curl -H "Authorization: Bearer <session-token>" \
     http://localhost:3002/api/ai/job-matches

# Test POST endpoint (refresh)
curl -X POST \
     -H "Authorization: Bearer <session-token>" \
     http://localhost:3002/api/ai/job-matches
```

### Test Data Requirements
- User with complete CandidateProfile
- Multiple active Job listings
- Varied job types and locations
- Different salary ranges and requirements

## Cost Considerations

### OpenAI Usage
- Approximately 2000-3000 tokens per analysis
- Cost varies based on GPT-4 pricing
- Consider usage limits for cost control
- Monitor monthly API usage

### Optimization Tips
- Batch multiple jobs in single API call
- Cache results to reduce API calls
- Implement smart refresh timing
- Consider usage-based user limits

---

**Implementation Status**: ✅ Complete
**Testing Status**: ✅ Ready for QA
**Documentation Status**: ✅ Complete
**Deployment Status**: 🔄 Ready for Production 