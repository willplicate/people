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
      <body>
        {children}
      </body>
    </html>
  )
}