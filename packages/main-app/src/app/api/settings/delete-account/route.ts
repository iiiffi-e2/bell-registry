/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    console.log(`[DELETE_ACCOUNT] Starting account deletion for user: ${userId}`);

    // Mark the user as deleted instead of actually deleting
    await prisma.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        // Clear sensitive information immediately
        email: `deleted_${userId}@deleted.com`,
        firstName: null,
        lastName: null,
        phoneNumber: null,
        image: null,
        password: null,
        profileSlug: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log(`[DELETE_ACCOUNT] Account marked as deleted for user: ${userId}`);

    return new NextResponse("Account deleted successfully", { status: 200 });
  } catch (error) {
    console.error("[DELETE_ACCOUNT] Error:", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error", 
      { status: 500 }
    );
  }
} 