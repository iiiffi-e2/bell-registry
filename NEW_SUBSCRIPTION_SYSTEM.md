# New Subscription System Implementation

This document outlines the implementation of the new purchase options, enforcement logic, and renewal behavior as specified in the requirements.

## Product Definitions Implemented

### Spotlight (One-time Credits)
- **Price**: $250
- **Entitlement**: 1 job post credit
- **Purchase limit**: No limit; can be bought repeatedly
- **Listing duration**: 45 days per publish
- **Credits behavior**: Accumulate across purchases, no time limit while stored

### Hiring Bundle (One-time Credits)
- **Price**: $750
- **Entitlement**: 4 job post credits
- **Purchase limit**: No limit; can be bought repeatedly
- **Listing duration**: 45 days per publish
- **Credits behavior**: Accumulate across purchases, no time limit while stored

### Unlimited (Annual) Subscription
- **Price**: $1,500 per year
- **Entitlement**: Unlimited job posting during active subscription
- **Listing duration**: 45 days per publish
- **Renewal**: Auto-renews annually until canceled
- **Enforcement**: Credits are not consumed while this subscription is active

### Network Access Membership
- **Quarterly**: $5,000 per quarter
- **Annual**: $17,500 per year
- **Entitlements**:
  - Unlimited job posting during active subscription
  - Full visibility of professional profiles
  - Ability to message professionals directly
- **Listing duration**: 45 days per publish
- **Renewal**: Auto-renews on chosen cadence until canceled

## Database Schema Changes

### EmployerProfile Model Extensions
```sql
-- New fields added
jobCredits INTEGER DEFAULT 0
networkAccessEndDate TIMESTAMP(3)
unlimitedPostingEndDate TIMESTAMP(3)
autoRenew BOOLEAN DEFAULT false
renewalPeriod TEXT -- 'QUARTERLY' or 'ANNUAL'
```

### Job Model Extensions
```sql
-- New field added
listingCloseDate TIMESTAMP(3)
```

### New Subscription Types
```sql
-- Added to SubscriptionType enum
NETWORK_QUARTERLY
```

## Core Logic Implementation

### Job Posting Eligibility
1. Check for active unlimited-posting entitlement (Unlimited Annual or Network Access)
2. If unlimited posting active: Allow posting without consuming credits
3. If no unlimited posting: Check for available job credits
4. Consume 1 credit per successful publish/relist when unlimited posting not active

### Listing Lifecycle
1. All job postings automatically set `listingCloseDate` to 45 days from publish
2. Background job (`/api/cron/close-expired-listings`) closes listings after 45 days
3. Job records never expire in account, only listings close
4. Relisting allowed anytime, follows same eligibility rules as new posting

### Credit System
- Credits accumulate across multiple purchases
- Credits have no expiration date while stored
- Credits are banked (not consumed) while unlimited posting is active
- Credits are only decremented on successful publish/relist when no unlimited entitlement

### Subscription Management
- Auto-renewal enabled by default for subscriptions
- Cancellation prevents renewal but benefits continue until term end
- Background job (`/api/cron/process-renewals`) handles automatic renewals
- Subscription state changes are idempotent to prevent double-application

## API Endpoints

### New Endpoints Created
- `POST /api/jobs/[slug]/relist` - Relist a closed job
- `GET /api/subscription/status` - Get detailed subscription status
- `POST /api/subscription/cancel` - Cancel auto-renewal
- `POST /api/cron/close-expired-listings` - Close expired job listings
- `POST /api/cron/process-renewals` - Process subscription renewals

### Modified Endpoints
- `POST /api/jobs` - Updated to set 45-day listing close date and handle credit consumption

## Key Functions

### Subscription Service (`/lib/subscription-service.ts`)
- `hasActiveUnlimitedPosting()` - Check for unlimited posting entitlement
- `hasActiveNetworkAccess()` - Check for network access permissions
- `canPostJob()` - Determine posting eligibility based on credits/subscriptions
- `handleJobPosting()` - Consume credits if no unlimited posting active
- `getSubscriptionStatus()` - Get comprehensive subscription status
- `processSubscriptionRenewals()` - Handle automatic renewals
- `cancelSubscription()` - Cancel auto-renewal

### Job Lifecycle Service (`/lib/job-lifecycle-service.ts`)
- `closeExpiredListings()` - Close listings past 45-day limit
- `getJobsExpiringSoon()` - Get jobs expiring within 7 days
- `getListingLifecycleStats()` - Get monitoring statistics

## UI Components

### Updated Components
- `SubscriptionPlans.tsx` - Updated to show new pricing and product definitions
- `SubscriptionStatus.tsx` - New component showing credit balance and subscription status

### Display Logic
- Credit-based products show "One-time" purchase with credit count
- Subscription products show renewal period and auto-renewal status
- Network Access products clearly indicate profile visibility and messaging access
- Warning notifications for subscriptions expiring within 7 days

## Enforcement Rules

### Posting Eligibility
1. Organization may publish without consuming credits if any unlimited-posting entitlement is active
2. If no unlimited entitlement active, publishing consumes 1 job credit
3. Credit consumption occurs once per listing action (including relist)

### Network Access Permissions
- Full profile visibility only during active Network Access subscription
- Direct messaging only during active Network Access subscription
- Unlimited Annual does not include network access features

### Subscription Continuity
- New unlimited/access subscription while another active = continuous unlimited posting
- Benefits remain active until end of paid term when canceled
- Existing job records remain after subscription ends, listings auto-close per schedule

## Monitoring and Maintenance

### Background Jobs
- Daily cron job to close expired listings
- Daily cron job to process subscription renewals
- Logging and monitoring for all subscription state changes

### Consistency Safeguards
- Idempotent payment processing prevents double-application
- Credit transactions are atomic to prevent race conditions
- Subscription state validation on all posting attempts

## Testing Recommendations

1. **Purchase Flow Testing**
   - Test credit purchases accumulate properly
   - Test subscription purchases activate unlimited posting
   - Test Network Access enables profile visibility and messaging

2. **Enforcement Testing**
   - Test posting blocked when no credits and no unlimited subscription
   - Test credits consumed only when unlimited posting not active
   - Test relisting follows same rules as initial posting

3. **Renewal Testing**
   - Test auto-renewal extends subscription properly
   - Test cancellation prevents renewal but maintains benefits until term end
   - Test renewal failure handling

4. **Lifecycle Testing**
   - Test 45-day listing auto-closure
   - Test job records persist after listing closure
   - Test relisting functionality

This implementation provides a complete, scalable system that meets all specified requirements while maintaining consistency and preventing edge cases.
