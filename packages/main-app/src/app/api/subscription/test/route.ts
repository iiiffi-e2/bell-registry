import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Test endpoint called');
    
    // Test 1: Session
    const session = await getServerSession(authOptions);
    console.log('Session test:', !!session?.user?.id);
    
    // Test 2: Database connection
    const userCount = await prisma.user.count();
    console.log('Database test - user count:', userCount);
    
    // Test 3: Current user data
    if (session?.user?.id) {
      const employerData = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id }
      });
      console.log('Current user employer data:', !!employerData);
    }
    
    return NextResponse.json({ 
      success: true,
      session: !!session?.user?.id,
      userId: session?.user?.id,
      userRole: session?.user?.role,
      dbConnected: true,
      userCount
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
} 