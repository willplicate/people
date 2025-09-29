'use client'

export default function UrgentTasks() {
  const urgentTasks = [
    {
      id: 1,
      title: "Call Mom about weekend plans",
      dueTime: "Due today",
      timeLeft: "20:39"
    },
    {
      id: 2,
      title: "Submit project proposal",
      dueTime: "Due in 2 hours",
      timeLeft: null
    }
  ]

  return (
    <div className="bg-red-50 border border-destructive/20 rounded-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-destructive">Urgent Tasks</h2>
        {urgentTasks.length > 0 && urgentTasks[0].timeLeft && (
          <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
            {urgentTasks[0].timeLeft}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {urgentTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-md p-3 border border-destructive/10">
            <h3 className="font-medium text-foreground mb-1">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{task.dueTime}</p>
          </div>
        ))}
      </div>
    </div>
  )
}