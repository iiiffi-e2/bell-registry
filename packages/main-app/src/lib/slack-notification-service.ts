/**
 * Slack notification service for user registration events
 */

interface SlackNotificationPayload {
  text?: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    elements?: Array<{
      type: string;
      text: string;
    }>;
    fields?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  membershipAccess?: string;
  companyName?: string;
  referralProfessionalName?: string;
  registrationMethod: 'manual' | 'oauth';
  provider?: string; // For OAuth registrations
}

/**
 * Sends a Slack notification for new user registration
 */
export async function sendUserRegistrationSlackNotification(userData: UserRegistrationData): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://bellregistry.com';
    const fullName = `${userData.firstName} ${userData.lastName}`;
    const roleEmoji = getRoleEmoji(userData.role);
    const registrationMethodText = userData.registrationMethod === 'oauth' 
      ? `${userData.provider?.charAt(0).toUpperCase()}${userData.provider?.slice(1)} OAuth`
      : 'Manual Registration';

    // Create rich Slack message with blocks
    const payload: SlackNotificationPayload = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🎉 New ${userData.role.toLowerCase()} registration!`
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Name:*\n${fullName} ${roleEmoji}`
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${userData.email}`
            },
            {
              type: "mrkdwn",
              text: `*Role:*\n${userData.role}`
            },
            {
              type: "mrkdwn",
              text: `*Registration Method:*\n${registrationMethodText}`
            }
          ]
        }
      ]
    };

    // Add additional fields based on role and data
    const additionalFields: Array<{ type: string; text: string }> = [];

    if (userData.companyName) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*Company:*\n${userData.companyName}`
      });
    }

    if (userData.membershipAccess && userData.membershipAccess !== 'NEW_APPLICANT') {
      additionalFields.push({
        type: "mrkdwn",
        text: `*Membership Access:*\n${formatMembershipAccess(userData.membershipAccess)}`
      });
    }

    if (userData.referralProfessionalName) {
      additionalFields.push({
        type: "mrkdwn",
        text: `*Referred by:*\n${userData.referralProfessionalName}`
      });
    }

    // Add additional fields to the section if we have any
    if (additionalFields.length > 0) {
      payload.blocks!.push({
        type: "section",
        fields: additionalFields
      });
    }

    // Add action buttons
    payload.blocks!.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Registration Time:* ${new Date().toLocaleString('en-US', { 
          timeZone: 'America/New_York',
          dateStyle: 'medium',
          timeStyle: 'short'
        })}`
      }
    });

    // Add context with admin portal link
    payload.blocks!.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `View in admin portal: https://admin.bellregistry.com/`
        }
      ]
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Slack notification sent for new ${userData.role.toLowerCase()} registration: ${userData.email}`);
  } catch (error) {
    console.error('Failed to send Slack notification for user registration:', error);
    // Don't throw error to avoid failing the registration process
  }
}

/**
 * Get emoji for user role
 */
function getRoleEmoji(role: string): string {
  switch (role.toLowerCase()) {
    case 'professional':
      return '👨‍💼';
    case 'employer':
      return '🏢';
    case 'agency':
      return '🏛️';
    case 'admin':
      return '👑';
    default:
      return '👤';
  }
}

/**
 * Format membership access for display
 */
function formatMembershipAccess(membershipAccess: string): string {
  switch (membershipAccess) {
    case 'BELL_REGISTRY_REFERRAL':
      return 'Bell Registry Referral';
    case 'PROFESSIONAL_REFERRAL':
      return 'Professional Referral';
    case 'NEW_APPLICANT':
      return 'New Applicant';
    case 'EMPLOYER':
      return 'Employer';
    case 'AGENCY':
      return 'Agency';
    default:
      return membershipAccess.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}

/**
 * Send a simple test notification to verify Slack integration
 */
export async function sendSlackTestNotification(): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured');
    return false;
  }

  try {
    const payload: SlackNotificationPayload = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "🧪 *Bell Registry Slack Integration Test*\n\nThis is a test message to verify that Slack notifications are working correctly."
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Test sent at: ${new Date().toLocaleString('en-US', { 
                timeZone: 'America/New_York',
                dateStyle: 'full',
                timeStyle: 'medium'
              })}`
            }
          ]
        }
      ]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Slack test notification sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send Slack test notification:', error);
    return false;
  }
}
