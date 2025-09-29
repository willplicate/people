'use client'

export default function WorkTasks() {
  const workTasks = [
    {
      id: 1,
      title: "Review marketing campaign",
      dueDate: "Due March 14",
      status: "pending"
    },
    {
      id: 2,
      title: "Team meeting preparation",
      dueDate: "Due March 15",
      status: "pending"
    }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Work Tasks</h2>
        <button className="text-tertiary text-sm font-medium">View All</button>
      </div>

      <div className="p-4 space-y-3">
        {workTasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-tertiary rounded-full"></div>
              <div>
                <h3 className="font-medium text-foreground">{task.title}</h3>
                <p className="text-sm text-muted-foreground">{task.dueDate}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}