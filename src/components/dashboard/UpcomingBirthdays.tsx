'use client'

export default function UpcomingBirthdays() {
  const birthdays = [
    {
      id: 1,
      name: "Emma Wilson",
      birthday: "Birthday in 3 days",
      date: "March 15",
      avatar: "EW"
    }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Upcoming Birthdays</h2>
        <button className="text-tertiary text-sm font-medium">View All</button>
      </div>

      <div className="p-4 space-y-4">
        {birthdays.map((person) => (
          <div key={person.id} className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-secondary-foreground">
                {person.avatar}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{person.name}</h3>
              <p className="text-sm text-muted-foreground">{person.birthday}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-secondary">{person.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}