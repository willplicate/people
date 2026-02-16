'use client'

import { useState, useEffect } from 'react'
import { SpreadsheetItem, ItemType } from '@/types/unified'
import { PersonalTask, Contact, PersonalRecipe, OptionsTrade, Meeting } from '@/types/database'
import { PersonalTaskService } from '@/services/PersonalTaskService'
import { ContactService } from '@/services/ContactService'
import { RecipeService } from '@/services/RecipeService'
import { TradingService } from '@/services/TradingService'
import { MeetingService } from '@/services/MeetingService'
import { tasksToSpreadsheetItems } from '@/adapters/taskAdapter'
import { birthdaysToSpreadsheetItems } from '@/adapters/birthdayAdapter'
import { contactsToSpreadsheetItems } from '@/adapters/contactAdapter'
import { recipesToSpreadsheetItems } from '@/adapters/recipeAdapter'
import { groupedTradesToSpreadsheetItems } from '@/adapters/tradingAdapter'
import { meetingsToSpreadsheetItems } from '@/adapters/meetingAdapter'
import SpreadsheetList from '@/components/unified/SpreadsheetList'
import { Squares2X2Icon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

// Mock user ID - replace with actual auth when available
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'

export default function UnifiedHome() {
  const [birthdayItems, setBirthdayItems] = useState<SpreadsheetItem[]>([])
  const [contactItems, setContactItems] = useState<SpreadsheetItem[]>([])
  const [taskItems, setTaskItems] = useState<SpreadsheetItem[]>([])
  const [tradingItems, setTradingItems] = useState<SpreadsheetItem[]>([])
  const [recipeItems, setRecipeItems] = useState<SpreadsheetItem[]>([])
  const [meetingItems, setMeetingItems] = useState<SpreadsheetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMeetingIds, setExpandedMeetingIds] = useState<Set<string>>(new Set())

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    birthdays: false,
    contacts: false,
    tasks: false,
    meetings: false,
    trading: false,
    recipes: false,
  })

  useEffect(() => {
    loadAllItems()
  }, [])

  const loadAllItems = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [tasks, contacts, recipes, trades, meetings] = await Promise.all([
        PersonalTaskService.getAll({ status: 'todo' }),
        ContactService.getAll(),
        RecipeService.getAll(),
        TradingService.getAllTrades(MOCK_USER_ID),
        MeetingService.getAll({ limit: 50 }), // Get all recent meetings (including Granola)
      ])

      // Convert to spreadsheet items
      const birthdays = birthdaysToSpreadsheetItems(contacts, 10) // Next 10 days only
      const contactsNeedingOutreach = contactsToSpreadsheetItems(contacts) // Only those needing outreach
      const todoTasks = tasksToSpreadsheetItems(tasks)
      const openTrades = groupedTradesToSpreadsheetItems(trades.filter(t => t.status === 'OPEN'))
      const allRecipes = recipesToSpreadsheetItems(recipes)
      const recentMeetings = meetingsToSpreadsheetItems(meetings)

      // Sort each group by due date/name
      const sortByDueDate = (items: SpreadsheetItem[]) => {
        return items.sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return a.dueDate.getTime() - b.dueDate.getTime() // Ascending (soonest first)
          }
          if (a.dueDate) return -1
          if (b.dueDate) return 1
          return a.name.localeCompare(b.name)
        })
      }

      // Sort meetings in descending order (most recent first)
      const sortByDueDateDescending = (items: SpreadsheetItem[]) => {
        return items.sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return b.dueDate.getTime() - a.dueDate.getTime() // Descending (most recent first)
          }
          if (a.dueDate) return 1
          if (b.dueDate) return -1
          return a.name.localeCompare(b.name)
        })
      }

      setBirthdayItems(sortByDueDate([...birthdays]))
      setContactItems(sortByDueDate([...contactsNeedingOutreach]))
      setTaskItems(sortByDueDate([...todoTasks]))
      setMeetingItems(sortByDueDateDescending([...recentMeetings])) // Most recent meetings first
      setTradingItems(sortByDueDate([...openTrades]))
      setRecipeItems(allRecipes.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkComplete = async (selectedItems: SpreadsheetItem[]) => {
    try {
      // Mark tasks as completed
      const tasks = selectedItems
        .filter(item => item.type === 'task')
        .map(item => item.metadata as PersonalTask)
        .filter(task => task.status === 'todo' || task.status === 'in_progress')

      // Mark contacts as contacted (update last_contacted_at)
      const contacts = selectedItems
        .filter(item => item.type === 'contact')
        .map(item => item.metadata as Contact)

      await Promise.all([
        ...tasks.map(task => PersonalTaskService.markCompleted(task.id)),
        ...contacts.map(contact => ContactService.updateLastContactedAt(contact.id)),
      ])

      await loadAllItems()
    } catch (error) {
      console.error('Error completing items:', error)
    }
  }

  const handleBulkDelete = async (selectedItems: SpreadsheetItem[]) => {
    try {
      const tasks = selectedItems
        .filter(item => item.type === 'task')
        .map(item => item.metadata as PersonalTask)

      await Promise.all(tasks.map(task => PersonalTaskService.delete(task.id)))
      await loadAllItems()
    } catch (error) {
      console.error('Error deleting items:', error)
    }
  }

  const toggleMeetingExpansion = (meetingId: string) => {
    const newExpanded = new Set(expandedMeetingIds)
    if (newExpanded.has(meetingId)) {
      newExpanded.delete(meetingId)
    } else {
      newExpanded.add(meetingId)
    }
    setExpandedMeetingIds(newExpanded)
  }

  const handleRowClick = (item: SpreadsheetItem) => {
    // Navigate to appropriate detail view based on type
    if (item.type === 'task') {
      // Open task detail modal (to be implemented)
      console.log('Open task:', item)
    } else if (item.type === 'birthday') {
      const contact = item.metadata as Contact
      window.location.href = `/contacts/${contact.id}`
    } else if (item.type === 'contact') {
      const contact = item.metadata as Contact
      window.location.href = `/contacts/${contact.id}`
    } else if (item.type === 'reminder') {
      // Check if it's a trade, recipe, or meeting
      const metadata = item.metadata as any
      if (metadata.ticker_symbol) {
        // It's a trade - navigate to trading page
        window.location.href = '/trading'
      } else if (metadata.summary && metadata.source) {
        // It's a meeting - toggle expansion instead of navigating
        toggleMeetingExpansion(item.id)
      } else {
        // It's a recipe
        const recipe = item.metadata as PersonalRecipe
        console.log('Open recipe:', recipe)
        // Could navigate to recipe detail page if it exists
      }
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getDisplayItems = (items: SpreadsheetItem[], section: string, limit: number = 5) => {
    return expandedSections[section] ? items : items.slice(0, limit)
  }

  const sections = [
    {
      key: 'birthdays',
      title: 'Birthdays',
      emoji: '🎂',
      items: birthdayItems,
      color: 'bg-purple-50 border-purple-200',
    },
    {
      key: 'contacts',
      title: 'Contacts to Reach',
      emoji: '👤',
      items: contactItems,
      color: 'bg-blue-50 border-blue-200',
    },
    {
      key: 'tasks',
      title: 'Tasks',
      emoji: '✅',
      items: taskItems,
      color: 'bg-green-50 border-green-200',
    },
    {
      key: 'meetings',
      title: 'Meetings',
      emoji: '📅',
      items: meetingItems,
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      key: 'trading',
      title: 'Open Positions',
      emoji: '📈',
      items: tradingItems,
      color: 'bg-emerald-50 border-emerald-200',
    },
    {
      key: 'recipes',
      title: 'Recipes',
      emoji: '📖',
      items: recipeItems,
      color: 'bg-orange-50 border-orange-200',
    },
  ]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 p-4">
        {sections.map((section) => {
          const displayItems = getDisplayItems(section.items, section.key)
          const hasMore = section.items.length > 5
          const isExpanded = expandedSections[section.key]

          if (section.items.length === 0) return null

          return (
            <div key={section.key} className={`border rounded-lg ${section.color}`}>
              {/* Section Header */}
              <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <span>{section.emoji}</span>
                  <span>{section.title}</span>
                  <span className="text-xs font-normal text-gray-500">({section.items.length})</span>
                </h2>
                {hasMore && (
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="text-xs text-tertiary hover:text-tertiary/80 font-medium"
                  >
                    {isExpanded ? 'Show Less' : `Show All (${section.items.length})`}
                  </button>
                )}
              </div>

              {/* Section Items */}
              <div className="bg-white">
                {section.key === 'meetings' ? (
                  /* Custom expandable rendering for meetings */
                  <div className="divide-y divide-gray-100">
                    {displayItems.map((item) => {
                      const meeting = item.metadata as Meeting
                      const isExpanded = expandedMeetingIds.has(item.id)

                      return (
                        <div key={item.id}>
                          {/* Meeting Row */}
                          <div
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                            onClick={() => toggleMeetingExpansion(item.id)}
                          >
                            {/* Expand/Collapse Arrow */}
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </div>

                            {/* Meeting Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {item.name}
                                </span>
                                {item.status && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                    ${item.status.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                                    ${item.status.color === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
                                  `}>
                                    {item.status.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {item.activity}
                                {meeting.source === 'granola_mcp' && (
                                  <span className="ml-2 text-purple-600">• Granola</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Meeting Details */}
                          {isExpanded && (
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                              {/* Debug: Show all available fields */}
                              <details className="mb-4">
                                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                                  Debug: Show all fields
                                </summary>
                                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                                  {JSON.stringify(meeting, null, 2)}
                                </pre>
                              </details>

                              {meeting.description ? (
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                  <div className="font-medium text-gray-900 mb-2">Meeting Notes:</div>
                                  {meeting.description}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">
                                  No notes available for this meeting.
                                </div>
                              )}
                              <div className="mt-3 text-xs text-gray-500">
                                <div>
                                  <span className="font-medium">Start:</span>{' '}
                                  {new Date(meeting.start_time).toLocaleString()}
                                </div>
                                <div>
                                  <span className="font-medium">End:</span>{' '}
                                  {new Date(meeting.end_time).toLocaleString()}
                                </div>
                                {meeting.calendar_id && (
                                  <div>
                                    <span className="font-medium">Calendar:</span> {meeting.calendar_id}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Standard SpreadsheetList for other sections */
                  <SpreadsheetList
                    items={displayItems}
                    onRowClick={handleRowClick}
                    showCheckbox={true}
                    onBulkComplete={handleBulkComplete}
                    onBulkDelete={handleBulkDelete}
                    loading={false}
                    emptyTitle={`No ${section.title.toLowerCase()}`}
                    emptyDescription=""
                  />
                )}
              </div>
            </div>
          )
        })}

        {birthdayItems.length === 0 && contactItems.length === 0 && taskItems.length === 0 && meetingItems.length === 0 && tradingItems.length === 0 && recipeItems.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Squares2X2Icon className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">All Clear!</p>
            <p className="text-sm">No items need your attention right now.</p>
          </div>
        )}
      </div>
    </div>
  )
}
