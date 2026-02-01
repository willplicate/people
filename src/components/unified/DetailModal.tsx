'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'

interface DetailModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function DetailModal({ open, onClose, title, children }: DetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-[9999] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title || 'Details'}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
