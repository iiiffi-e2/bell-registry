import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Only allow in development mode
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse("Not available in production", { status: 403 });
  }

  try {
    console.log("[TEST_PURGE_DELETED_ACCOUNTS] Starting test purge job");

    // Find accounts deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const accountsToPurge = await prisma.user.findMany({
      where: {
        isDeleted: true,
        deletedAt: {
          lte: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    console.log(`[TEST_PURGE_DELETED_ACCOUNTS] Found ${accountsToPurge.length} accounts to purge`);

    // In test mode, just return what would be purged without actually deleting
    const accountsInfo = accountsToPurge.map(account => ({
      id: account.id,
      email: account.email,
      deletedAt: account.deletedAt,
      daysSinceDeleted: Math.floor((Date.now() - account.deletedAt!.getTime()) / (1000 * 60 * 60 * 24))
    }));

    return NextResponse.json({
      success: true,
      message: `Test mode: Would purge ${accountsToPurge.length} accounts`,
      accountsThatWouldBePurged: accountsInfo,
      note: "This is a test run - no accounts were actually deleted",
    });
  } catch (error) {
    console.error("[TEST_PURGE_DELETED_ACCOUNTS]", error);
    return NextResponse.json(
      { error: "Failed to test purge functionality" },
      { status: 500 }
    );
  }
} 