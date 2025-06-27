import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new NextResponse("All fields are required", { status: 400 });
    }

    // Get user with their password hash
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, password: true }
    });

    if (!user?.password) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return new NextResponse("Current password is incorrect", { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    // Revoke all trusted devices for security (after migration)
    try {
      // This will work after the database migration is run
      await prisma.trustedDevice.deleteMany({
        where: { userId: user.id },
      });
    } catch (error) {
      // Silently fail if trusted devices table doesn't exist yet
      console.log('Trusted devices table not yet available');
    }

    const response = new NextResponse("Password updated successfully");
    
    // Clear device token cookie since all trusted devices are revoked
    response.cookies.delete('device_token');
    
    return response;
  } catch (error) {
    console.error("[PASSWORD_UPDATE]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error", 
      { status: 500 }
    );
  }
} 