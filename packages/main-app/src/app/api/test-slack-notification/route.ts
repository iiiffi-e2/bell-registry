import { NextResponse } from "next/server";
import { sendSlackTestNotification, sendUserRegistrationSlackNotification } from "@/lib/slack-notification-service";

// Hardcoded webhook URL for testing - remove this in production!
const TEST_WEBHOOK_URL = "https://hooks.slack.com/services/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";

async function sendTestSlackMessage(message: any) {
  try {
    const response = await fetch(TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to send test Slack message:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { type = 'test' } = await req.json();

    if (type === 'test') {
      // Send a simple test notification with hardcoded webhook
      const testMessage = {
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

      await sendTestSlackMessage(testMessage);
      
      return NextResponse.json(
        { message: "Slack test notification sent successfully using hardcoded webhook" },
        { status: 200 }
      );
    } else if (type === 'registration') {
      // Send a sample registration notification with hardcoded webhook
      const registrationMessage = {
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🎉 New professional registration!"
            }
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Name:*\nJohn Doe 👨‍💼"
              },
              {
                type: "mrkdwn",
                text: "*Email:*\njohn.doe@example.com"
              },
              {
                type: "mrkdwn",
                text: "*Role:*\nPROFESSIONAL"
              },
              {
                type: "mrkdwn",
                text: "*Registration Method:*\nManual Registration"
              }
            ]
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: "*Membership Access:*\nNew Applicant"
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
                  text: "View in admin portal: https://admin.bellregistry.com/"
                }
              ]
            }
        ]
      };

      await sendTestSlackMessage(registrationMessage);

      return NextResponse.json(
        { message: "Slack registration notification sent successfully using hardcoded webhook" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Invalid notification type. Use 'test' or 'registration'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[SLACK_TEST]", error);
    
    return NextResponse.json(
      { message: "Failed to send Slack notification", error: error.message },
      { status: 500 }
    );
  }
}
