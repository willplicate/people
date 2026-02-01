export default function HealthCheck() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-green-800 mb-4">✅ Health Check</h1>
        <div className="space-y-2 text-green-700">
          <p><strong>Status:</strong> Application is running</p>
          <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
          <p><strong>Vercel:</strong> {process.env.VERCEL ? 'Yes' : 'No'}</p>
        </div>
        <div className="mt-6">
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}