import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Resend } from 'resend';

// Initialize Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not configured');
}
const resend = new Resend(RESEND_API_KEY);

const isDevelopment = process.env.NODE_ENV === 'development';
const FROM_EMAIL = isDevelopment 
  ? 'onboarding@resend.dev'
  : 'The Bell Registry <appeals@thebellregistry.com>';

const APPEAL_REASON_LABELS: Record<string, string> = {
  'mistake': 'This was a mistake',
  'unfair': 'The suspension is unfair',
  'resolved': 'The issue has been resolved',
  'first_time': 'This is my first violation',
  'other': 'Other reason',
};

export async function POST(request: NextRequest) {
  try {
    console.log("[SUSPENSION_APPEAL] Starting appeal submission process");
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("[SUSPENSION_APPEAL] No session found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { reason, details } = await request.json();
    console.log("[SUSPENSION_APPEAL] Appeal received:", { reason, detailsLength: details?.length });

    if (!reason || !details?.trim()) {
      console.log("[SUSPENSION_APPEAL] Missing required fields");
      return new NextResponse("Reason and details are required", { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    console.log("[SUSPENSION_APPEAL] Admin email check:", {
      hasAdminEmail: !!adminEmail,
    });

    if (!adminEmail) {
      console.error("[SUSPENSION_APPEAL] ADMIN_EMAIL not configured");
      return new NextResponse("Admin email not configured", { status: 500 });
    }

    // Get user information
    const userEmail = session.user.email;
    const userName = session.user.name || 'Anonymous User';
    const userRole = session.user.role || 'UNKNOWN';
    const appealReasonLabel = APPEAL_REASON_LABELS[reason] || reason;

    // Generate appeal email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Always use production URL for images in emails
    const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://app.thebellregistry.com';
    const logoUrl = `${imageBaseUrl}/images/brand/logo-bell-registry-email.png`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Logo -->
          <div style="background-color: #121155; padding: 32px; text-align: center;">
            <img src="${logoUrl}" alt="The Bell Registry" style="max-width: 200px; height: auto;" />
          </div>

          <!-- Main Content -->
          <div style="padding: 32px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                ⚖️ Account Suspension Appeal Received
              </h1>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">
                A user has submitted an appeal for their account suspension
              </p>
            </div>

            <!-- Appeal Details -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <div style="margin-bottom: 16px;">
                <strong style="color: #374151; font-size: 14px;">Appeal Reason:</strong>
                <div style="background-color: #eff6ff; color: #1e40af; padding: 8px 12px; border-radius: 6px; margin-top: 4px; display: inline-block; font-weight: 600; font-size: 14px;">
                  ${appealReasonLabel}
                </div>
              </div>
              <div style="margin-bottom: 16px;">
                <strong style="color: #374151; font-size: 14px;">User Information:</strong>
                <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
                  <div><strong>Name:</strong> ${userName}</div>
                  <div><strong>Email:</strong> ${userEmail}</div>
                  <div><strong>Role:</strong> ${userRole}</div>
                  <div><strong>Date:</strong> ${new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>

            <!-- Appeal Content -->
            <div style="background-color: #fefefe; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">Appeal Details:</h4>
              <div style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${details}</div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="mailto:${userEmail}?subject=Re: Your suspension appeal" style="background-color: #121155; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; margin-right: 12px;">
                Reply to User
              </a>
              <a href="${appUrl}/dashboard/admin" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
                View Admin Dashboard
              </a>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from The Bell Registry's appeal system.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Send email to admin
    const toEmail = isDevelopment ? 'delivered@resend.dev' : adminEmail;
    
    console.log('[SUSPENSION_APPEAL] Attempting to send email to admin...', {
      to: toEmail,
      from: FROM_EMAIL,
      isDevelopment,
    });

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `[Suspension Appeal] ${appealReasonLabel} from ${userName}`,
      html: emailHtml,
    });

    console.log(`[SUSPENSION_APPEAL] Appeal email sent successfully:`, emailResponse);

    // Send confirmation email to user
    const userConfirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Logo -->
          <div style="background-color: #121155; padding: 32px; text-align: center;">
            <img src="${logoUrl}" alt="The Bell Registry" style="max-width: 200px; height: auto;" />
          </div>

          <!-- Main Content -->
          <div style="padding: 32px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
                ✅ Appeal Received
              </h1>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">
                We have received your suspension appeal and will review it promptly
              </p>
            </div>

            <!-- Appeal Summary -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 600;">Appeal Summary:</h4>
              <div style="color: #166534; font-size: 14px;">
                <p><strong>Reason:</strong> ${appealReasonLabel}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">What happens next?</h4>
              <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                <p>1. Our support team will review your appeal within 2-3 business days</p>
                <p>2. We will contact you via email with our decision</p>
                <p>3. If approved, your account will be restored immediately</p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Thank you for your patience. If you have any urgent questions, please contact us at support@thebellregistry.com
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Your suspension appeal has been received - The Bell Registry',
      html: userConfirmationHtml,
    });

    console.log(`[SUSPENSION_APPEAL] User confirmation email sent:`, userEmailResponse);

    if (isDevelopment) {
      return NextResponse.json({
        message: "Development mode: Appeal emails simulated.",
        debug: {
          originalAdminEmail: adminEmail,
          testEmail: toEmail,
          appealReason: appealReasonLabel,
          userEmail,
          userName,
          isDevelopment,
          adminEmailResponse: emailResponse,
          userEmailResponse
        }
      });
    }

    return NextResponse.json({ success: true, message: "Appeal submitted successfully" });
  } catch (error) {
    const err = error as Error;
    console.error("[SUSPENSION_APPEAL] Error submitting appeal:", {
      error,
      message: err.message,
      stack: err.stack
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" }, 
      { status: 500 }
    );
  }
} 