import Dashboard from '@/components/Dashboard'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Personal CRM Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Stay connected with friends and family through systematic relationship management.
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ✅ Deployment successful! Your Personal CRM is now running on Vercel.
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Branch: 019-clean-deploy | Build: {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'}
          </p>
        </div>
      </div>

      <Dashboard />
    </main>
  )
}