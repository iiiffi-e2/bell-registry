import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Store active SSE connections
const connections = new Map<string, ReadableStreamDefaultController>()
const userConnections = new Map<string, Set<string>>()

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const userId = session.user.id

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const connectionId = Math.random().toString(36).substring(7)
      
      // Store connection
      connections.set(connectionId, controller)
      
      // Associate user with connection
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set())
      }
      userConnections.get(userId)!.add(connectionId)

      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', connectionId })}\n\n`)

      // Set up heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
          cleanup()
        }
      }, 30000)

      const cleanup = () => {
        clearInterval(heartbeat)
        connections.delete(connectionId)
        
        const userConns = userConnections.get(userId)
        if (userConns) {
          userConns.delete(connectionId)
          if (userConns.size === 0) {
            userConnections.delete(userId)
          }
        }
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup)
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// Function to send messages to specific users
export function sendToUser(userId: string, data: any) {
  const userConns = userConnections.get(userId)
  if (userConns) {
    userConns.forEach(connectionId => {
      const controller = connections.get(connectionId)
      if (controller) {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
        } catch (error) {
          // Connection closed, remove it
          connections.delete(connectionId)
          userConns.delete(connectionId)
        }
      }
    })
  }
}

// Function to send messages to conversation participants
export function sendToConversation(conversationId: string, participantIds: string[], data: any) {
  participantIds.forEach(userId => {
    sendToUser(userId, { ...data, conversationId })
  })
} 