import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 404 });
  }

  try {
    const body = await request.json();
    const { 
      type = 'bug_report',
      details = 'This is a test feedback submission to verify the email functionality is working correctly.',
      userEmail = 'test@example.com',
      userName = 'Test User',
      userRole = 'PROFESSIONAL'
    } = body;

    console.log(`[TEST_FEEDBACK] Simulating feedback submission`);
    console.log(`[TEST_FEEDBACK] Type: ${type}, User: ${userName} (${userEmail})`);

    // Simulate the feedback API call
    const feedbackResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        type,
        details,
      }),
    });

    const feedbackResult = await feedbackResponse.json();

    return NextResponse.json({ 
      success: true, 
      message: `Test feedback email sent`,
      details: {
        type,
        details,
        userEmail,
        userName,
        userRole,
        isDevelopment: true,
        feedbackResult
      }
    });
  } catch (error) {
    console.error("[TEST_FEEDBACK]", error);
    return NextResponse.json(
      { 
        error: "Failed to send test feedback", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 