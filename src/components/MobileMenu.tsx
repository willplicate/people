'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname()

  // Close menu when pathname changes
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/contacts', label: 'Contacts' },
    { href: '/wedding', label: 'Wedding' },
    { href: '/meetings', label: 'Meetings' },
    { href: '/tasks', label: 'Tasks' },
    { href: '/urgent-tasks', label: 'Urgent Tasks', priority: true },
    { href: '/shopping', label: 'Shopping' },
    { href: '/emergency-contacts', label: 'Emergency Contacts', priority: true },
    { href: '/sync', label: 'Sync' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Menu Drawer */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 md:hidden overflow-y-auto transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-foreground">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? item.priority
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-primary/10 text-tertiary'
                    : item.priority
                    ? 'text-destructive hover:bg-destructive/5'
                    : 'text-foreground hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}