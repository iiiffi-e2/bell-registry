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

      // Set up heartbeat with shorter interval for better connection health
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`)
        } catch (error) {
          console.log('SSE heartbeat failed, cleaning up connection')
          clearInterval(heartbeat)
          cleanup()
        }
      }, 15000) // Send heartbeat every 15 seconds

      const cleanup = () => {
        clearInterval(heartbeat)
        removeSSEConnection(userId, connectionId)
        console.log(`SSE connection cleaned up for user ${userId}`)
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        console.log(`SSE connection aborted for user ${userId}`)
        cleanup()
      })

      // Handle controller close
      const originalClose = controller.close
      controller.close = function() {
        cleanup()
        return originalClose.call(this)
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
} 