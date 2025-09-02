# UI Fixes for New Business Rules

## Issue Description

After implementing the new business rules for employer vs agency signups, the UI was still showing old trial-based messaging instead of the new credit-based system. Specifically:

- **EMPLOYER** users were seeing "trial" messaging and "0 of 5 jobs available"
- Dashboard showed "You've reached your job posting limit" for employers with 0 credits
- Subscription page displayed trial expiration dates for employers

## Root Cause

The UI components were using the old `getEmployerSubscription` function and trial-based logic instead of the new credit-based system.

## Fixes Applied

### 1. Updated `getEmployerSubscription` Function
**File:** `packages/main-app/src/lib/subscription-service.ts`

- Added `jobCredits` and `userRole` to the response
- Updated job limit logic to use credits instead of fixed limits
- Maintained backward compatibility for UI components

### 2. Updated Subscription Page
**File:** `packages/main-app/src/app/dashboard/subscription/page.tsx`

**Changes:**
- **Status Section:** Shows credit-based status for employers, trial status for agencies
- **Job Usage Section:** Displays available credits instead of trial limits
- **Business Logic:** Differentiates between EMPLOYER and AGENCY roles

**Before (Employer):**
```
Status: Active (30 days remaining)
Job Posts: 0 / 5
```

**After (Employer):**
```
Status: No Credits (Purchase credits to post jobs)
Credits: 0 Credits (Purchase credits to post jobs)
```

**Before (Agency):**
```
Status: Active (30 days remaining)  
Job Posts: 0 / 5
```

**After (Agency):**
```
Status: Active (30 days remaining)
Credits: 5 Credits (Available to use)
```

### 3. Updated Subscription Alert Component
**File:** `packages/main-app/src/components/subscription/SubscriptionAlert.tsx`

**Changes:**
- **Employer Logic:** Shows credit-based alerts ("No Credits Available", "Low Credits")
- **Agency Logic:** Maintains trial-based alerts with expiration warnings
- **Smart Hiding:** Doesn't show trial expiration for employers

**Alert Types:**

**For Employers:**
- ❌ **Error:** "No Credits Available" (when jobCredits = 0)
- ⚠️ **Warning:** "Low Credits" (when jobCredits ≤ 2)
- ✅ **Info:** "X Credits Available" (when jobCredits > 2)

**For Agencies:**
- ❌ **Error:** "Subscription Expired" or "Job Posting Limit Reached"
- ⚠️ **Warning:** "Subscription Expires Soon" or "Near Job Limit"
- ✅ **Info:** "Subscription Active - TRIAL"

### 4. Updated Subscription Plans Component
**File:** `packages/main-app/src/components/subscription/SubscriptionPlans.tsx`

- Changed "Upgrade Your Account" to "Choose Your Plan" for better UX
- Removed assumption that all TRIAL users need to "upgrade"

## Business Rules Implementation

### EMPLOYER Users
- ❌ No trial period or free job posts
- 🔢 Start with 0 job credits
- 💳 Must purchase credits to post jobs
- 📊 UI shows credit count, not trial limits
- 🚫 No trial expiration warnings

### AGENCY Users  
- ✅ Start with 5 free job credits
- 📅 Have 30-day trial period (for UI purposes)
- 📈 Credits stack with purchases (5 free + 4 bundle = 9 total)
- 📊 UI shows both credits and trial information
- ⏰ Receive trial expiration warnings

## Technical Details

### API Response Changes
The `/api/subscription` endpoint now returns:
```typescript
{
  subscriptionType: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
  jobPostLimit: number | null; // Now equals jobCredits for credit-based
  jobsPostedCount: number;
  jobCredits: number; // NEW: Available credits
  hasNetworkAccess: boolean;
  stripeCustomerId: string | null;
  autoRenew: boolean;
  userRole: string; // NEW: EMPLOYER or AGENCY
}
```

### UI Logic Flow
1. **Check userRole** to determine display logic
2. **EMPLOYER:** Show credit-based messaging
3. **AGENCY:** Show trial + credit messaging
4. **Unlimited Plans:** Override with "Unlimited" messaging

## Testing Verification

### For EMPLOYER Users:
1. ✅ No "trial" messaging appears
2. ✅ Shows "0 Credits" instead of "0 of 5 jobs"
3. ✅ Alert says "No Credits Available" instead of "Job posting limit reached"
4. ✅ Status shows "No Credits" instead of "Active (X days remaining)"

### For AGENCY Users:
1. ✅ Shows "5 Credits Available"
2. ✅ Displays trial expiration information
3. ✅ Credits stack correctly with purchases
4. ✅ Maintains existing trial-based alerts

## Files Modified

1. `packages/main-app/src/lib/subscription-service.ts`
2. `packages/main-app/src/app/dashboard/subscription/page.tsx`
3. `packages/main-app/src/components/subscription/SubscriptionAlert.tsx`
4. `packages/main-app/src/components/subscription/SubscriptionPlans.tsx`

## Impact

- ✅ **EMPLOYER** users now see appropriate credit-based messaging
- ✅ **AGENCY** users maintain trial functionality with credit stacking
- ✅ No breaking changes to existing functionality
- ✅ Backward compatible with existing subscription plans
- ✅ Clear differentiation between user types in UI
