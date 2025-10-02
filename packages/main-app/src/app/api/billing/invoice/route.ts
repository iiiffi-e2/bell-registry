/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createInvoiceForBillingRecord, getStripeInvoiceUrl } from "@/lib/billing-service";
import { isEmployerOrAgencyRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { billingRecordId } = body;

    if (!billingRecordId) {
      return NextResponse.json({ error: "Billing record ID is required" }, { status: 400 });
    }

    console.log('Processing invoice request for billing record:', billingRecordId);

    // Verify the billing record belongs to the current user
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
      console.log('Billing record not found:', billingRecordId);
      return NextResponse.json({ error: "Billing record not found" }, { status: 404 });
    }

    if (billingRecord.employerProfile.userId !== session.user.id) {
      console.log('Access denied - billing record belongs to different user');
      return NextResponse.json({ error: "Access denied" }, { status: 404 });
    }

    console.log('Creating invoice for billing record:', {
      billingRecordId,
      amount: billingRecord.amount,
      description: billingRecord.description,
      hasStripeCustomerId: !!billingRecord.employerProfile.stripeCustomerId,
      userEmail: billingRecord.employerProfile.user.email
    });

    const invoiceId = await createInvoiceForBillingRecord(billingRecordId);
    console.log('Invoice created with ID:', invoiceId);

    const downloadUrl = await getStripeInvoiceUrl(invoiceId);
    console.log('Download URL retrieved:', !!downloadUrl);

    if (!downloadUrl) {
      return NextResponse.json({ error: "Unable to generate invoice download URL" }, { status: 500 });
    }

    return NextResponse.json({
      invoiceId,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    
    // Return more specific error messages for debugging
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
} 