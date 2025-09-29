'use client'

export default function UpcomingContacts() {
  const contacts = [
    {
      id: 1,
      name: "Sarah Johnson",
      lastContacted: "Last contacted 2 weeks ago",
      dueDate: "Due Today",
      avatar: "SJ",
      priority: true
    },
    {
      id: 2,
      name: "Mike Chen",
      lastContacted: "Last contacted 1 month ago",
      dueDate: "Tomorrow",
      avatar: "MC",
      priority: false
    }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Upcoming Contacts</h2>
        <button className="text-tertiary text-sm font-medium">View All</button>
      </div>

      <div className="p-4 space-y-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {contact.avatar}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">{contact.name}</h3>
                <p className="text-sm text-muted-foreground">{contact.lastContacted}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${
                contact.priority ? 'text-secondary' : 'text-muted-foreground'
              }`}>
                {contact.dueDate}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}