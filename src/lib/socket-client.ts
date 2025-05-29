import { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export const setIO = (socketIO: SocketIOServer) => {
  io = socketIO
}

export const getIO = (): SocketIOServer | null => {
  return io
} 