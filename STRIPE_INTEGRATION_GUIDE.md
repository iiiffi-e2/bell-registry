> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Stripe Integration Guide - Updated Pricing Structure

This guide covers the complete Stripe Checkout integration for the updated subscription plans with new pricing and features.

## Updated Subscription Plans

| Plan | Price | Job Posts | Duration | Special Features |
|------|-------|-----------|----------|------------------|
| **Spotlight** | $250 | 1 | 30 days | Standard visibility |
| **Hiring Bundle** | $650 | 3 | 30 days | Enhanced visibility, Priority support |
| **Unlimited** | $1,250 | Unlimited | 60 days | Maximum visibility, Advanced analytics |
| **Network** | $5,000 | 3 | 90 days | Private candidate network access |

## Implementation Overview

### 1. Core Components

#### **PurchasePlanButton Component**
```typescript
// Usage
<PurchasePlanButton 
  planType="BUNDLE"
  planName="Hiring Bundle"
  price={650}
  variant="default"
>
  Purchase Bundle - $650
</PurchasePlanButton>
```

#### **SubscriptionPlans Component**
- Displays all available plans in a responsive grid
- Shows current plan status
- Handles plan comparisons and features
- Integrates with PurchasePlanButton

#### **Subscription Dashboard**
- Complete subscription management interface
- Real-time usage tracking
- Expiration warnings
- Network access indicators

### 2. Database Schema Updates

```sql
-- New fields added to EmployerProfile
ALTER TABLE "EmployerProfile" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "EmployerProfile" ADD COLUMN "stripeSessionId" TEXT;
ALTER TABLE "EmployerProfile" ADD COLUMN "hasNetworkAccess" BOOLEAN DEFAULT false;
```

### 3. API Endpoints

#### **POST /api/subscription**
Creates Stripe Checkout session for plan purchase.

**Request:**
```json
{
  "subscriptionType": "BUNDLE"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_..."
}
```

#### **POST /api/subscription/webhook**
Handles Stripe webhook events for payment completion.

**Webhook Events:**
- `checkout.session.completed` - Finalizes subscription
- `payment_intent.succeeded` - Logs successful payment

### 4. Subscription Flow

```
1. User selects plan → PurchasePlanButton clicked
2. API creates Stripe Checkout session
3. User redirected to Stripe Checkout
4. Payment processed by Stripe
5. Webhook updates subscription in database
6. User redirected to success page
7. Subscription activated immediately
```

## Environment Configuration

### Required Environment Variables

```env
# Stripe Keys (use test keys for development)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# You can remove these product ID variables since we're using price_data
# STRIPE_SPOTLIGHT_PRODUCT_ID=prod_...
# STRIPE_BUNDLE_PRODUCT_ID=prod_...
# STRIPE_UNLIMITED_PRODUCT_ID=prod_...
# STRIPE_NETWORK_PRODUCT_ID=prod_...
```

### Stripe Dashboard Configuration

#### 1. **Webhook Setup**
- Endpoint URL: `https://yourdomain.com/api/subscription/webhook`
- Events to send:
  ```
  checkout.session.completed
  payment_intent.succeeded
  ```

#### 2. **Test Mode Setup**
- Use test mode for development
- Test webhook with Stripe CLI: `stripe listen --forward-to localhost:3000/api/subscription/webhook`

## Component Integration Examples

### 1. **Adding to Dashboard**
```tsx
// In your employer dashboard
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";

export default function EmployerDashboard() {
  return (
    <div>
      {/* Other dashboard content */}
      <SubscriptionPlans currentPlan="TRIAL" />
    </div>
  );
}
```

### 2. **Individual Plan Purchase**
```tsx
// For specific plan promotion
import { PurchasePlanButton } from "@/components/subscription/PurchasePlanButton";

export default function UpgradePage() {
  return (
    <div>
      <h2>Upgrade to Unlimited</h2>
      <PurchasePlanButton 
        planType="UNLIMITED"
        planName="Unlimited"
        price={1250}
        className="w-full"
      />
    </div>
  );
}
```

### 3. **Subscription Status Check**
```tsx
// Check if user can post jobs
const [canPost, setCanPost] = useState(false);

useEffect(() => {
  const checkPermission = async () => {
    const response = await fetch('/api/subscription/can-post-job');
    const data = await response.json();
    setCanPost(data.canPostJob);
  };
  
  checkPermission();
}, []);
```

## Payment Flow Details

### 1. **Checkout Session Creation**
```typescript
// The createCheckoutSession function creates a session with:
{
  payment_method_types: ["card"],
  line_items: [{
    price_data: {
      currency: "usd",
      product_data: {
        name: "Hiring Bundle",
        description: "3 job posts for 30 days"
      },
      unit_amount: 65000 // $650.00 in cents
    },
    quantity: 1
  }],
  mode: "payment", // One-time payment
  success_url: "https://yourdomain.com/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}",
  cancel_url: "https://yourdomain.com/dashboard/subscription",
  metadata: {
    employerId: "user_123",
    subscriptionType: "BUNDLE"
  }
}
```

### 2. **Webhook Processing**
```typescript
// When payment succeeds, the webhook:
1. Verifies the webhook signature
2. Extracts employerId and subscriptionType from metadata
3. Updates employer record with:
   - New subscription type
   - Start/end dates
   - Job post limits
   - Stripe customer ID
   - Reset job post count to 0
   - Network access flag (for Network plan)
```

### 3. **Success Page Handling**
```typescript
// The success page:
1. Receives session_id from Stripe redirect
2. Waits for webhook processing (2 second delay)
3. Fetches updated subscription status
4. Shows confirmation and next steps
```

## Network Plan Special Features

### Database Fields
```typescript
interface EmployerProfile {
  // ... other fields
  hasNetworkAccess: boolean; // true for Network plan subscribers
  subscriptionEndDate: Date; // 90 days from purchase for Network plan
}
```

### Access Control
```typescript
// Check network access
const hasNetworkAccess = await checkNetworkAccess(employerId);

if (hasNetworkAccess) {
  // Show private candidate profiles
  // Enable direct messaging
  // Access to premium features
}
```

## Testing Guide

### 1. **Test Card Numbers**
```
Success: 4242424242424242
Decline: 4000000000000002
Require 3DS: 4000002500003155
```

### 2. **Test Webhook Locally**
```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/subscription/webhook

# Test a payment
stripe samples create checkout-single-subscription
```

### 3. **Manual Testing Checklist**
- [ ] Trial user can see all plans
- [ ] Clicking purchase button redirects to Stripe
- [ ] Successful payment updates subscription
- [ ] Failed payment doesn't change subscription
- [ ] Webhook processes correctly
- [ ] Success page shows confirmation
- [ ] Job posting limits update immediately
- [ ] Network access granted for Network plan

## Error Handling

### Common Issues and Solutions

#### 1. **Webhook Signature Verification Failed**
```
Error: No signatures found matching the expected signature for payload
```
**Solution:** Check webhook secret in environment variables

#### 2. **Checkout Session Creation Failed**
```
Error: Cannot create checkout session for free plan
```
**Solution:** This is expected behavior for trial plans

#### 3. **Payment Processing Delay**
```
User: "I paid but my subscription hasn't updated"
```
**Solution:** Webhook processing can take a few seconds. The success page includes a 2-second delay.

## Security Best Practices

### 1. **Webhook Security**
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Log webhook events for debugging

### 2. **Payment Security**
- Never store card details
- Use Stripe's secure checkout
- Validate all server-side operations

### 3. **Access Control**
- Check subscription status server-side
- Don't rely on client-side validation
- Verify user permissions for each action

## Monitoring and Analytics

### Key Metrics to Track
1. **Conversion Rates**
   - Trial to paid conversions
   - Most popular plan selections
   - Checkout abandonment rates

2. **Revenue Metrics**
   - Monthly recurring revenue
   - Average revenue per user
   - Plan distribution

3. **Usage Patterns**
   - Job posting frequency by plan
   - Network feature usage
   - Subscription renewal rates

### Logging Implementation
```typescript
// Log important events
console.log('Subscription created:', {
  employerId,
  subscriptionType,
  amount: plan.price,
  timestamp: new Date().toISOString()
});
```

## Deployment Checklist

### Before Going Live
- [ ] Switch to production Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Test webhook with production environment
- [ ] Set up monitoring for webhook failures
- [ ] Configure customer support contact information
- [ ] Test all payment flows end-to-end
- [ ] Verify subscription enforcement works correctly
- [ ] Set up backup payment processing alerts

### Post-Deployment
- [ ] Monitor webhook success rates
- [ ] Track conversion metrics
- [ ] Set up customer support for billing issues
- [ ] Monitor for failed payments
- [ ] Set up automated subscription status checks

The Stripe integration is now complete and ready for production use with the updated pricing structure and enhanced features. 