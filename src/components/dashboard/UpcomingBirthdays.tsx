'use client'

import { useState, useEffect } from 'react'
import { DashboardService } from '@/services/DashboardService'
import { Contact } from '@/types/database'

interface UpcomingBirthday {
  contact: Contact
  birthdayDate: Date
  daysUntil: number
}

export default function UpcomingBirthdays() {
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBirthdays() {
      try {
        const dashboardStats = await DashboardService.getDashboardStats()
        setBirthdays(dashboardStats.recentActivity.upcomingBirthdays)
      } catch (error) {
        console.error('Failed to load birthdays:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBirthdays()
  }, [])

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-card">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-foreground">Upcoming Birthdays</h2>
          <button className="text-tertiary text-sm font-medium">View All</button>
        </div>
        <div className="p-4 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-card">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-foreground">Upcoming Birthdays</h2>
        <button className="text-tertiary text-sm font-medium">View All</button>
      </div>

      <div className="p-4 space-y-4">
        {birthdays.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No upcoming birthdays
          </div>
        ) : (
          birthdays.map((birthday) => (
            <div key={birthday.contact.id} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-secondary-foreground">
                  {birthday.contact.first_name?.[0]}{birthday.contact.last_name?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">
                  {birthday.contact.first_name} {birthday.contact.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {birthday.daysUntil === 0 ? 'Today!' :
                   birthday.daysUntil === 1 ? 'Tomorrow' :
                   `In ${birthday.daysUntil} days`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-secondary">
                  {birthday.contact.birthday || 'N/A'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}