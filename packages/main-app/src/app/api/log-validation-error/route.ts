/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

/**
 * API endpoint to log client-side validation errors
 * This allows us to capture validation errors that occur in the browser
 * and log them to Vercel's server logs for analysis
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get the client error data
    const clientErrorData = await req.json();
    
    // Enhance with server context
    const enhancedLogData = {
      ...clientErrorData,
      serverTimestamp: new Date().toISOString(),
      serverUserId: session?.user?.id || 'anonymous',
      serverUserEmail: session?.user?.email || 'unknown',
      serverUserRole: session?.user?.role || 'unknown',
      ipAddress: req.ip || 
        req.headers.get('x-forwarded-for') || 
        req.headers.get('x-real-ip') || 
        'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      referrer: req.headers.get('referer') || 'unknown',
      source: 'CLIENT_VALIDATION_ERROR'
    };
    
    // Log to Vercel server logs
    console.log(`[CLIENT_VALIDATION_ERROR] ${JSON.stringify(enhancedLogData)}`);
    
    // Also log a simplified summary for quick scanning
    const errorCount = enhancedLogData.validationErrors?.length || 0;
    const errorTypes = enhancedLogData.validationErrors?.map((e: any) => e.field).join(', ') || 'unknown';
    
    console.log(`[VALIDATION_SUMMARY] User: ${enhancedLogData.userEmail} | Role: ${enhancedLogData.userRole} | Client Errors: ${errorCount} | Fields: ${errorTypes} | Completion: ${enhancedLogData.formCompletion}%`);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('[LOG_VALIDATION_ERROR_API] Failed to log client validation error:', error);
    
    // Return success even if logging fails to avoid breaking the form
    return NextResponse.json({ success: false, error: 'Logging failed' }, { status: 500 });
  }
}
