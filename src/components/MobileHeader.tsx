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
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
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