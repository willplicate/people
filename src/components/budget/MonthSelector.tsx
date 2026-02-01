'use client'

import { BudgetMonth } from '@/types/database'

interface MonthSelectorProps {
  months: BudgetMonth[]
  selectedMonth: BudgetMonth | null
  onSelectMonth: (month: BudgetMonth) => void
  onFinalizeMonth?: (monthId: string) => void
}

export default function MonthSelector({
  months,
  selectedMonth,
  onSelectMonth,
  onFinalizeMonth
}: MonthSelectorProps) {
  const getMonthName = (monthNum: number) => {
    const date = new Date(2000, monthNum - 1, 1)
    return date.toLocaleDateString('en-US', { month: 'long' })
  }

  const formatMonthYear = (year: number, month: number) => {
    return `${getMonthName(month)} ${year}`
  }

  const isCurrentMonth = (year: number, month: number) => {
    const now = new Date()
    return now.getFullYear() === year && now.getMonth() + 1 === month
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Select Month</h3>

        {/* Finalize Button */}
        {selectedMonth && !selectedMonth.is_finalized && onFinalizeMonth && (
          <button
            onClick={() => {
              if (confirm(
                `Are you sure you want to finalize ${formatMonthYear(selectedMonth.year, selectedMonth.month)}? ` +
                'This will lock the month and prevent further edits.'
              )) {
                onFinalizeMonth(selectedMonth.id)
              }
            }}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Finalize Month
          </button>
        )}
      </div>

      {/* Month List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {months.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No months available
          </div>
        ) : (
          months.map(month => {
            const isSelected = selectedMonth?.id === month.id
            const isCurrent = isCurrentMonth(month.year, month.month)

            return (
              <button
                key={month.id}
                onClick={() => onSelectMonth(month)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {formatMonthYear(month.year, month.month)}
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    {month.is_finalized && (
                      <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Finalized
                        {month.finalized_at && (
                          <span className="text-gray-500">
                            on {new Date(month.finalized_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Info Text */}
      {selectedMonth?.is_finalized && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          This month is finalized and cannot be edited. View only.
        </div>
      )}
    </div>
  )
}
