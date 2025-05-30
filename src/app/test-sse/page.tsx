'use client'

import { useSSE } from '@/hooks/useSSE'
import { ConnectionStatus } from '@/components/messaging/ConnectionStatus'

export default function TestSSEPage() {
  const { isConnected, lastMessage } = useSSE()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">SSE Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="font-semibold">Connection Status:</label>
          <div className="mt-2">
            <ConnectionStatus />
          </div>
        </div>
        
        <div>
          <label className="font-semibold">Connection State:</label>
          <p className="text-sm text-gray-600">
            {isConnected ? 'Connected to SSE stream' : 'Not connected'}
          </p>
        </div>
        
        <div>
          <label className="font-semibold">Last Message:</label>
          <pre className="bg-gray-100 p-2 rounded text-xs mt-2">
            {lastMessage ? JSON.stringify(lastMessage, null, 2) : 'No messages yet'}
          </pre>
        </div>
      </div>
    </div>
  )
} 