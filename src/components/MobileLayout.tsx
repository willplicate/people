'use client'

import { ReactNode, useState } from 'react'
import MobileHeader from './MobileHeader'
import MobileBottomNav from './MobileBottomNav'
import MobileMenu from './MobileMenu'
import Navigation from './Navigation'

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMenuClick = () => {
    console.log('Burger clicked! Opening menu...')
    setIsMenuOpen(true)
  }

  const handleClose = () => {
    console.log('Closing menu...')
    setIsMenuOpen(false)
  }

  console.log('MobileLayout render - isMenuOpen:', isMenuOpen)

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation />
      </div>

      {/* Mobile Header */}
      <MobileHeader onMenuClick={handleMenuClick} />

      {/* Mobile Menu Drawer */}
      <MobileMenu isOpen={isMenuOpen} onClose={handleClose} />

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