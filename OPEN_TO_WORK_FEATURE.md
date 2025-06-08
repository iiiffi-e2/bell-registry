# Open to Work Feature Implementation

## Overview

The "Open to Work" feature allows professionals to signal their availability for new job opportunities. This provides clear visibility to employers about which candidates are actively seeking employment.

## Features Implemented

### 1. **Database Schema**
- Added `openToWork` boolean field to `CandidateProfile` model
- Defaults to `false` for new profiles

### 2. **Visual Indicators**
- **Profile Picture Badge**: Green circular badge overlay on profile pictures
- **Inline Badge**: "Open to Work" badge next to professional names
- **Banner Badge**: Prominent banner at the top of profiles when open to work

### 3. **User Interface Components**

#### **OpenToWorkBadge Component**
- Three variants: `overlay`, `inline`, `banner`
- Multiple sizes: `sm`, `md`, `lg`
- Consistent green color scheme

#### **ProfilePictureWithBadge Component**
- Wraps profile pictures with optional open to work badge
- Handles anonymous profiles appropriately

#### **OpenToWorkToggle Component**
- Quick toggle switch for professionals
- Real-time status updates
- Visual feedback during updates

### 4. **Profile Integration**

#### **Professional Dashboard**
- Quick toggle widget for easy status updates
- Prominent placement in dashboard widgets

#### **Profile Forms**
- Checkbox in profile edit forms
- Clear description of feature benefits

#### **Profile Display Pages**
- Banner display when open to work
- Badge next to name/title
- Badge overlay on profile pictures

### 5. **Search and Filtering**
- Employers can filter to show only professionals open to work
- Filter appears in candidate search interface

### 6. **API Endpoints**

#### **Profile Update API** (`/api/profile/route.ts`)
- Handles openToWork field in profile updates

#### **Quick Toggle API** (`/api/profile/open-to-work/route.ts`)
- PATCH endpoint for quick status updates
- Returns updated status

#### **Professional Listings API** (`/api/professionals/route.ts`)
- Includes openToWork field in responses
- Supports openToWork filter parameter

## Usage Guide

### For Professionals

1. **Enable Open to Work Status**:
   - Go to your dashboard
   - Use the "Open to Work Status" toggle widget
   - Or edit your profile and check the "Open to Work" checkbox

2. **Status Visibility**:
   - Green "Open to Work" badge appears next to your name
   - Profile picture gets a green badge overlay
   - Prominent banner displays at the top of your profile

### For Employers

1. **Find Open to Work Professionals**:
   - Go to "Browse Professionals"
   - Use the filter dropdown to select "Open to Work"
   - Only professionals actively seeking opportunities will be shown

2. **Visual Identification**:
   - Green badges clearly identify available candidates
   - Profile pictures have badge overlays for quick recognition

## File Structure

```
src/
├── components/
│   ├── profile/
│   │   └── open-to-work-badge.tsx       # Badge components
│   └── dashboard/
│       └── open-to-work-toggle.tsx      # Dashboard toggle widget
├── app/
│   ├── api/
│   │   ├── profile/
│   │   │   ├── route.ts                 # Profile update API
│   │   │   └── open-to-work/
│   │   │       └── route.ts             # Quick toggle API
│   │   └── professionals/
│   │       └── route.ts                 # Professional listings API
│   ├── professionals/[slug]/
│   │   └── page.tsx                     # Public profile display
│   ├── dashboard/
│   │   └── profile/
│   │       └── page.tsx                 # Dashboard profile view
│   └── browse-professionals/
│       └── page.tsx                     # Professional search
├── prisma/
│   └── schema.prisma                    # Database schema
└── types/
    └── candidate.ts                     # Type definitions
```

## Color Scheme

- **Green**: Used for "Open to Work" status
  - `bg-green-100` / `text-green-700` for badges
  - `bg-green-600` for toggle switches
  - Gradient banners with `from-green-500 to-green-600`

## Responsive Design

- All components are fully responsive
- Mobile-optimized layouts
- Touch-friendly toggle switches

## Accessibility

- Screen reader friendly labels
- Keyboard navigation support
- High contrast color combinations
- Semantic HTML structure

## Performance Considerations

- Minimal database queries
- Efficient API endpoints
- Optimized component rendering
- Cached filter results

## Future Enhancements

1. **Notification System**: Alert employers when professionals they've saved become open to work
2. **Work Preferences**: Allow professionals to specify what type of work they're seeking
3. **Availability Timeline**: Let professionals set when they'll be available
4. **Auto-disable**: Automatically turn off "open to work" after successful placement
5. **Analytics**: Track how the feature affects job placement rates 