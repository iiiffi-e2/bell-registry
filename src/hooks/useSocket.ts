'use client'

import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!socket) {
      // Initialize the Socket.IO server first
      fetch('/api/socket').then(() => {
        // Then connect to it
        socket = io({
          path: '/api/socket',
          addTrailingSlash: false,
        })

        socket.on('connect', () => {
          setIsConnected(true)
        })

        socket.on('disconnect', () => {
          setIsConnected(false)
        })

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error)
        })
      }).catch(error => {
        console.error('Failed to initialize Socket.IO server:', error)
      })
    }

    return () => {
      // Don't disconnect on component unmount, keep persistent connection
    }
  }, [])

  return socket
} 