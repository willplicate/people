'use client'

import { useEffect } from 'react'

export default function ShoppingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Shopping page error:', error)
  }, [error])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error loading shopping</h2>
        <p className="text-muted-foreground mb-6">
          There was a problem loading the shopping section. Please try again.
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  )
}