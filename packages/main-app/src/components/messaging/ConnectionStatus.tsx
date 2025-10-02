/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

'use client'

import { useSSE } from '@/hooks/useSSE'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface ConnectionStatusProps {
  showReconnectButton?: boolean
}

export function ConnectionStatus({ showReconnectButton = false }: ConnectionStatusProps) {
  const { isConnected, forceReconnect } = useSSE()

  const getStatus = () => {
    if (isConnected) {
      return { text: 'Connected', variant: 'default' as const }
    } else {
      return { text: 'Reconnecting...', variant: 'secondary' as const }
    }
  }

  const status = getStatus()

  return (
    <div className="flex items-center gap-2">
      <Badge variant={status.variant} className="text-xs">
        {status.text}
      </Badge>
      {showReconnectButton && !isConnected && (
        <Button
          variant="ghost"
          size="sm"
          onClick={forceReconnect}
          className="h-6 px-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
} 