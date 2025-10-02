> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Subscription and Job-Posting Access System

This document describes the implementation of a subscription-based access control system for employers and agencies using Stripe for payment processing.

## Overview

The system enforces access control for job posting based on subscription plans. All employers start with a 30-day trial that allows posting up to 5 jobs. After the trial expires or job limit is reached, they must purchase a paid plan to continue posting jobs.

## Architecture

### Database Schema Changes

The `EmployerProfile` model has been extended with subscription-related fields:

```prisma
model EmployerProfile {
  // ... existing fields ...
  subscriptionType       SubscriptionType @default(TRIAL)
  subscriptionStartDate  DateTime         @default(now())
  subscriptionEndDate    DateTime?
  jobPostLimit           Int?             @default(5)
  jobsPostedCount        Int              @default(0)
}

enum SubscriptionType {
  TRIAL
  SPOTLIGHT
  BUNDLE
  UNLIMITED
  NETWORK
}
```

### Subscription Plans

| Plan | Job Limit | Duration | Price | Features |
|------|-----------|----------|--------|----------|
| Trial | 5 jobs | 30 days | Free | Basic job posting |
| Spotlight | 10 jobs | 30 days | $29.99 | Enhanced visibility |
| Bundle | 25 jobs | 30 days | $59.99 | Multiple job postings |
| Unlimited | Unlimited | 30 days | $99.99 | Unlimited job postings |
| Network | Unlimited | 30 days | $199.99 | Premium network access |

## Core Functions

### Helper Functions

Located in `src/lib/subscription-service.ts`:

#### `hasActiveSubscription(employerId: string): Promise<boolean>`
Checks if an employer has an active subscription (trial or paid).

#### `canPostJob(employerId: string): Promise<boolean>`
Determines if an employer can post a new job based on:
- Active subscription status
- Job posting limits
- Count of active (non-expired) jobs

#### `incrementJobPostCount(employerId: string): Promise<void>`
Increments the job post count after successful job creation.

### Job Expiration Logic

Jobs are considered expired and don't count against limits after:
- 60 days from creation date (automatic expiry)
- Manual expiration via `expiresAt` field
- Status changed to `CLOSED`, `EXPIRED`, or `FILLED`

## API Endpoints

### Subscription Management

#### GET `/api/subscription`
Returns current subscription details and available plans.

**Response:**
```json
{
  "subscription": {
    "subscriptionType": "TRIAL",
    "subscriptionStartDate": "2024-01-01T00:00:00.000Z",
    "subscriptionEndDate": null,
    "jobPostLimit": 5,
    "jobsPostedCount": 2
  },
  "plans": { /* plan configurations */ }
}
```

#### POST `/api/subscription`
Creates a Stripe checkout session for plan upgrade.

**Request:**
```json
{
  "subscriptionType": "SPOTLIGHT"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

#### GET `/api/subscription/can-post-job`
Checks if user can post a job.

**Response:**
```json
{
  "canPostJob": true,
  "hasActiveSubscription": true
}
```

### Stripe Webhook

#### POST `/api/subscription/webhook`
Handles Stripe webhook events for payment confirmations.

Processes:
- `checkout.session.completed` - Updates subscription after successful payment
- `payment_intent.succeeded` - Logs successful payments

## Job Posting Integration

The job posting endpoint (`POST /api/jobs`) has been updated to:

1. Check subscription status before allowing job creation
2. Increment job post count after successful creation
3. Return specific error codes for subscription limits

**Error Response for Limit Reached:**
```json
{
  "error": "Job posting limit reached or subscription expired",
  "code": "SUBSCRIPTION_LIMIT_REACHED"
}
```

## Frontend Integration

### Subscription Checks

Before showing job posting forms, check user permissions:

```typescript
const checkPermissions = async () => {
  const response = await fetch('/api/subscription/can-post-job');
  const { canPostJob, hasActiveSubscription } = await response.json();
  
  if (!canPostJob) {
    // Show upgrade prompt or subscription expired message
  }
};
```

### Handling Subscription Upgrades

```typescript
const upgradeSubscription = async (plan: string) => {
  const response = await fetch('/api/subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscriptionType: plan })
  });
  
  const { checkoutUrl } = await response.json();
  window.location.href = checkoutUrl;
};
```

## Environment Variables

Required environment variables for Stripe integration:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Product IDs for each subscription plan
STRIPE_SPOTLIGHT_PRODUCT_ID=prod_spotlight_product_id
STRIPE_BUNDLE_PRODUCT_ID=prod_bundle_product_id
STRIPE_UNLIMITED_PRODUCT_ID=prod_unlimited_product_id
STRIPE_NETWORK_PRODUCT_ID=prod_network_product_id
```

## Stripe Setup

### 1. Create Products in Stripe Dashboard

For each subscription plan, create a product in Stripe and set the corresponding environment variable.

### 2. Configure Webhook

Create a webhook endpoint in Stripe pointing to: `https://yourdomain.com/api/subscription/webhook`

Subscribe to these events:
- `checkout.session.completed`
- `payment_intent.succeeded`

### 3. Test Mode

Use Stripe test keys for development. Test card numbers:
- `4242424242424242` - Visa (success)
- `4000000000000002` - Card declined

## Data Migration

For existing employers, run the migration script to initialize subscription fields:

```bash
npx tsx scripts/update-employer-subscriptions.ts
```

This script:
- Sets `subscriptionType` to `TRIAL` for existing employers
- Initializes `jobPostLimit` to 5
- Sets `jobsPostedCount` to 0
- Uses `createdAt` as `subscriptionStartDate` if not set

## Security Considerations

1. **Server-side Validation**: All subscription checks are performed server-side
2. **Webhook Signature Verification**: Stripe webhooks are verified using the webhook secret
3. **Authentication**: All endpoints require valid user sessions
4. **Role-based Access**: Only employers and agencies can access subscription features

## Testing

### Unit Tests

Test the core subscription functions:

```typescript
import { canPostJob, hasActiveSubscription } from '@/lib/subscription-service';

// Test trial period
// Test job limits
// Test expired subscriptions
// Test unlimited plans
```

### Integration Tests

Test the complete flow:
1. User starts with trial
2. Posts jobs up to limit
3. Attempts to exceed limit (should fail)
4. Upgrades subscription
5. Can post more jobs

### Manual Testing

1. Create a test employer account
2. Verify trial subscription is active
3. Post jobs up to the limit
4. Try posting beyond limit (should fail)
5. Test Stripe checkout flow
6. Verify subscription upgrade
7. Confirm increased posting ability

## Monitoring and Analytics

### Key Metrics to Track

1. **Subscription Conversions**: Trial to paid plan conversion rate
2. **Plan Distribution**: Which plans are most popular
3. **Job Posting Patterns**: How job limits affect user behavior
4. **Churn Rate**: How many users cancel subscriptions

### Logging

The system logs important events:
- Subscription status checks
- Job posting attempts and failures
- Payment processing events
- Webhook processing

## Troubleshooting

### Common Issues

1. **Prisma Type Errors**: If Prisma client doesn't export `SubscriptionType`, use the temporary enum in the service file
2. **Webhook Failures**: Verify webhook secret and endpoint URL in Stripe dashboard
3. **Permission Errors**: Ensure Windows file permissions allow Prisma generation
4. **Environment Variables**: Double-check all Stripe configuration variables

### Debug Commands

```bash
# Check database schema
npx prisma studio

# View webhook events
# Check Stripe dashboard -> Developers -> Webhooks

# Test subscription service
npx tsx -e "import('./src/lib/subscription-service').then(s => s.hasActiveSubscription('user-id'))"
```

## Future Enhancements

1. **Recurring Subscriptions**: Implement monthly/yearly recurring billing
2. **Usage Analytics**: Track detailed job posting analytics
3. **Plan Customization**: Allow custom job limits for enterprise clients
4. **Prorated Upgrades**: Handle mid-cycle plan changes with prorated billing
5. **Grace Period**: Allow brief posting after subscription expiry
6. **Multi-user Accounts**: Support multiple users per company subscription 