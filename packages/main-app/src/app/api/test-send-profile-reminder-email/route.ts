import { NextRequest, NextResponse } from "next/server";
import { sendProfileUpdateReminderEmail } from "@/lib/profile-reminder-service";
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
      role = 'PROFESSIONAL',
      userName = 'Test User',
      lastLoginDays = 35 
    } = body;

    // Mock profile data for testing
    const mockProfileData = role === 'PROFESSIONAL' ? {
      title: 'Software Engineer',
      bio: 'Experienced developer with 5+ years in web development',
      skills: ['JavaScript', 'React', 'Node.js']
    } : {
      companyName: 'Test Company Inc.',
      description: 'Leading technology company focused on innovation'
    };

    console.log(`[TEST_EMAIL] Sending test profile reminder email to: ${email}`);
    console.log(`[TEST_EMAIL] Role: ${role}, Days since login: ${lastLoginDays}`);

    await sendProfileUpdateReminderEmail(
      email,
      userName,
      role as UserRole,
      null, // profileSlug
      lastLoginDays,
      mockProfileData
    );

    return NextResponse.json({ 
      success: true, 
      message: `Test profile reminder email sent to ${email}`,
      details: {
        email,
        role,
        userName,
        lastLoginDays,
        isDevelopment: true
      }
    });
  } catch (error) {
    console.error("[TEST_SEND_EMAIL]", error);
    return NextResponse.json(
      { 
        error: "Failed to send test email", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 