'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback

      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} retry={this.retry} />
      }

      return (
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md mx-auto mt-8">
          <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 text-sm"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple function component error fallback
export function ErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg max-w-md mx-auto mt-8">
      <h2 className="text-lg font-semibold text-destructive mb-2">Oops! Something went wrong</h2>
      <details className="mb-4">
        <summary className="text-sm text-muted-foreground cursor-pointer">Error details</summary>
        <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap break-words">
          {error.message}
        </pre>
      </details>
      <button
        onClick={retry}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 text-sm"
      >
        Try again
      </button>
    </div>
  )
}