/**
 * Slack notification service for the shared package
 * Simplified version for OAuth registrations
 */

interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  membershipAccess?: string;
  registrationMethod: 'oauth';
  provider?: string;
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

    // Create rich Slack message with blocks
    const payload = {
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
              text: `*Registration Method:*\n${userData.provider?.charAt(0).toUpperCase()}${userData.provider?.slice(1)} OAuth`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Registration Time:* ${new Date().toLocaleString('en-US', { 
              timeZone: 'America/New_York',
              dateStyle: 'medium',
              timeStyle: 'short'
            })}`
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `View in admin portal: https://admin.bellregistry.com/`
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

    console.log(`Slack notification sent for new ${userData.role.toLowerCase()} OAuth registration: ${userData.email}`);
  } catch (error) {
    console.error('Failed to send Slack notification for OAuth user registration:', error);
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
