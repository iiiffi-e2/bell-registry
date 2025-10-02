/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/message-board/terms - Accept message board terms
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to accept message board terms
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can access the message board." }, { status: 403 });
    }

    // Update user to record terms agreement
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        messageBoardTermsAgreedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting message board terms:", error);
    return NextResponse.json(
      { error: "Failed to accept terms. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/message-board/terms - Check if user has agreed to terms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to check message board terms
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can access the message board." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        messageBoardTermsAgreedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasAgreedToTerms: !!user.messageBoardTermsAgreedAt,
      agreedAt: user.messageBoardTermsAgreedAt,
    });
  } catch (error) {
    console.error("Error checking message board terms:", error);
    return NextResponse.json(
      { error: "Failed to check terms status. Please try again." },
      { status: 500 }
    );
  }
}
