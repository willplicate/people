import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Supabase Connection Test',
  description: 'Test Supabase database connectivity',
}

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}