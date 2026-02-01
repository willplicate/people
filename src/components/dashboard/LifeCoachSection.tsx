'use client'

import LifeCoachChat from './LifeCoachChat'
import HabitTracker from './HabitTracker'

interface LifeCoachSectionProps {
  userId: string
}

export default function LifeCoachSection({ userId }: LifeCoachSectionProps) {
  return (
    <div className="space-y-6">
      {/* Desktop: Side by side, Mobile: Stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat takes 2/3 on desktop */}
        <div className="lg:col-span-2">
          <LifeCoachChat userId={userId} />
        </div>

        {/* Habits take 1/3 on desktop */}
        <div className="lg:col-span-1">
          <HabitTracker userId={userId} />
        </div>
      </div>
    </div>
  )
}
