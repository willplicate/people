'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import { Bars3Icon } from '@heroicons/react/24/outline'

interface UnifiedLayoutProps {
  children: React.ReactNode
}

export default function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Desktop Sidebar - Fixed, always visible on md+ */}
      <aside className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto z-30">
        <Sidebar />
      </aside>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          {/* Mobile Menu Button - Floating */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white text-gray-600 hover:bg-gray-100 rounded-md shadow-md border border-gray-200"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          {children}
        </main>
      </div>
    </div>
  )
}
