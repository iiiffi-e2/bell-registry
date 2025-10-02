/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendToConversation } from '@/lib/sse-utils'

// Type declaration for global.io
declare global {
  var io: any
}

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
    let conversation;
    try {
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { clientId: senderId },
            { professionalId: senderId }
          ]
        }
      })
    } catch (error) {
      console.error('Error finding conversation:', error)
      return NextResponse.json(
        { error: 'Failed to find conversation' },
        { status: 500 }
      )
    }

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
      try {
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
      } catch (error) {
        console.error('Error checking client messages:', error)
      }
    }

    // Determine the receiver
    const receiverId = conversation.clientId === senderId 
      ? conversation.professionalId 
      : conversation.clientId

    // Create the message
    let message;
    try {
      message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
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
    } catch (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Update conversation's last message timestamp
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      })
    } catch (error) {
      console.error('Error updating conversation timestamp:', error)
      // Don't fail the request for this
    }

    // Send real-time updates via SSE
    try {
      // Send to both conversation participants
      sendToConversation(conversationId, [conversation.clientId, conversation.professionalId], {
        type: 'new-message',
        data: {
          conversationId,
          message
        }
      })
    } catch (error) {
      console.error('Error sending SSE updates:', error)
      // Don't fail the request for SSE errors
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