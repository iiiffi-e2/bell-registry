/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 404 });
  }

  try {
    const body = await request.json();
    const { 
      reason = 'mistake',
      details = 'This is a test appeal submission to verify the email functionality is working correctly.',
      userEmail = 'test@example.com',
      userName = 'Test User',
      userRole = 'PROFESSIONAL'
    } = body;

    console.log(`[TEST_SUSPENSION_APPEAL] Simulating appeal submission`);
    console.log(`[TEST_SUSPENSION_APPEAL] Reason: ${reason}, User: ${userName} (${userEmail})`);

    // Simulate the appeal API call
    const appealResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/suspension-appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        reason,
        details,
      }),
    });

    const appealResult = await appealResponse.json();

    return NextResponse.json({ 
      success: true, 
      message: `Test appeal email sent`,
      details: {
        reason,
        details,
        userEmail,
        userName,
        userRole,
        isDevelopment: true,
        appealResult
      }
    });
  } catch (error) {
    console.error("[TEST_SUSPENSION_APPEAL]", error);
    return NextResponse.json(
      { 
        error: "Failed to send test appeal", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
  }
} 