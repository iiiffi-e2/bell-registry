/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron service (optional security measure)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[PURGE_DELETED_ACCOUNTS] Starting purge job");

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

    console.log(`[PURGE_DELETED_ACCOUNTS] Found ${accountsToPurge.length} accounts to purge`);

    if (accountsToPurge.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No accounts to purge",
        accountsPurged: 0,
      });
    }

    // Delete accounts and all their data
    // Due to CASCADE constraints, this will automatically delete related data
    let purgedCount = 0;
    for (const account of accountsToPurge) {
      try {
        await prisma.user.delete({
          where: { id: account.id },
        });
        
        console.log(`[PURGE_DELETED_ACCOUNTS] Purged account: ${account.id} (deleted on: ${account.deletedAt})`);
        purgedCount++;
      } catch (error) {
        console.error(`[PURGE_DELETED_ACCOUNTS] Failed to purge account ${account.id}:`, error);
      }
    }

    console.log(`[PURGE_DELETED_ACCOUNTS] Purge job completed. Purged ${purgedCount} accounts`);

    return NextResponse.json({
      success: true,
      message: `Successfully purged ${purgedCount} deleted accounts`,
      accountsPurged: purgedCount,
    });
  } catch (error) {
    console.error("[PURGE_DELETED_ACCOUNTS]", error);
    return NextResponse.json(
      { error: "Failed to purge deleted accounts" },
      { status: 500 }
    );
  }
} 