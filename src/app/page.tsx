import WelcomeSection from '@/components/dashboard/WelcomeSection'
import UrgentTasks from '@/components/dashboard/UrgentTasks'
import UpcomingContacts from '@/components/dashboard/UpcomingContacts'
import UpcomingBirthdays from '@/components/dashboard/UpcomingBirthdays'
import WorkTasks from '@/components/dashboard/WorkTasks'
import PersonalTasks from '@/components/dashboard/PersonalTasks'
import ShoppingList from '@/components/dashboard/ShoppingList'
import HomeworkJournal from '@/components/dashboard/HomeworkJournal'
import DailyContactReminders from '@/components/dashboard/DailyContactReminders'
import LifeCoachSection from '@/components/dashboard/LifeCoachSection'
import PersonalEncounterJournal from '@/components/dashboard/PersonalEncounterJournal'

// TODO: Replace with actual authenticated user ID
const USER_ID = '00000000-0000-0000-0000-000000000000'

export default function Home() {
  return (
    <div className="space-y-gutter">
      <WelcomeSection />
      <LifeCoachSection userId={USER_ID} />
      <HomeworkJournal />
      <PersonalEncounterJournal userId={USER_ID} />
      <DailyContactReminders />
      <UrgentTasks />
      <UpcomingContacts />
      <UpcomingBirthdays />
      <WorkTasks />
      <PersonalTasks />
      <ShoppingList />
    </div>
  )
}