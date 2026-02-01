'use client'

import { PlusIcon } from '@heroicons/react/24/outline'

interface AddButtonProps {
  onClick: () => void
  label?: string
}

export default function AddButton({ onClick, label = 'Add' }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-40
        flex items-center justify-center
        h-14 px-6 rounded-full
        bg-tertiary text-white
        shadow-lg hover:shadow-xl
        transition-all duration-200
        hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tertiary
        md:bottom-8 md:right-8
      "
      aria-label={label}
    >
      <PlusIcon className="h-6 w-6 mr-2" />
      <span className="font-medium">{label}</span>
    </button>
  )
}
