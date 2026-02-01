import { StatusColor } from '@/types/unified'

interface StatusPillProps {
  label: string
  color: StatusColor
  className?: string
}

const colorClasses: Record<StatusColor, string> = {
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
}

export default function StatusPill({ label, color, className = '' }: StatusPillProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
        ${colorClasses[color]}
        ${className}
      `}
    >
      {label}
    </span>
  )
}
