'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { CategoryTotal, ExpenseCategory } from '@/types/database'

interface ExpensePieChartProps {
  totals: CategoryTotal[]
  categories: ExpenseCategory[]
}

export default function ExpensePieChart({ totals, categories }: ExpensePieChartProps) {
  // Track which categories are excluded from the chart
  const [excludedCategories, setExcludedCategories] = useState<Set<string>>(new Set())

  // Filter out excluded categories
  const visibleTotals = totals.filter(t => !excludedCategories.has(t.category_id))

  // Prepare data for the pie chart
  const chartData = visibleTotals.map(total => ({
    name: total.category_name,
    value: total.total_amount,
    color: total.category_color,
    icon: total.category_icon
  }))

  const totalVisible = visibleTotals.reduce((sum, t) => sum + t.total_amount, 0)
  const totalAll = totals.reduce((sum, t) => sum + t.total_amount, 0)

  const toggleCategory = (categoryId: string) => {
    const newExcluded = new Set(excludedCategories)
    if (newExcluded.has(categoryId)) {
      newExcluded.delete(categoryId)
    } else {
      newExcluded.add(categoryId)
    }
    setExcludedCategories(newExcluded)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = totalVisible > 0 ? (data.value / totalVisible) * 100 : 0
      return (
        <div className="bg-white px-3 py-2 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{data.icon} {data.name}</p>
          <p className="text-sm text-gray-600">
            ${data.value.toFixed(2)} ({percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Get excludable categories
  const excludableCategories = categories.filter(c => c.is_excludable)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Spending Distribution</h3>
        {excludedCategories.size > 0 && (
          <button
            onClick={() => setExcludedCategories(new Set())}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Show All
          </button>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <p>No expenses to display</p>
          <p className="text-sm mt-1">Add expenses to see the breakdown</p>
        </div>
      ) : (
        <>
          {/* Pie Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Total Display */}
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600">Total Shown</div>
            <div className="text-2xl font-bold text-gray-900">
              ${totalVisible.toFixed(2)}
            </div>
            {excludedCategories.size > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                ({totalAll.toFixed(2)} including excluded categories)
              </div>
            )}
          </div>

          {/* Toggle Buttons for Excludable Categories */}
          {excludableCategories.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Toggle Categories:
              </div>
              <div className="flex flex-wrap gap-2">
                {excludableCategories.map(cat => {
                  const isExcluded = excludedCategories.has(cat.id)
                  const categoryTotal = totals.find(t => t.category_id === cat.id)

                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        isExcluded
                          ? 'bg-gray-100 text-gray-500 line-through'
                          : 'text-white'
                      }`}
                      style={{
                        backgroundColor: isExcluded ? undefined : cat.color
                      }}
                    >
                      {cat.icon} {cat.name}
                      {categoryTotal && ` ($${categoryTotal.total_amount.toFixed(0)})`}
                    </button>
                  )
                })}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Click to hide/show categories from the chart
              </div>
            </div>
          )}

          {/* Legend with All Categories */}
          <div className="border-t pt-4 mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              All Categories:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {totals.map(total => {
                const isExcluded = excludedCategories.has(total.category_id)
                const percentage = totalAll > 0 ? (total.total_amount / totalAll) * 100 : 0

                return (
                  <div
                    key={total.category_id}
                    className={`flex items-center gap-2 text-sm ${
                      isExcluded ? 'opacity-40' : ''
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: total.category_color }}
                    />
                    <span className="truncate">
                      {total.category_icon} {total.category_name}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
