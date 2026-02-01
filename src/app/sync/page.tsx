'use client'

// Disabled for static export
export default function SyncPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">🔄 Sync (Disabled)</h1>
        <p className="text-gray-600">
          Google sync is disabled in the static export version.
          Use the full CRM version for sync functionality.
        </p>
      </div>
    </div>
  )
}