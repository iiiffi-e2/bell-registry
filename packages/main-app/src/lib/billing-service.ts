import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/subscription-service";
// import { BillingStatus, SubscriptionType } from "@prisma/client";
import Stripe from "stripe";

// Temporary type definitions until Prisma generates properly
type BillingStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
type SubscriptionType = 'TRIAL' | 'SPOTLIGHT' | 'BUNDLE' | 'UNLIMITED' | 'NETWORK';

export interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  description: string;
  subscriptionType: SubscriptionType;
  status: BillingStatus;
  createdAt: Date;
  stripeInvoiceId: string | null;
  stripeSessionId: string | null;
}

export async function createBillingRecord(
  employerProfileId: string,
  amount: number,
  description: string,
  subscriptionType: SubscriptionType,
  stripeSessionId?: string
) {
  return await (prisma as any).billingHistory.create({
    data: {
      employerProfileId,
      amount,
      description,
      subscriptionType,
      stripeSessionId,
      status: 'PENDING',
    },
  });
}

export async function updateBillingRecordStatus(
  stripeSessionId: string,
  status: BillingStatus,
  stripeInvoiceId?: string
) {
  return await (prisma as any).billingHistory.updateMany({
    where: { stripeSessionId },
    data: {
      status,
      stripeInvoiceId,
      updatedAt: new Date(),
    },
  });
}

export async function getBillingHistory(employerProfileId: string): Promise<BillingHistoryItem[]> {
  const billingHistory = await (prisma as any).billingHistory.findMany({
    where: { employerProfileId },
    orderBy: { createdAt: 'desc' },
  });

  return billingHistory.map((record: any) => ({
    id: record.id,
    amount: record.amount,
    currency: record.currency,
    description: record.description,
    subscriptionType: record.subscriptionType,
    status: record.status,
    createdAt: record.createdAt,
    stripeInvoiceId: record.stripeInvoiceId,
    stripeSessionId: record.stripeSessionId,
  }));
}

export async function ensureStripeCustomer(employerProfile: any): Promise<string> {
  // If we already have a Stripe customer ID, return it
  if (employerProfile.stripeCustomerId) {
    return employerProfile.stripeCustomerId;
  }

  // Create a new Stripe customer
  try {
    const customer = await stripe.customers.create({
      email: employerProfile.user.email,
      name: employerProfile.companyName || `${employerProfile.user.firstName || ''} ${employerProfile.user.lastName || ''}`.trim(),
      metadata: {
        employerProfileId: employerProfile.id,
        userId: employerProfile.userId,
      },
    });

    // Update the employer profile with the new customer ID
    await prisma.employerProfile.update({
      where: { id: employerProfile.id },
      data: { stripeCustomerId: customer.id },
    });

    console.log('Created new Stripe customer:', customer.id);
    return customer.id;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw new Error('Failed to create Stripe customer');
  }
}

export async function createStripeInvoice(
  stripeCustomerId: string,
  amount: number,
  description: string,
  currency: string = 'usd'
): Promise<string> {
  try {
    // Create invoice item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
    });

    // Create invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      auto_advance: false,
    });

    // Finalize the invoice to make it downloadable
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    return finalizedInvoice.id;
  } catch (error) {
    console.error('Error creating Stripe invoice:', error);
    throw new Error('Failed to create invoice');
  }
}

export async function getStripeInvoiceUrl(invoiceId: string): Promise<string | null> {
  try {
    const invoice = await stripe.invoices.retrieve(invoiceId);
    return invoice.invoice_pdf || null;
  } catch (error) {
    console.error('Error retrieving invoice URL:', error);
    return null;
  }
}

export async function createInvoiceForBillingRecord(billingRecordId: string): Promise<string> {
  const billingRecord = await (prisma as any).billingHistory.findUnique({
    where: { id: billingRecordId },
    include: {
      employerProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!billingRecord) {
    throw new Error('Billing record not found');
  }

  // If we already have an invoice ID, return it
  if (billingRecord.stripeInvoiceId) {
    return billingRecord.stripeInvoiceId;
  }

  // Ensure we have a Stripe customer (create one if needed)
  const stripeCustomerId = await ensureStripeCustomer(billingRecord.employerProfile);

  // Create the invoice
  const invoiceId = await createStripeInvoice(
    stripeCustomerId,
    billingRecord.amount,
    billingRecord.description,
    billingRecord.currency
  );

  // Update the billing record with the invoice ID
  await (prisma as any).billingHistory.update({
    where: { id: billingRecordId },
    data: { stripeInvoiceId: invoiceId },
  });

  return invoiceId;
} 