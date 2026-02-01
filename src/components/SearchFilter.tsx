'use client'

import { useState, useEffect } from 'react'

interface SearchFilterProps {
  onSearchChange?: (query: string) => void
  onFilterChange?: (filters: FilterOptions) => void
  className?: string
}

export interface FilterOptions {
  communicationFrequency?: string
  hasUpcomingBirthday?: boolean
  needsAttention?: boolean
  remindersPaused?: boolean
  christmasList?: boolean
  noFrequency?: boolean
}

export default function SearchFilter({ onSearchChange, onFilterChange, className = '' }: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterOptions>({})
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearchChange?.(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, onSearchChange])

  useEffect(() => {
    onFilterChange?.(filters)
  }, [filters, onFilterChange])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearAllFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== undefined && value !== '' && value !== false
  )

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search contacts by name, notes, or contact info..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Communication Frequency Filter */}
            <div>
              <label htmlFor="communicationFrequency" className="block text-sm font-medium text-gray-700 mb-1">
                Communication Frequency
              </label>
              <select
                id="communicationFrequency"
                value={filters.communicationFrequency || ''}
                onChange={(e) => handleFilterChange('communicationFrequency', e.target.value || undefined)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Any frequency</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannually">Biannually</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            {/* Quick Filter Checkboxes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Quick Filters</label>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasUpcomingBirthday || false}
                    onChange={(e) => handleFilterChange('hasUpcomingBirthday', e.target.checked || undefined)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Upcoming birthday (next 30 days)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.needsAttention || false}
                    onChange={(e) => handleFilterChange('needsAttention', e.target.checked || undefined)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Needs attention (overdue contact)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.remindersPaused || false}
                    onChange={(e) => handleFilterChange('remindersPaused', e.target.checked || undefined)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Reminders paused</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.christmasList || false}
                    onChange={(e) => handleFilterChange('christmasList', e.target.checked || undefined)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">🎄 On Christmas list</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.noFrequency || false}
                    onChange={(e) => handleFilterChange('noFrequency', e.target.checked || undefined)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">No frequency assigned</span>
                </label>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-2">Active filters:</div>
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: &quot;{searchQuery}&quot;
                  </span>
                )}
                {filters.communicationFrequency && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {filters.communicationFrequency}
                  </span>
                )}
                {filters.hasUpcomingBirthday && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Upcoming birthday
                  </span>
                )}
                {filters.needsAttention && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Needs attention
                  </span>
                )}
                {filters.remindersPaused && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Reminders paused
                  </span>
                )}
                {filters.christmasList && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🎄 Christmas list
                  </span>
                )}
                {filters.noFrequency && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    No frequency
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}