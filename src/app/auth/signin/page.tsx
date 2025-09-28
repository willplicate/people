'use client'

// Disabled for static export
export default function SignInPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">🔐 Sign In (Disabled)</h1>
        <p className="text-gray-600">
          Authentication is disabled in the static export version.
          Use the full CRM version for authentication features.
        </p>
      </div>
    </div>
  )
}