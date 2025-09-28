import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Personal CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/simple/"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            🚀 Now Available • GitHub Pages Ready
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Stay Connected with<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Everyone That Matters
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            A beautiful, mobile-first personal CRM that helps you nurture relationships,
            remember important dates, and stay organized across all your personal connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/simple/"
              className="inline-flex items-center justify-center bg-blue-600 text-white text-lg px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="mr-2">📱</span>
              Open Personal CRM
            </Link>
            <Link
              href="/health/"
              className="inline-flex items-center justify-center bg-white text-gray-700 text-lg px-8 py-4 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-md border border-gray-200"
            >
              <span className="mr-2">🔍</span>
              System Health Check
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Management</h3>
            <p className="text-gray-600 leading-relaxed">
              Store and organize all your personal contacts with notes, birthdays, and communication preferences.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Reminders</h3>
            <p className="text-gray-600 leading-relaxed">
              Never forget to reach out again with automated reminders based on your communication frequency.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mobile Optimized</h3>
            <p className="text-gray-600 leading-relaxed">
              Designed mobile-first for quick access and updates while you're on the go.
            </p>
          </div>
        </div>

        {/* Status Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Deployment Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Static Export</span>
              </div>
              <span className="text-green-600 font-medium">Ready</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Database Connection</span>
              </div>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-blue-800">GitHub Pages</span>
              </div>
              <span className="text-blue-600 font-medium">Ready to Deploy</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-purple-800">Mobile Responsive</span>
              </div>
              <span className="text-purple-600 font-medium">Optimized</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/50 border-t border-gray-200/50 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="text-gray-600">Personal CRM • Built with Next.js & Supabase</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <Link href="/static-test/" className="hover:text-gray-700 transition-colors">Connection Test</Link>
              <Link href="/health/" className="hover:text-gray-700 transition-colors">Health Check</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}