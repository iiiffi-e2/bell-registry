import { Resend } from 'resend';

// Lazy initialization of Resend client
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}

const isDevelopment = process.env.NODE_ENV === 'development';

interface SuspensionNotificationData {
  userEmail: string;
  userName: string;
  userRole: string;
  suspensionReason?: string;
  suspensionNote?: string;
  suspendedByAdmin?: {
    name: string;
    email: string;
  } | null;
  suspendedAt: Date;
}

interface BanNotificationData {
  userEmail: string;
  userName: string;
  userRole: string;
  bannedByAdmin?: {
    name: string;
    email: string;
  } | null;
  bannedAt: Date;
}

interface UnsuspensionNotificationData {
  userEmail: string;
  userName: string;
  userRole: string;
  unsuspendedByAdmin?: {
    name: string;
    email: string;
  } | null;
  unsuspendedAt: Date;
}

export async function sendSuspensionNotification(data: SuspensionNotificationData) {
  try {
    const FROM_EMAIL = isDevelopment 
      ? 'onboarding@resend.dev'
      : 'The Bell Registry <notifications@bellregistry.com>';

    // Generate suspension email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://app.bellregistry.com';
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
                ⚠️ Account Suspended
              </h1>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">
                Your account has been temporarily suspended
              </p>
            </div>

            <div style="text-align: left; margin-bottom: 24px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                Dear ${data.userName},
              </p>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                We are writing to inform you that your account on The Bell Registry has been temporarily suspended.
              </p>
            </div>

            <!-- Suspension Details -->
            <div style="background-color: #fef3cd; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">Suspension Details:</h4>
              <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
                ${data.suspensionReason ? `<p style="margin: 0 0 8px 0;"><strong>Reason:</strong> ${data.suspensionReason}</p>` : ''}
                ${data.suspensionNote ? `<p style="margin: 0 0 8px 0;"><strong>Admin Note:</strong> ${data.suspensionNote}</p>` : ''}
                <p style="margin: 0;"><strong>Date:</strong> ${data.suspendedAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>

            <!-- What This Means -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">What This Means:</h4>
              <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;">• Your account access has been temporarily restricted</p>
                <p style="margin: 0 0 8px 0;">• You can still view your profile and submit an appeal</p>
                <p style="margin: 0 0 8px 0;">• You cannot apply for jobs or send messages</p>
                <p style="margin: 0;">• Your profile may not be visible to employers</p>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 600;">What You Can Do:</h4>
              <div style="color: #166534; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;">1. Review the suspension details above</p>
                <p style="margin: 0 0 8px 0;">2. If you believe this is an error, submit an appeal</p>
                <p style="margin: 0 0 8px 0;">3. Contact our support team if you have questions</p>
                <p style="margin: 0;">4. Wait for our team to review your case</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="${appUrl}/account-suspended" style="background-color: #121155; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; margin-right: 12px; margin-bottom: 8px;">
                View Details & Submit Appeal
              </a>
              <a href="mailto:support@bellregistry.com?subject=Account Suspension - ${data.userEmail}" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
                Contact Support
              </a>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from The Bell Registry. If you believe this is an error, please contact us immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    const toEmail = isDevelopment ? 'delivered@resend.dev' : data.userEmail;
    
    console.log('[SUSPENSION_NOTIFICATION] Sending suspension email to:', data.userEmail);

    const emailResponse = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Your account has been suspended - The Bell Registry',
      html: emailHtml,
    });

    console.log('[SUSPENSION_NOTIFICATION] Suspension email sent successfully:', emailResponse);

    if (isDevelopment) {
      return {
        message: "Development mode: Suspension email simulated.",
        debug: {
          originalEmail: data.userEmail,
          testEmail: toEmail,
          isDevelopment,
          emailResponse
        }
      };
    }

    return emailResponse;
  } catch (error) {
    console.error('[SUSPENSION_NOTIFICATION] Error sending suspension email:', error);
    throw error;
  }
}

export async function sendBanNotification(data: BanNotificationData) {
  try {
    const FROM_EMAIL = isDevelopment 
      ? 'onboarding@resend.dev'
      : 'The Bell Registry <notifications@bellregistry.com>';

    // Generate ban email
    const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://app.bellregistry.com';
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
                🚫 Account Banned
              </h1>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">
                Your account has been permanently banned
              </p>
            </div>

            <div style="text-align: left; margin-bottom: 24px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                Dear ${data.userName},
              </p>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                We are writing to inform you that your account on The Bell Registry has been permanently banned due to violations of our terms of service.
              </p>
            </div>

            <!-- Ban Details -->
            <div style="background-color: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #991b1b; font-size: 16px; font-weight: 600;">Ban Details:</h4>
              <div style="color: #991b1b; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${data.bannedAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <p style="margin: 0;"><strong>Status:</strong> Permanent ban</p>
              </div>
            </div>

            <!-- What This Means -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">What This Means:</h4>
              <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;">• Your account has been permanently banned from The Bell Registry</p>
                <p style="margin: 0 0 8px 0;">• You can no longer access your account or profile</p>
                <p style="margin: 0 0 8px 0;">• All your data will be retained according to our privacy policy</p>
                <p style="margin: 0;">• This decision is final and cannot be appealed</p>
              </div>
            </div>

            <!-- Contact Information -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="mailto:support@bellregistry.com?subject=Account Ban - ${data.userEmail}" style="background-color: #121155; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
                Contact Support
              </a>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from The Bell Registry. If you have questions about this ban, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    const toEmail = isDevelopment ? 'delivered@resend.dev' : data.userEmail;
    
    console.log('[BAN_NOTIFICATION] Sending ban email to:', data.userEmail);

    const emailResponse = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Your account has been banned - The Bell Registry',
      html: emailHtml,
    });

    console.log('[BAN_NOTIFICATION] Ban email sent successfully:', emailResponse);

    if (isDevelopment) {
      return {
        message: "Development mode: Ban email simulated.",
        debug: {
          originalEmail: data.userEmail,
          testEmail: toEmail,
          isDevelopment,
          emailResponse
        }
      };
    }

    return emailResponse;
  } catch (error) {
    console.error('[BAN_NOTIFICATION] Error sending ban email:', error);
    throw error;
  }
}

export async function sendUnsuspensionNotification(data: UnsuspensionNotificationData) {
  try {
    const FROM_EMAIL = isDevelopment 
      ? 'onboarding@resend.dev'
      : 'The Bell Registry <notifications@bellregistry.com>';

    // Generate unsuspension email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://app.bellregistry.com';
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
                ✅ Account Restored
              </h1>
              <p style="color: #6b7280; font-size: 16px; margin: 0;">
                Your account suspension has been lifted
              </p>
            </div>

            <div style="text-align: left; margin-bottom: 24px;">
              <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
                Dear ${data.userName},
              </p>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                Great news! Your account suspension has been reviewed and lifted. You now have full access to your account again.
              </p>
            </div>

            <!-- Restoration Details -->
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 600;">Account Status:</h4>
              <div style="color: #166534; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;"><strong>Status:</strong> Active</p>
                <p style="margin: 0;"><strong>Restored on:</strong> ${data.unsuspendedAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>

            <!-- What You Can Do Now -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">You Can Now:</h4>
              <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;">• Access your full account and profile</p>
                <p style="margin: 0 0 8px 0;">• Apply for jobs and save opportunities</p>
                <p style="margin: 0 0 8px 0;">• Send and receive messages</p>
                <p style="margin: 0;">• Your profile is visible to employers again</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="${appUrl}/dashboard" style="background-color: #121155; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; margin-right: 12px; margin-bottom: 8px;">
                Access Your Dashboard
              </a>
              <a href="${appUrl}/dashboard/profile" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
                Update Your Profile
              </a>
            </div>

            <div style="text-align: center; margin-top: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Welcome back to The Bell Registry! Thank you for your patience during the review process.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    const toEmail = isDevelopment ? 'delivered@resend.dev' : data.userEmail;
    
    console.log('[UNSUSPENSION_NOTIFICATION] Sending unsuspension email to:', data.userEmail);

    const emailResponse = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Your account has been restored - The Bell Registry',
      html: emailHtml,
    });

    console.log('[UNSUSPENSION_NOTIFICATION] Unsuspension email sent successfully:', emailResponse);

    if (isDevelopment) {
      return {
        message: "Development mode: Unsuspension email simulated.",
        debug: {
          originalEmail: data.userEmail,
          testEmail: toEmail,
          isDevelopment,
          emailResponse
        }
      };
    }

    return emailResponse;
  } catch (error) {
    console.error('[UNSUSPENSION_NOTIFICATION] Error sending unsuspension email:', error);
    throw error;
  }
} 