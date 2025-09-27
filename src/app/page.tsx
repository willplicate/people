import Link from 'next/link'

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏠 Personal CRM
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          Stay connected with friends and family through systematic relationship management.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-3">✅ Deployment Status</h2>
            <p className="text-green-700">Successfully deployed on Netlify!</p>
            <p className="text-sm text-green-600 mt-2">
              Static export with direct Supabase connection
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">🚀 Ready to Use</h2>
            <p className="text-blue-700">Your CRM is ready for mobile testing</p>
            <p className="text-sm text-blue-600 mt-2">
              Add contacts, manage relationships, stay organized
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/simple/"
            className="inline-block bg-blue-600 text-white text-lg px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📱 Open Personal CRM
          </Link>

          <div className="text-sm text-gray-500">
            <p>Other available pages:</p>
            <div className="flex justify-center space-x-4 mt-2">
              <Link href="/health/" className="text-blue-600 hover:text-blue-800">Health Check</Link>
              <Link href="/static-test/" className="text-blue-600 hover:text-blue-800">Connection Test</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}