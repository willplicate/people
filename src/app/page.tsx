import Dashboard from '@/components/Dashboard'

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Personal CRM Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Stay connected with friends and family through systematic relationship management.
        </p>
      </div>

      <Dashboard />
    </main>
  )
}