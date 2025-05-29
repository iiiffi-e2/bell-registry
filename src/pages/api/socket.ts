import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import { Socket as NetSocket } from 'net'

interface SocketServer extends NetServer {
  io?: ServerIO | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    res.end()
    return
  }

  const io = new ServerIO(res.socket.server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  // Store io instance
  res.socket.server.io = io
  
  // Also store globally for API routes to access
  ;(global as any).io = io

  io.on('connection', (socket) => {
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
    })

    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
    })

    socket.on('disconnect', () => {
      // Connection cleanup handled automatically
    })
  })

  res.end()
}

export default SocketHandler 