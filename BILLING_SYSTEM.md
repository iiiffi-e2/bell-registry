# Billing System Documentation

## Overview

The billing system provides comprehensive billing history tracking and invoice management for employers and agencies using The Bell Registry platform. It integrates with Stripe to automatically create billing records and generate downloadable invoices.

## Features

- **Billing History Tracking**: Automatically tracks all subscription purchases and payments
- **Invoice Generation**: Creates downloadable PDF invoices through Stripe
- **Status Management**: Tracks payment status (Pending, Completed, Failed, Refunded)
- **User Interface**: Clean, modern billing dashboard with summary cards and detailed transaction table

## Database Schema

### BillingHistory Model

```prisma
model BillingHistory {
  id                String            @id @default(cuid())
  employerProfileId String
  amount            Float             // Amount in dollars (e.g., 250.00)
  currency          String            @default("usd")
  description       String            // What was purchased (e.g., "Spotlight Plan - 1 Job Post")
  subscriptionType  SubscriptionType
  stripeSessionId   String?           // Stripe checkout session ID
  stripeInvoiceId   String?           // Stripe invoice ID for downloadable invoices
  status            BillingStatus     @default(PENDING)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  employerProfile   EmployerProfile   @relation(fields: [employerProfileId], references: [id], onDelete: Cascade)
  
  @@index([employerProfileId])
  @@index([status])
  @@index([createdAt])
}

enum BillingStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}
```

## API Endpoints

### GET /api/billing
Retrieves billing history for the authenticated employer/agency.

**Response:**
```json
{
  "billingHistory": [
    {
      "id": "clx123...",
      "amount": 250.00,
      "currency": "usd",
      "description": "Spotlight Plan - 1 job post for 30 days",
      "subscriptionType": "SPOTLIGHT",
      "status": "COMPLETED",
      "createdAt": "2024-06-06T01:41:47.000Z",
      "stripeInvoiceId": "in_1234...",
      "stripeSessionId": "cs_test_1234..."
    }
  ]
}
```

### POST /api/billing/invoice
Generates and retrieves a downloadable invoice for a billing record.

**Request:**
```json
{
  "billingRecordId": "clx123..."
}
```

**Response:**
```json
{
  "invoiceId": "in_1234...",
  "downloadUrl": "https://files.stripe.com/invoices/..."
}
```

## Components

### Billing Page (`/dashboard/billing`)
- **Location**: `src/app/dashboard/billing/page.tsx`
- **Features**:
  - Summary cards showing total spent, last transaction, and available invoices
  - Detailed transaction table with filtering and status badges
  - One-click invoice download functionality
  - Responsive design with loading states

### Navigation Integration
The billing page is accessible through the dashboard navigation for employers and agencies:
- **Employers**: Dashboard → Billing
- **Agencies**: Dashboard → Billing

## Service Functions

### Billing Service (`src/lib/billing-service.ts`)

#### `createBillingRecord()`
Creates a new billing record when a payment is initiated.

#### `updateBillingRecordStatus()`
Updates the status of a billing record (e.g., from PENDING to COMPLETED).

#### `getBillingHistory()`
Retrieves all billing records for an employer profile.

#### `createStripeInvoice()`
Creates a Stripe invoice for a billing record.

#### `getStripeInvoiceUrl()`
Retrieves the downloadable PDF URL for a Stripe invoice.

#### `createInvoiceForBillingRecord()`
Creates or retrieves an invoice for a specific billing record.

## Integration with Subscription System

The billing system is automatically integrated with the existing subscription system:

1. **Payment Processing**: When a subscription payment is completed via Stripe webhook, a billing record is automatically created
2. **Status Updates**: Payment status changes are reflected in billing records
3. **Invoice Generation**: Invoices are generated on-demand when users request them

### Modified Functions

#### `handleSuccessfulPayment()` in `subscription-service.ts`
Now creates billing records and updates their status when payments are processed.

## Usage Examples

### Accessing Billing History
1. Navigate to `/dashboard/billing` as an employer or agency
2. View summary cards for quick insights
3. Browse detailed transaction history in the table
4. Download invoices for completed transactions

### Downloading Invoices
1. Find the desired transaction in the billing history table
2. Click the "Download" button for completed transactions
3. Invoice PDF will open in a new tab

## Error Handling

- **Authentication**: Ensures only authenticated employers/agencies can access billing data
- **Authorization**: Verifies users can only access their own billing records
- **Stripe Integration**: Handles Stripe API errors gracefully with user-friendly messages
- **Loading States**: Provides visual feedback during API calls and invoice generation

## Security Considerations

- All billing data is scoped to the authenticated user's employer profile
- Stripe invoice URLs are temporary and secure
- API endpoints include proper authentication and authorization checks
- Sensitive billing information is never exposed in client-side code

## Future Enhancements

- **Email Invoices**: Automatically email invoices to customers
- **Bulk Downloads**: Allow downloading multiple invoices at once
- **Payment Methods**: Display payment method information
- **Refund Management**: Handle refunds through the interface
- **Billing Alerts**: Notify users of failed payments or upcoming renewals 