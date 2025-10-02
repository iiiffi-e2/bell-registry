/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateEmployerSubscription, SubscriptionType } from "@/lib/subscription-service";
import { isEmployerOrAgencyRole } from "@/lib/roles";

export async function POST(request: NextRequest) {
  console.log('Manual update endpoint called');
  
  try {
    console.log('Getting session...');
    const session = await getServerSession(authOptions);
    console.log('Session:', { userId: session?.user?.id, role: session?.user?.role });
    
    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY: Only allow manual updates for admin users or in development
    // TODO: Replace with proper admin role check when admin system is implemented
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isAdminEmail = session.user.email === process.env.ADMIN_EMAIL;
    
    if (!isDevelopment && !isAdminEmail) {
      console.log('Manual update access denied - not admin:', session.user.email);
      return NextResponse.json({ 
        error: "Access denied - admin privileges required" 
      }, { status: 403 });
    }

    console.log('Parsing request body...');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { subscriptionType, targetUserId } = body;
    
    if (!subscriptionType || !Object.values(SubscriptionType).includes(subscriptionType)) {
      console.log('Invalid subscription type:', subscriptionType);
      console.log('Valid types:', Object.values(SubscriptionType));
      return NextResponse.json({ error: "Invalid subscription type" }, { status: 400 });
    }

    // Allow updating another user's subscription if targetUserId is provided (admin feature)
    const userIdToUpdate = targetUserId || session.user.id;
    
    if (targetUserId && !isAdminEmail) {
      return NextResponse.json({ 
        error: "Cannot update other user's subscription without admin privileges" 
      }, { status: 403 });
    }

    console.log('Calling updateEmployerSubscription with:', {
      userId: userIdToUpdate,
      subscriptionType,
    });

    // Manual update for debugging/admin purposes
    await updateEmployerSubscription(
      userIdToUpdate,
      subscriptionType as SubscriptionType,
      'manual_customer_id', // Temporary customer ID
      'manual_session_id'   // Temporary session ID
    );

    console.log('Update successful');
    return NextResponse.json({ 
      success: true, 
      message: `Subscription updated to ${subscriptionType}${targetUserId ? ` for user ${targetUserId}` : ''}` 
    });
  } catch (error) {
    console.error("Detailed error in manual subscription update:", {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 