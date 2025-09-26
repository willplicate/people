'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/contacts', label: 'Contacts' },
    { href: '/meetings', label: '📝 Meetings' },
    { href: '/tasks', label: '✅ Tasks' },
    { href: '/urgent-tasks', label: '🚨 Urgent', priority: true },
    { href: '/shopping', label: '🛒 Shopping' },
    { href: '/emergency-contacts', label: '🚨 Emergency', priority: true },
    { href: '/sync', label: '🔄 Sync' },
  ]

  return (
    <nav className="bg-card border-b border-border mb-8 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
              Personal CRM
            </Link>
            <div className="flex space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-card text-sm font-medium transition-all duration-200 hover:shadow-card ${
                    pathname === item.href
                      ? item.priority
                        ? 'bg-destructive text-destructive-foreground shadow-card'
                        : 'bg-primary text-primary-foreground shadow-card'
                      : item.priority
                      ? 'text-destructive hover:text-destructive-foreground hover:bg-destructive/20 border border-destructive/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}