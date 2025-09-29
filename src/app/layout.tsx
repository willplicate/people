import type { Metadata } from 'next'
import './globals.css'
import MobileLayout from '@/components/MobileLayout'
import Providers from '@/components/Providers'

export const metadata: Metadata = {
  title: 'Personal CRM',
  description: 'Manage your personal relationships and stay connected',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon-32x32.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          <MobileLayout>
            {children}
          </MobileLayout>
        </Providers>
      </body>
    </html>
  )
}