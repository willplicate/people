export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Personal CRM
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          A simple personal relationship management system.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Static Build:</span>
              <span className="text-green-600">✓ Ready</span>
            </div>
            <div className="flex justify-between">
              <span>GitHub Pages:</span>
              <span className="text-blue-600">Deploying...</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          This is a placeholder page. The CRM will be redesigned from scratch.
        </p>
      </div>
    </div>
  )
}