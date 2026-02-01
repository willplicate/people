'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TradingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the full trading page with coach
    router.push('/trading')
  }, [router])

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tertiary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Trading Coach...</p>
      </div>
    </div>
  )
}
