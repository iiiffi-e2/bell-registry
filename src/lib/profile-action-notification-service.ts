import { Resend } from 'resend';
import { UserRole } from '@/types';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not configured');
}
const resend = new Resend(RESEND_API_KEY);

const isDevelopment = process.env.NODE_ENV === 'development';
const FROM_EMAIL = isDevelopment 
  ? 'onboarding@resend.dev'
  : 'The Bell Registry <notifications@thebellregistry.com>';

export interface ProfileActionEmailData {
  userEmail: string;
  userName: string;
  userRole: UserRole;
  action: 'approve' | 'reject' | 'suspend' | 'ban' | 'flag';
  reason?: string;
  adminName?: string;
  adminNote?: string;
  profileSlug?: string | null;
}

export async function sendProfileActionNotificationEmail({
  userEmail,
  userName,
  userRole,
  action,
  reason,
  adminName,
  adminNote,
  profileSlug
}: ProfileActionEmailData) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://app.thebellregistry.com';
  
  const loginUrl = `${appUrl}/login`;
  const dashboardUrl = `${appUrl}/dashboard`;
  const profileUrl = profileSlug 
    ? `${appUrl}/professionals/${profileSlug}` 
    : `${appUrl}/dashboard/profile`;
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@thebellregistry.com';

  // Generate action-specific content
  const getActionContent = () => {
    switch (action) {
      case 'approve':
        return {
          subject: '✅ Your Profile Has Been Approved',
          title: '🎉 Profile Approved!',
          status: 'approved',
          statusColor: '#10b981',
          message: 'Great news! Your profile has been reviewed and approved by our team.',
          description: 'Your profile is now live and visible to employers and opportunities. You can start applying for jobs and connecting with recruiters.',
          actionText: 'View Your Live Profile',
          actionUrl: profileUrl,
          additionalActions: [
            { text: 'Browse Jobs', url: `${appUrl}/jobs` },
            { text: 'Update Profile', url: `${appUrl}/dashboard/profile` }
          ]
        };
      
      case 'reject':
        return {
          subject: '❌ Profile Review Update Required',
          title: '📋 Profile Needs Updates',
          status: 'rejected',
          statusColor: '#ef4444',
          message: 'Your profile has been reviewed and requires some updates before it can be approved.',
          description: reason || 'Please review our community guidelines and update your profile accordingly. Once updated, our team will review it again.',
          actionText: 'Update Your Profile',
          actionUrl: `${appUrl}/dashboard/profile`,
          additionalActions: [
            { text: 'Community Guidelines', url: `${appUrl}/guidelines` },
            { text: 'Contact Support', url: `mailto:${supportEmail}` }
          ]
        };
      
      case 'suspend':
        return {
          subject: '⚠️ Account Temporarily Suspended',
          title: '⚠️ Account Suspended',
          status: 'suspended',
          statusColor: '#f59e0b',
          message: 'Your account has been temporarily suspended.',
          description: reason || 'Your account has limited access. You can still log in to view your profile and appeal this decision. Please contact our support team to resolve this issue.',
          actionText: 'View Suspension Details',
          actionUrl: `${appUrl}/account-suspended`,
          additionalActions: [
            { text: 'Contact Support', url: `mailto:${supportEmail}?subject=Account Suspension Appeal - ${userName}` },
            { text: 'Review Terms', url: `${appUrl}/terms` }
          ]
        };
      
      case 'ban':
        return {
          subject: '🚫 Account Permanently Banned',
          title: '🚫 Account Banned',
          status: 'banned',
          statusColor: '#dc2626',
          message: 'Your account has been permanently banned.',
          description: reason || 'Your account has been permanently disabled due to policy violations. If you believe this is an error, please contact our support team.',
          actionText: 'Contact Support',
          actionUrl: `mailto:${supportEmail}?subject=Account Ban Appeal - ${userName}`,
          additionalActions: [
            { text: 'Review Terms', url: `${appUrl}/terms` },
            { text: 'Appeal Process', url: `${appUrl}/appeal` }
          ]
        };
      
      case 'flag':
        return {
          subject: '🚩 Profile Under Review',
          title: '🔍 Profile Flagged for Review',
          status: 'flagged',
          statusColor: '#ef4444',
          message: 'Your profile has been flagged and is currently under review by our team.',
          description: 'We\'ve received reports about your profile and are conducting a review. Your profile may have limited visibility until this review is complete.',
          actionText: 'Review Guidelines',
          actionUrl: `${appUrl}/guidelines`,
          additionalActions: [
            { text: 'Contact Support', url: `mailto:${supportEmail}` },
            { text: 'Update Profile', url: `${appUrl}/dashboard/profile` }
          ]
        };
      
      default:
        return {
          subject: 'Profile Status Update',
          title: 'Profile Status Update',
          status: 'updated',
          statusColor: '#6b7280',
          message: 'Your profile status has been updated.',
          description: 'Please check your profile for any required actions.',
          actionText: 'View Profile',
          actionUrl: profileUrl,
          additionalActions: []
        };
    }
  };

  const content = getActionContent();
  const roleText = userRole === UserRole.PROFESSIONAL ? 'professional' : 'employer';

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${imageBaseUrl}/images/brand/logo-bell-registry-email.png" alt="The Bell Registry" style="max-width: 200px; height: auto; margin-bottom: 24px;" />
          <h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">
            ${content.title}
          </h1>
          <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">
            Hi ${userName},
          </p>
        </div>

        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid ${content.statusColor};">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${content.statusColor}; margin-right: 8px;"></div>
            <span style="font-weight: 600; color: #1f2937; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">
              Profile ${content.status}
            </span>
          </div>
          <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.6;">
            ${content.message}
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
            ${content.description}
          </p>
        </div>

        ${adminNote ? `
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Admin Note:</h4>
            <p style="color: #1e40af; font-size: 13px; margin: 0;">${adminNote}</p>
          </div>
        ` : ''}

        ${adminName ? `
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0;">
              <strong>Reviewed by:</strong> ${adminName} from The Bell Registry team
            </p>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 32px;">
          <a href="${content.actionUrl}" style="background-color: ${content.statusColor}; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-bottom: 16px;">
            ${content.actionText}
          </a>
          <br>
          ${content.additionalActions.map(action => 
            `<a href="${action.url}" style="color: #6b7280; font-size: 14px; text-decoration: none; margin: 0 8px;">${action.text}</a>`
          ).join(' | ')}
        </div>

        ${action === 'suspend' ? `
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
              ⚠️ What this means:
            </h4>
            <ul style="margin: 0; padding-left: 16px; color: #92400e; font-size: 13px; line-height: 1.5;">
              <li>Your profile is temporarily hidden from search results</li>
              <li>You have limited access to platform features</li>
              <li>You can still log in and appeal this decision</li>
              <li>This action can be reversed upon review</li>
            </ul>
          </div>
        ` : ''}

        ${action === 'ban' ? `
          <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 600;">
              🚫 What this means:
            </h4>
            <ul style="margin: 0; padding-left: 16px; color: #991b1b; font-size: 13px; line-height: 1.5;">
              <li>Your account is permanently disabled</li>
              <li>You cannot access any platform features</li>
              <li>Your profile is permanently hidden</li>
              <li>This action is typically final</li>
            </ul>
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            You're receiving this notification about your Bell Registry ${roleText} profile.
            <br>
            Need help? Contact us at <a href="mailto:${supportEmail}" style="color: #6b7280;">${supportEmail}</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const toEmail = isDevelopment ? 'delivered@resend.dev' : userEmail;

  try {
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: content.subject,
      html: emailHtml,
    });

    console.log(`Profile action notification sent to ${userEmail}:`, emailResponse);
    return emailResponse;
  } catch (error) {
    console.error(`Failed to send profile action notification to ${userEmail}:`, error);
    throw error;
  }
}

export async function sendBulkProfileActionNotificationEmails(
  users: Array<{
    email: string;
    name: string;
    role: UserRole;
    profileSlug?: string | null;
  }>,
  action: 'approve' | 'suspend' | 'ban' | 'flag',
  adminName?: string,
  reason?: string,
  adminNote?: string
) {
  console.log(`Starting bulk ${action} notifications for ${users.length} users`);
  
  let sentCount = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const user of users) {
    try {
      await sendProfileActionNotificationEmail({
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        action,
        reason,
        adminName,
        adminNote,
        profileSlug: user.profileSlug
      });
      
      sentCount++;
      console.log(`Bulk notification sent to ${user.email} (${action})`);
    } catch (error) {
      console.error(`Failed to send bulk notification to ${user.email}:`, error);
      errors.push({
        email: user.email,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  console.log(`Bulk notification process completed. Sent ${sentCount}/${users.length} notifications`);
  
  return {
    sentCount,
    totalCount: users.length,
    errors
  };
} 