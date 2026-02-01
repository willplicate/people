'use client'

import { CategoryTotal } from '@/types/database'

interface CategoryTotalsProps {
  totals: CategoryTotal[]
  totalSpending: number
}

export default function CategoryTotals({ totals, totalSpending }: CategoryTotalsProps) {
  // Sort by total amount descending
  const sortedTotals = [...totals].sort((a, b) => b.total_amount - a.total_amount)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Spending by Category</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">% of Total</th>
              <th className="px-4 py-3 text-right"># Expenses</th>
              <th className="px-4 py-3 text-right">Avg/Expense</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTotals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No expenses yet
                </td>
              </tr>
            ) : (
              sortedTotals.map(total => {
                const percentage = totalSpending > 0 ? (total.total_amount / totalSpending) * 100 : 0
                const avgPerExpense = total.expense_count > 0 ? total.total_amount / total.expense_count : 0

                return (
                  <tr key={total.category_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{total.category_icon}</span>
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: total.category_color }}
                        />
                        <span className="font-medium">{total.category_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      €{total.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: total.category_color
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {total.expense_count}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      €{avgPerExpense.toFixed(2)}
                    </td>
                  </tr>
                )
              })
            )}

            {/* Total Row */}
            {sortedTotals.length > 0 && (
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">
                  €{totalSpending.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">100%</td>
                <td className="px-4 py-3 text-right">
                  {sortedTotals.reduce((sum, t) => sum + t.expense_count, 0)}
                </td>
                <td className="px-4 py-3"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
