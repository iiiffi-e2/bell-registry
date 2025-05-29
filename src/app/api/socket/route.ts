import { NextRequest } from 'next/server'
import { initSocketIO, SocketServer } from '@/lib/socket'
import { setIO } from '@/lib/socket-client'

export async function GET(request: NextRequest) {
  const httpServer = (global as any).httpServer as SocketServer
  
  if (!httpServer) {
    return new Response('Socket.IO server not initialized', { status: 500 })
  }

  const io = initSocketIO(httpServer)
  setIO(io)

  return new Response('Socket.IO is running', { status: 200 })
}

export async function POST(request: NextRequest) {
  return GET(request)
} 