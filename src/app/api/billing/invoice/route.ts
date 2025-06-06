import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createInvoiceForBillingRecord, getStripeInvoiceUrl } from "@/lib/billing-service";
import { isEmployerOrAgencyRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

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

    if (!billingRecord || billingRecord.employerProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Billing record not found or access denied" }, { status: 404 });
    }

    const invoiceId = await createInvoiceForBillingRecord(billingRecordId);
    const downloadUrl = await getStripeInvoiceUrl(invoiceId);

    if (!downloadUrl) {
      return NextResponse.json({ error: "Unable to generate invoice download URL" }, { status: 500 });
    }

    return NextResponse.json({
      invoiceId,
      downloadUrl,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 