/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/message-board/replies/[replyId]/like - Toggle like on reply
export async function POST(
  request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to like replies
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can like replies." }, { status: 403 });
    }

    // Check if reply exists
    const reply = await prisma.messageBoardReply.findUnique({
      where: { id: params.replyId }
    });

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Check if user already liked this reply
    const existingLike = await prisma.messageBoardReplyLike.findUnique({
      where: {
        replyId_userId: {
          replyId: params.replyId,
          userId: session.user.id
        }
      }
    });

    let isLiked: boolean;
    let likeCount: number;

    if (existingLike) {
      // Unlike - remove the like
      await prisma.messageBoardReplyLike.delete({
        where: { id: existingLike.id }
      });
      isLiked = false;
    } else {
      // Like - add the like
      await prisma.messageBoardReplyLike.create({
        data: {
          replyId: params.replyId,
          userId: session.user.id
        }
      });
      isLiked = true;
    }

    // Get updated like count
    likeCount = await prisma.messageBoardReplyLike.count({
      where: { replyId: params.replyId }
    });

    return NextResponse.json({
      isLiked,
      likeCount,
      message: isLiked ? "Reply liked" : "Reply unliked"
    });
  } catch (error) {
    console.error("Error toggling reply like:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/message-board/replies/[replyId]/like - Get like status and count
export async function GET(
  request: NextRequest,
  { params }: { params: { replyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to view likes
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can view reply likes." }, { status: 403 });
    }

    // Get like count
    const likeCount = await prisma.messageBoardReplyLike.count({
      where: { replyId: params.replyId }
    });

    // Check if current user liked this reply
    const userLike = await prisma.messageBoardReplyLike.findUnique({
      where: {
        replyId_userId: {
          replyId: params.replyId,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({
      likeCount,
      isLiked: !!userLike
    });
  } catch (error) {
    console.error("Error getting reply like status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
