'use client'

import { ReactNode } from 'react'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'
import Navigation from './Navigation'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation />
      </div>

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <main className="min-h-screen bg-white pb-20 md:pb-0">
        <div className="px-outer-padding py-gutter md:max-w-7xl md:mx-auto md:px-4">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  )
}