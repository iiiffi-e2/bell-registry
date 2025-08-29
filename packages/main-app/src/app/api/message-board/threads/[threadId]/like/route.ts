import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/message-board/threads/[threadId]/like - Toggle like on thread
export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to like threads
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can like threads." }, { status: 403 });
    }

    // Check if thread exists
    const thread = await prisma.messageBoardThread.findUnique({
      where: { id: params.threadId }
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check if user already liked this thread
    const existingLike = await prisma.messageBoardThreadLike.findUnique({
      where: {
        threadId_userId: {
          threadId: params.threadId,
          userId: session.user.id
        }
      }
    });

    let isLiked: boolean;
    let likeCount: number;

    if (existingLike) {
      // Unlike - remove the like
      await prisma.messageBoardThreadLike.delete({
        where: { id: existingLike.id }
      });
      isLiked = false;
    } else {
      // Like - add the like
      await prisma.messageBoardThreadLike.create({
        data: {
          threadId: params.threadId,
          userId: session.user.id
        }
      });
      isLiked = true;
    }

    // Get updated like count
    likeCount = await prisma.messageBoardThreadLike.count({
      where: { threadId: params.threadId }
    });

    return NextResponse.json({
      isLiked,
      likeCount,
      message: isLiked ? "Thread liked" : "Thread unliked"
    });
  } catch (error) {
    console.error("Error toggling thread like:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/message-board/threads/[threadId]/like - Get like status and count
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow professionals to view likes
    if (session.user.role !== "PROFESSIONAL") {
      return NextResponse.json({ error: "Access denied. Only professionals can view thread likes." }, { status: 403 });
    }

    // Get like count
    const likeCount = await prisma.messageBoardThreadLike.count({
      where: { threadId: params.threadId }
    });

    // Check if current user liked this thread
    const userLike = await prisma.messageBoardThreadLike.findUnique({
      where: {
        threadId_userId: {
          threadId: params.threadId,
          userId: session.user.id
        }
      }
    });

    return NextResponse.json({
      likeCount,
      isLiked: !!userLike
    });
  } catch (error) {
    console.error("Error getting thread like status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
