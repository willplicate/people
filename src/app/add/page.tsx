export default function Add() {
  return (
    <div className="space-y-gutter">
      <div className="bg-white border border-gray-200 rounded-card p-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Add New</h1>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-tertiary text-white p-6 rounded-card text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.002 1.002 0 0 0 19 8h-2c-.55 0-1 .45-1 1v5.5c0 .28.22.5.5.5s.5-.22.5-.5V10h1l2.05 6.76c.09.26.01.55-.19.72-.1.08-.22.12-.36.12H20v4c0 .55-.45 1-1 1s-1-.45-1-1z"/>
            </svg>
            <span className="font-medium">Contact</span>
          </button>

          <button className="bg-secondary text-secondary-foreground p-6 rounded-card text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            <span className="font-medium">Task</span>
          </button>

          <button className="bg-accent text-accent-foreground p-6 rounded-card text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm4 10v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v3h4v-3h2v7z"/>
            </svg>
            <span className="font-medium">Shopping Item</span>
          </button>

          <button className="bg-primary text-primary-foreground p-6 rounded-card text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
            <span className="font-medium">Event</span>
          </button>
        </div>
      </div>
    </div>
  )
}