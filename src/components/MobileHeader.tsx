'use client'

interface MobileHeaderProps {
  title?: string
  showMenu?: boolean
  onMenuClick?: () => void
}

export default function MobileHeader({
  title = "RelationCare",
  showMenu = true,
  onMenuClick
}: MobileHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-outer-padding py-4 flex items-center justify-between md:hidden">
      <div className="flex items-center">
        <h1 className="text-lg font-medium text-foreground">{title}</h1>
      </div>

      {showMenu && (
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
      )}
    </header>
  )
}