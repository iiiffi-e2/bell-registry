> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Employer vs Agency Business Rules Implementation

## Overview

This document describes the implementation of differentiated business rules for EMPLOYER and AGENCY user signups, as requested.

## Business Rules

### EMPLOYER
- **No free trial**: Employers do not receive any free job posts
- **Zero job credits**: Employers start with 0 job credits
- **Must purchase to post**: Employers must purchase credits (Spotlight, Bundle) or unlimited plans to post jobs

### AGENCY
- **Free trial with credits**: Agencies receive 5 free job credits upon signup
- **Credit stacking**: Free credits stack with purchased bundles (e.g., 5 free + 4 bundle = 9 total)
- **No expiration**: Free credits can be used at any time, they don't expire

## Technical Implementation

### 1. Updated Functions

#### `initializeTrialSubscription()` - `packages/main-app/src/lib/subscription-service.ts`
- Added optional `userRole` parameter
- Applies different business rules based on role:
  - **EMPLOYER**: Sets `jobCredits: 0`, `jobPostLimit: 0`
  - **AGENCY**: Sets `jobCredits: 5`, `jobPostLimit: 5`

#### `canPostJob()` - `packages/main-app/src/lib/subscription-service.ts`
- Simplified logic to focus on credit-based system
- Checks for unlimited posting first, then credits
- No longer uses legacy trial limit logic

#### `handleJobPosting()` - `packages/main-app/src/lib/subscription-service.ts`
- Streamlined to always consume credits when no unlimited posting
- Removed legacy trial handling

### 2. Updated Registration Flows

#### Regular Registration - `packages/main-app/src/app/api/auth/register/route.ts`
- Updated to pass user role to `initializeTrialSubscription()`
- Improved logging to show role-specific initialization

#### OAuth Registration - `packages/main-app/src/lib/auth.ts`
- Updated to pass user role to `initializeTrialSubscription()`
- Maintains consistency with regular registration flow

### 3. Database Schema

The existing schema already supports this implementation:
- `EmployerProfile.jobCredits` - Stores available job post credits
- `EmployerProfile.jobPostLimit` - Used for tracking (set to match initial credits)
- `EmployerProfile.subscriptionType` - Maintains subscription type tracking

## Credit System Flow

### For Agencies
1. **Signup**: Receive 5 free credits
2. **Job Posting**: Each job post consumes 1 credit
3. **Purchase Bundle**: Credits are added to existing balance (stacking)
4. **Example**: Agency starts with 5 credits, buys Bundle (4 credits) → 9 total credits

### For Employers
1. **Signup**: Receive 0 credits
2. **Cannot Post**: No credits available, must purchase
3. **Purchase Bundle**: Credits are added (4 credits for Bundle)
4. **Job Posting**: Each job post consumes 1 credit

## Verification

### Test Script
A test script has been created at `scripts/test-new-business-rules.ts` to verify:
- Employers have 0 credits after signup
- Agencies have 5 credits after signup
- Credit stacking works correctly
- Summary statistics

### Manual Testing
To test the implementation:

1. **Test Employer Signup**:
   ```bash
   # Register as EMPLOYER role
   # Check EmployerProfile: jobCredits should be 0
   ```

2. **Test Agency Signup**:
   ```bash
   # Register as AGENCY role
   # Check EmployerProfile: jobCredits should be 5
   ```

3. **Test Credit Stacking**:
   ```bash
   # Agency purchases Bundle
   # Check EmployerProfile: jobCredits should be 9 (5 + 4)
   ```

## Backward Compatibility

The implementation maintains backward compatibility:
- Existing users are unaffected
- Legacy functions are preserved with deprecation warnings
- Fallback logic handles edge cases

## Files Modified

1. `packages/main-app/src/lib/subscription-service.ts`
2. `packages/main-app/src/app/api/auth/register/route.ts`
3. `packages/main-app/src/lib/auth.ts`

## Files Created

1. `scripts/test-new-business-rules.ts` - Verification script
2. `EMPLOYER_AGENCY_BUSINESS_RULES_IMPLEMENTATION.md` - This documentation

## Impact Assessment

### Positive Impacts
- Clear differentiation between employer types
- Agencies get immediate value (5 free posts)
- Employers have clear upgrade path
- Credit stacking encourages larger purchases

### Considerations
- Existing employers may need communication about changes
- UI/UX should clearly communicate different plans
- Consider grandfathering existing employers if needed

## Next Steps

1. **Test thoroughly** in staging environment
2. **Update UI/UX** to reflect new business rules
3. **Communicate changes** to existing users if needed
4. **Monitor metrics** post-deployment
5. **Consider A/B testing** the impact on conversions
