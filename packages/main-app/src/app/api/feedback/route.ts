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
  : 'The Bell Registry <feedback@thebellregistry.com>';

const FEEDBACK_TYPE_LABELS: Record<string, string> = {
  'bug_report': 'Bug Report',
  'feature_request': 'Feature Request',
  'design_feedback': 'Design Feedback',
  'not_working': 'Something Not Working',
  'general': 'General Feedback',
  'other': 'Other',
};

export async function POST(request: NextRequest) {
  try {
    console.log("[FEEDBACK] Starting feedback submission process");
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log("[FEEDBACK] No session found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { type, details } = await request.json();
    console.log("[FEEDBACK] Feedback received:", { type, detailsLength: details?.length });

    if (!type || !details?.trim()) {
      console.log("[FEEDBACK] Missing required fields");
      return new NextResponse("Type and details are required", { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    console.log("[FEEDBACK] Admin email check:", {
      hasAdminEmail: !!adminEmail,
    });

    if (!adminEmail) {
      console.error("[FEEDBACK] ADMIN_EMAIL not configured");
      return new NextResponse("Admin email not configured", { status: 500 });
    }

    // Get user information
    const userEmail = session.user.email;
    const userName = session.user.name || 'Anonymous User';
    const userRole = session.user.role || 'UNKNOWN';
    const feedbackTypeLabel = FEEDBACK_TYPE_LABELS[type] || type;

    // Generate feedback email
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
                💬 New User Feedback Received
              </h1>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">
                A user has submitted feedback through the application
              </p>
            </div>

            <!-- Feedback Details -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <div style="margin-bottom: 16px;">
                <strong style="color: #374151; font-size: 14px;">Feedback Type:</strong>
                <div style="background-color: #eff6ff; color: #1e40af; padding: 8px 12px; border-radius: 6px; margin-top: 4px; display: inline-block; font-weight: 600; font-size: 14px;">
                  ${feedbackTypeLabel}
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

            <!-- Feedback Content -->
            <div style="background-color: #fefefe; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">Feedback Details:</h4>
              <div style="color: #374151; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${details}</div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="mailto:${userEmail}?subject=Re: Your feedback - ${feedbackTypeLabel}" style="background-color: #121155; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; margin-right: 12px;">
                Reply to User
              </a>
              <a href="${appUrl}/dashboard/admin" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
                View Dashboard
              </a>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from The Bell Registry's feedback system.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Send email to admin
    const toEmail = isDevelopment ? 'delivered@resend.dev' : adminEmail;
    
    console.log('[FEEDBACK] Attempting to send email to admin...', {
      to: toEmail,
      from: FROM_EMAIL,
      isDevelopment,
    });

    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `[Feedback] ${feedbackTypeLabel} from ${userName}`,
      html: emailHtml,
    });

    console.log(`[FEEDBACK] Feedback email sent successfully:`, emailResponse);

    if (isDevelopment) {
      return NextResponse.json({
        message: "Development mode: Feedback email simulated.",
        debug: {
          originalAdminEmail: adminEmail,
          testEmail: toEmail,
          feedbackType: feedbackTypeLabel,
          userEmail,
          userName,
          isDevelopment,
          emailResponse
        }
      });
    }

    return NextResponse.json({ success: true, message: "Feedback submitted successfully" });
  } catch (error) {
    const err = error as Error;
    console.error("[FEEDBACK] Error submitting feedback:", {
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