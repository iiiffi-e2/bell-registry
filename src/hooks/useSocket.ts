'use client'

import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      socket = io({
        path: '/api/socket',
        addTrailingSlash: false,
      })

      socket.on('connect', () => {
        console.log('Socket connected')
        setIsConnected(true)
      })

      socket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })
    }

    return () => {
      if (socket) {
        socket.disconnect()
        socket = null
      }
    }
  }, [])

  return socket
} 