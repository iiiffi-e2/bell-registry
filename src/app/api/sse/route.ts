import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { registerSSEConnection, removeSSEConnection } from '@/lib/sse-utils'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const userId = session.user.id

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Register connection
      const connectionId = registerSSEConnection(userId, controller)

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
        removeSSEConnection(userId, connectionId)
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