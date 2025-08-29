import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/debug/thread-schema - Debug endpoint to check thread schema
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to access
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Try to get a thread with all fields to see what's available
    const thread = await prisma.messageBoardThread.findFirst({
      select: {
        id: true,
        title: true,
        content: true, // This will fail if the column doesn't exist
        authorId: true,
        createdAt: true,
        updatedAt: true,
        lastReplyAt: true,
        isLocked: true,
        isPinned: true,
      }
    });

    return NextResponse.json({ 
      message: "Schema check successful",
      thread: thread || "No threads found",
      hasContentField: true
    });
  } catch (error) {
    console.error("Schema check error:", error);
    return NextResponse.json({ 
      error: "Schema check failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      hasContentField: false
    }, { status: 500 });
  }
}
