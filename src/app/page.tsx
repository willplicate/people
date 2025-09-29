import UrgentTasks from '@/components/dashboard/UrgentTasks'
import UpcomingContacts from '@/components/dashboard/UpcomingContacts'
import UpcomingBirthdays from '@/components/dashboard/UpcomingBirthdays'
import WorkTasks from '@/components/dashboard/WorkTasks'
import PersonalTasks from '@/components/dashboard/PersonalTasks'
import ShoppingList from '@/components/dashboard/ShoppingList'

export default function Home() {
  return (
    <div className="space-y-gutter">
      <UrgentTasks />
      <UpcomingContacts />
      <UpcomingBirthdays />
      <WorkTasks />
      <PersonalTasks />
      <ShoppingList />
    </div>
  )
}