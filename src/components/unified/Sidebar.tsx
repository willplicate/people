'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  UserGroupIcon,
  CakeIcon,
  BellIcon,
  CheckCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface SidebarProps {
  onNavigate?: () => void
}

const navigation = [
  { name: 'Home', href: '/unified', icon: HomeIcon },
  { name: 'Contacts', href: '/unified/contacts', icon: UserGroupIcon },
  { name: 'Birthdays', href: '/unified/birthdays', icon: CakeIcon },
  { name: 'Reminders', href: '/unified/reminders', icon: BellIcon },
  { name: 'Tasks', href: '/unified/tasks', icon: CheckCircleIcon },
  { name: 'Trading', href: '/unified/trading', icon: CurrencyDollarIcon },
]

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo/Header */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Personal CRM</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/unified' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  isActive
                    ? 'bg-tertiary text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }
              `}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-500 text-center">
          Unified Spreadsheet UI
        </p>
      </div>
    </div>
  )
}
