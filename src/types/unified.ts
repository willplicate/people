/**
 * Unified Spreadsheet UI Types
 * Common interfaces for the unified spreadsheet-like interface
 */

export type StatusColor = 'gray' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple'

export type ItemType = 'task' | 'birthday' | 'contact' | 'reminder'

export interface SpreadsheetStatus {
  label: string
  color: StatusColor
}

export interface SpreadsheetItem {
  id: string
  name: string
  type?: ItemType
  isFavorite?: boolean
  status?: SpreadsheetStatus
  activity?: string
  dueDate?: Date  // For sorting
  metadata?: Record<string, any>
}

export interface SpreadsheetColumn {
  key: string
  label: string
  width?: string
  className?: string
}
