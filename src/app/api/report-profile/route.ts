import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  : 'Bell Registry <noreply@bellregistry.com>';

export async function POST(request: NextRequest) {
  try {
    console.log('[REPORT_PROFILE] Starting request processing...');
    
    const session = await getServerSession(authOptions);
    console.log('[REPORT_PROFILE] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id
    });
    
    if (!session?.user) {
      console.log('[REPORT_PROFILE] No session found, returning 401');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { profileId, profileName, reason, details } = await request.json();
    console.log('[REPORT_PROFILE] Request data:', {
      profileId,
      profileName,
      reason,
      hasDetails: !!details
    });

    if (!profileId || !profileName || !reason) {
      console.log('[REPORT_PROFILE] Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    console.log('[REPORT_PROFILE] Environment check:', {
      hasAdminEmail: !!adminEmail,
      hasResendKey: !!RESEND_API_KEY,
      nodeEnv: isDevelopment ? 'development' : 'production'
    });

    if (!adminEmail) {
      console.error('[REPORT_PROFILE] ADMIN_EMAIL environment variable is not configured');
      // In development, just log the report instead of failing
      if (isDevelopment) {
        console.log('[REPORT_PROFILE] DEVELOPMENT MODE - Report would be sent to admin:', {
          profileId,
          profileName,
          reason,
          details,
          reporter: session.user.email
        });
        return NextResponse.json({
          message: "Development mode: Report logged to console (ADMIN_EMAIL not configured)",
          debug: {
            profileName,
            reason,
            reporter: session.user.email
          }
        });
      }
      return NextResponse.json(
        { error: "Admin email not configured" },
        { status: 500 }
      );
    }

    // Get profile slugs for links
    const [reportedUser, reporterUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: profileId },
        select: { profileSlug: true, firstName: true, lastName: true }
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { profileSlug: true, firstName: true, lastName: true }
      })
    ]);

    // Generate email content
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const reporterName = session.user.name || session.user.email || 'Unknown User';
    const reporterEmail = session.user.email || 'Unknown Email';
    
    // Create profile links
    const reportedProfileLink = reportedUser?.profileSlug 
      ? `${baseUrl}/professionals/${reportedUser.profileSlug}`
      : 'Profile link not available';
    
    const reporterProfileLink = reporterUser?.profileSlug 
      ? `${baseUrl}/professionals/${reporterUser.profileSlug}`
      : 'Profile link not available';
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="background-color: #fef3c7; color: #92400e; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              ⚠️
            </div>
            <h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">
              Profile Report Submitted
            </h1>
            <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">
              A user has reported a professional profile for review
            </p>
          </div>

          <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Report Details</h3>
            <div style="space-y: 8px;">
              <div style="margin-bottom: 8px;">
                <strong style="color: #374151;">Reported Profile:</strong> ${profileName}
                ${reportedUser?.profileSlug ? `<br><a href="${reportedProfileLink}" style="color: #2563eb; text-decoration: none; font-size: 14px;">→ View Reported Profile</a>` : ''}
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #374151;">Profile ID:</strong> ${profileId}
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #374151;">Reason:</strong> ${reason}
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #374151;">Reporter:</strong> ${reporterName} (${reporterEmail})
                ${reporterUser?.profileSlug ? `<br><a href="${reporterProfileLink}" style="color: #2563eb; text-decoration: none; font-size: 14px;">→ View Reporter Profile</a>` : ''}
              </div>
              <div style="margin-bottom: 8px;">
                <strong style="color: #374151;">Date:</strong> ${new Date().toLocaleString()}
              </div>
            </div>
          </div>

          ${details ? `
            <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Additional Details:</h4>
              <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                ${details}
              </p>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <a href="${baseUrl}/dashboard/admin" style="background-color: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; margin-right: 12px;">
              Review Profile
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
              This is an automated notification from Bell Registry's reporting system.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email to admin
    const toEmail = isDevelopment ? 'delivered@resend.dev' : adminEmail;
    
    console.log('[REPORT_PROFILE] Attempting to send email...');
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Profile Report: ${profileName} - ${reason}`,
      html: emailHtml,
    });

    console.log(`[REPORT_PROFILE] Profile report email sent successfully:`, emailResponse);

    if (isDevelopment) {
      return NextResponse.json({
        message: "Development mode: Report email simulated",
        debug: {
          adminEmail,
          testEmail: toEmail,
          profileName,
          reason,
          reporter: reporterName,
          emailResponse
        }
      });
    }

    return NextResponse.json({ 
      message: "Report submitted successfully" 
    });

  } catch (error) {
    console.error('[REPORT_PROFILE] Error handling profile report:', error);
    return NextResponse.json(
      { 
        error: "Failed to submit report",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 