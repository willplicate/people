import type { Metadata } from 'next'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Personal CRM - Simple',
  description: 'Simple CRM interface without authentication',
}

export default function SimpleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="min-h-screen">
          {children}
        </div>
        {/* Simple layout - no providers, no auth, no navigation */}
      </body>
    </html>
  )
}