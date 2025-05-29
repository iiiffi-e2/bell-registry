'use client'

import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      console.log('Initializing Socket.IO connection...')
      socket = io({
        addTrailingSlash: false,
      })

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id)
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })
    }

    return () => {
      // Don't disconnect on component unmount, keep persistent connection
      // if (socket) {
      //   socket.disconnect()
      //   socket = null
      // }
    }
  }, [])

  return socket
} 