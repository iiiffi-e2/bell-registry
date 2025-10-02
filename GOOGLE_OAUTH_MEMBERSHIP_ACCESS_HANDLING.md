> Copyright © 2025 Bell Registry. All rights reserved.
> Unauthorized copying, distribution, modification, or use is prohibited.
> Proprietary and confidential.
>

# Google OAuth Membership Access Field Handling

## Overview

This document explains how the new `membershipAccess` and `referralProfessionalName` fields are handled when users sign up using Google OAuth instead of the traditional registration form.

## Problem

When users choose to sign up with Google OAuth, they are redirected to Google's authentication flow before completing the registration form. This means the form data (including `membershipAccess` and `referralProfessionalName`) is not available during the OAuth process.

## Solution

We implemented a two-phase approach to handle this:

### Phase 1: Store Form Data Before OAuth Redirect

When a user clicks "Sign up with Google" in the registration form:

1. **Form Data Collection**: The `handleGoogleSignIn` function collects the current form data:
   - `role` (from Step 2 form)
   - `membershipAccess` (from Step 1 form)
   - `referralProfessionalName` (from Step 1 form)

2. **Validation Requirements**: Users must complete all required fields before Google OAuth is enabled:
   - Email address (required)
   - Terms and conditions (must be accepted)
   - Membership access type (required for professionals)
   - Professional referral name (required if "Professional Referral" is selected)

3. **Temporary Storage**: This data is stored in `sessionStorage` as `pendingOAuthData`

4. **OAuth Redirect**: The user is redirected to Google OAuth with the stored data

```typescript
// Check if Google OAuth button should be disabled
const isGoogleOAuthDisabled = () => {
  const email = stepOneForm.watch("email");
  const membershipAccess = stepOneForm.watch("membershipAccess");
  const referralProfessionalName = stepOneForm.watch("referralProfessionalName");
  const terms = stepOneForm.watch("terms");

  // Email is required
  if (!email || email.trim().length === 0) return true;

  // Terms must be accepted
  if (!terms) return true;

  // For professionals, membership access is required
  if (!isEmployerRoute && !isAgencyRoute) {
    if (!membershipAccess) return true;
    
    // If referred by professional, referral name is required
    if (membershipAccess === "PROFESSIONAL_REFERRAL" && (!referralProfessionalName || referralProfessionalName.trim().length === 0)) {
      return true;
    }
  }

  return false;
};

const handleGoogleSignIn = () => {
  setIsLoading(true);
  
  // Store form data temporarily for OAuth completion
  const formData = {
    role: stepTwoForm.watch("role"),
    membershipAccess: stepOneForm.watch("membershipAccess"),
    referralProfessionalName: stepOneForm.watch("referralProfessionalName"),
  };
  
  // Store in sessionStorage (will be cleared after OAuth completion)
  sessionStorage.setItem("pendingOAuthData", JSON.stringify(formData));
  
  signIn("google", { 
    callbackUrl: "/dashboard",
    role: stepTwoForm.watch("role")
  });
};
```

### Phase 2: Complete Registration After OAuth

After successful OAuth authentication:

1. **User Creation**: NextAuth.js creates the user with default values:
   - `membershipAccess: "NEW_APPLICANT"` (default)
   - `referralProfessionalName: null`

2. **OAuth Completion Component**: The `OAuthCompletion` component in the dashboard layout:
   - Checks for pending OAuth data in `sessionStorage`
   - If found, calls the `/api/auth/complete-oauth` endpoint
   - Updates the user's profile with the stored form data
   - Clears the temporary data
   - Redirects to the dashboard

3. **API Update**: The `/api/auth/complete-oauth` endpoint:
   - Validates the session
   - Updates the user's `membershipAccess` and `referralProfessionalName`
   - Returns success confirmation

## Implementation Details

### New Files Created

1. **`packages/main-app/src/app/api/auth/complete-oauth/route.ts`**
   - API endpoint for completing OAuth registration
   - Updates user profile with membership access data

2. **`packages/main-app/src/components/auth/oauth-completion.tsx`**
   - React component that handles OAuth completion
   - Integrated into dashboard layout

### Modified Files

1. **`packages/main-app/src/components/auth/register-form.tsx`**
   - Updated `handleGoogleSignIn` to store form data
   - Added temporary storage before OAuth redirect

2. **`packages/main-app/src/lib/auth.ts`**
   - Added default values for new fields during OAuth user creation
   - Ensures all OAuth users have a valid `membershipAccess` value

3. **`packages/main-app/src/app/dashboard/layout.tsx`**
   - Integrated `OAuthCompletion` component
   - Handles post-OAuth registration completion

## User Experience Flow

### New User Registration via Google OAuth

1. User fills out Step 1 (email, membership access, terms)
2. **Google OAuth button is disabled until all required fields are completed**
3. User clicks "Sign up with Google" (only enabled when validation passes)
4. Form data is stored temporarily
5. User is redirected to Google OAuth
6. After successful authentication, user is redirected to dashboard
7. OAuth completion component automatically updates their profile
8. User sees their dashboard with complete profile

### Existing User Login via Google OAuth

1. User clicks "Sign in with Google" on login form
2. No form data to store (regular login)
3. User is redirected to Google OAuth
4. After successful authentication, user is redirected to dashboard
5. OAuth completion component detects no pending data
6. User proceeds directly to dashboard

## Error Handling

- **Missing Pending Data**: If no pending OAuth data is found, user is redirected to dashboard normally
- **API Failures**: If the completion API fails, error is displayed and user is redirected after delay
- **Data Validation**: All data is validated before updating the user profile
- **Session Security**: Only authenticated users can complete OAuth registration

## Security Considerations

- Form data is stored in `sessionStorage` (cleared after use)
- API endpoint requires valid authentication session
- Data validation using Zod schemas
- Temporary data is automatically cleaned up

## Benefits

1. **Seamless Experience**: Users can complete registration with Google OAuth without losing form data
2. **Data Integrity**: All users have complete membership access information
3. **Admin Visibility**: Admins can see how all professionals gained access to the platform
4. **Fallback Handling**: Graceful handling of both new registrations and existing user logins
5. **Clean Architecture**: Separation of concerns between OAuth and profile completion
6. **Enforced Validation**: Users cannot bypass required fields when using Google OAuth
7. **Clear User Feedback**: Visual indicators show exactly what needs to be completed

## Validation Requirements

Before users can use Google OAuth, they must complete:

- **Email Address**: Valid email format required
- **Terms & Conditions**: Must be accepted
- **Membership Access**: Must select a type (for professionals)
- **Professional Referral Name**: Required if "Professional Referral" is selected

The Google OAuth button is visually disabled and shows helpful text explaining what needs to be completed.

## Testing Scenarios

1. **New Professional Registration**: Complete form + Google OAuth
2. **New Employer Registration**: Complete form + Google OAuth  
3. **Existing User Login**: Google OAuth login (no form data)
4. **Error Handling**: Network failures, validation errors
5. **Data Persistence**: Verify data is correctly stored and retrieved

## Future Enhancements

- Add analytics tracking for OAuth vs. traditional registration
- Implement profile completion reminders for OAuth users
- Add support for additional OAuth providers
- Enhanced error reporting and user feedback 