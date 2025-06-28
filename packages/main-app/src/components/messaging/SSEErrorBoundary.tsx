'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface SSEErrorBoundaryProps {
  children: React.ReactNode
}

interface SSEErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class SSEErrorBoundary extends React.Component<SSEErrorBoundaryProps, SSEErrorBoundaryState> {
  constructor(props: SSEErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): SSEErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SSE Error Boundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <p className="font-medium text-yellow-800">Real-time messaging error</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Connection to real-time messaging failed. Messages may not appear instantly.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 