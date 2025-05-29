import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getIO } from '@/lib/socket-client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: senderId, role } = session.user
    const { conversationId, content } = await request.json()

    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { status: 400 }
      )
    }

    // Verify user has access and conversation is active
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { clientId: senderId },
          { professionalId: senderId }
        ]
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check if conversation is active
    if (conversation.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This conversation has been ended' },
        { status: 403 }
      )
    }

    // If sender is professional, verify the conversation was initiated by client
    if (role === 'PROFESSIONAL' && conversation.professionalId === senderId) {
      const hasClientMessages = await prisma.message.findFirst({
        where: {
          conversationId,
          senderId: conversation.clientId
        }
      })

      if (!hasClientMessages) {
        return NextResponse.json(
          { error: 'You can only reply after the client has messaged you' },
          { status: 403 }
        )
      }
    }

    // Determine the receiver
    const receiverId = conversation.clientId === senderId 
      ? conversation.professionalId 
      : conversation.clientId

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true
          }
        }
      }
    })

    // Update conversation's last message timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    })

    // Emit socket event for real-time updates
    const io = getIO()
    if (io) {
      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit('new-message', {
        conversationId,
        message
      })

      // Emit notification to receiver
      io.to(`user:${receiverId}`).emit('message-notification', {
        conversationId,
        message
      })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
} 