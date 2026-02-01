'use client'

// Disabled for static export - causes API route dependencies
// import { SessionProvider } from 'next-auth/react'

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  // No session provider for static export
  return <>{children}</>
}