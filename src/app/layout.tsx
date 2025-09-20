import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Personal CRM',
  description: 'Manage your personal relationships and stay connected',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  )
}