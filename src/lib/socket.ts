import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiRequest } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export interface SocketServer extends HTTPServer {
  io?: SocketIOServer
}

export interface SocketWithAuth {
  userId: string
  userRole: string
}

export const initSocketIO = (httpServer: SocketServer) => {
  if (!httpServer.io) {
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        credentials: true,
      },
    })

    httpServer.io = io

    io.use(async (socket, next) => {
      const req = socket.request as NextApiRequest
      const session = await getServerSession(req as any, null as any, authOptions)
      
      if (!session?.user) {
        return next(new Error('Authentication required'))
      }

      (socket as any).userId = session.user.id
      (socket as any).userRole = session.user.role
      next()
    })

    io.on('connection', (socket) => {
      const { userId, userRole } = socket as any

      // Join user's personal room
      socket.join(`user:${userId}`)

      socket.on('join-conversation', async (conversationId: string) => {
        // Verify user has access to this conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [
              { clientId: userId },
              { professionalId: userId }
            ]
          }
        })

        if (conversation) {
          socket.join(`conversation:${conversationId}`)
        }
      })

      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`)
      })

      socket.on('disconnect', () => {
        console.log('User disconnected:', userId)
      })
    })
  }

  return httpServer.io
} 