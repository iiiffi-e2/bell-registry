import { NextRequest, NextResponse } from "next/server";
import { sendJobApplicationNotificationEmail } from "@/lib/job-application-email-service";

export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode for security
    if (process.env.NODE_ENV !== 'development') {
      return new NextResponse("Not available in production", { status: 403 });
    }

    // Test data for the email
    const testData = {
      employerEmail: 'test@example.com',
      employerName: 'John Smith',
      companyName: 'Tech Solutions Inc.',
      jobTitle: 'Senior Software Engineer',
      jobLocation: 'San Francisco, CA',
      candidateName: 'Jane Doe',
      candidateEmail: 'jane.doe@example.com',
      applicationId: 'test-application-123',
      resumeUrl: 'https://example.com/resume.pdf',
      coverLetterUrl: 'https://example.com/cover-letter.pdf',
      message: 'I am very interested in this position and believe my skills would be a great fit for your team.',
      applicationDate: new Date()
    };

    const result = await sendJobApplicationNotificationEmail(testData);

    return NextResponse.json({ 
      success: true, 
      message: "Job application email test sent successfully",
      result
    });
  } catch (error) {
    console.error("[TEST_JOB_APPLICATION_EMAIL]", error);
    return NextResponse.json(
      { error: "Failed to send test email", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 