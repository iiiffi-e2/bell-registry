'use client'

import { useSSE } from '@/hooks/useSSE'
import { ConnectionStatus } from '@/components/messaging/ConnectionStatus'

export default function TestSSEPage() {
  const { isConnected, lastMessage, forceReconnect } = useSSE()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">SSE Connection Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="font-semibold">Connection Status:</label>
          <div className="mt-2">
            <ConnectionStatus showReconnectButton={true} />
          </div>
        </div>
        
        <div>
          <label className="font-semibold">Connection Details:</label>
          <div className="space-y-2 text-sm text-gray-600 mt-2">
            <p>Status: {isConnected ? '✅ Connected to SSE stream' : '❌ Disconnected'}</p>
            <p>URL: /api/sse</p>
            <p>Auto-reconnection: Enabled with exponential backoff</p>
            <p>Heartbeat: Every 15 seconds</p>
          </div>
        </div>
        
        <div>
          <label className="font-semibold">Last Message:</label>
          <pre className="bg-gray-100 p-4 rounded text-xs mt-2 max-h-64 overflow-auto">
            {lastMessage ? JSON.stringify(lastMessage, null, 2) : 'No messages yet'}
          </pre>
        </div>

        <div>
          <label className="font-semibold">Actions:</label>
          <div className="mt-2 space-x-2">
            <button
              onClick={forceReconnect}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Force Reconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 