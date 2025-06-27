import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/welcome-email-service";
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 404 });
  }

  try {
    const body = await request.json();
    const { 
      email = 'test@example.com', 
      firstName = 'Test',
      lastName = 'User',
      role = 'PROFESSIONAL'
    } = body;

    console.log(`[TEST_WELCOME_EMAIL] Sending test welcome email to: ${email}`);
    console.log(`[TEST_WELCOME_EMAIL] Role: ${role}, Name: ${firstName} ${lastName}`);

    await sendWelcomeEmail({
      email,
      firstName,
      lastName,
      role: role as UserRole,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Test welcome email sent to ${email}`,
      details: {
        email,
        firstName,
        lastName,
        role,
        isDevelopment: true
      }
    });
  } catch (error) {
    console.error("[TEST_WELCOME_EMAIL]", error);
    return NextResponse.json(
      { 
        error: "Failed to send test welcome email", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 