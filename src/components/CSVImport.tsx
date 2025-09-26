'use client'

import { useState } from 'react'

interface ImportResults {
  successful: number
  failed: number
  errors: string[]
}

export default function CSVImport() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResults | null>(null)
  const [distributeContacts, setDistributeContacts] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setError(null)
      setResults(null)
    } else {
      setError('Please select a valid CSV file')
      setFile(null)
    }
  }

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}

      headers.forEach((header, index) => {
        const value = values[index]?.replace(/^"|"$/g, '').trim() // Remove quotes
        if (value && value !== '') {
          row[header] = value
        }
      })

      if (Object.keys(row).length > 0) {
        data.push(row)
      }
    }

    return data
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const csvText = await file.text()
      const csvData = parseCSV(csvText)

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData,
          distributeContacts
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      setResults(result.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `first_name,last_name,nickname,email,phone,address,birthday,communication_frequency,notes
John,Doe,Johnny,john@example.com,555-0123,123 Main St,01-15,monthly,College friend
Jane,Smith,,jane@example.com,555-0456,,03-22,quarterly,Work colleague`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-card p-6 rounded-card shadow-card">
      <h2 className="text-lg font-semibold text-foreground mb-4">Import Contacts from CSV</h2>

      <div className="space-y-4">
        {/* Download Template */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-card">
          <div>
            <p className="font-medium text-foreground">Need a template?</p>
            <p className="text-sm text-muted-foreground">Download a sample CSV with the correct format</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Download Template
          </button>
        </div>

        {/* CSV Format Info */}
        <div className="p-3 bg-muted rounded-card">
          <h3 className="font-medium text-foreground mb-2">CSV Format</h3>
          <p className="text-sm text-muted-foreground mb-2">Required columns:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside mb-3">
            <li><code>first_name</code> - Required</li>
            <li><code>last_name</code> - Optional</li>
            <li><code>nickname</code> - Optional</li>
            <li><code>email</code> - Optional</li>
            <li><code>phone</code> - Optional</li>
            <li><code>address</code> - Optional</li>
            <li><code>birthday</code> - Optional (format: MM-DD)</li>
            <li><code>communication_frequency</code> - Optional (weekly, monthly, quarterly, biannually, annually)</li>
            <li><code>notes</code> - Optional</li>
          </ul>
        </div>

        {/* File Upload */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Select CSV File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
          </label>

          {/* Distribution Option */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={distributeContacts}
              onChange={(e) => setDistributeContacts(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm text-foreground">
              Distribute contact dates randomly across the past year
            </span>
          </label>
          <p className="text-xs text-muted-foreground ml-6">
            When enabled, contacts with communication frequencies won&apos;t all be due immediately
          </p>
        </div>

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 disabled:bg-muted disabled:text-muted-foreground transition-colors"
        >
          {loading ? 'Importing...' : 'Import Contacts'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-card">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-card">
              <p className="text-sm text-green-800">
                Import completed: {results.successful} successful, {results.failed} failed
              </p>
            </div>

            {results.errors.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-card">
                <p className="text-sm font-medium text-yellow-800 mb-2">Errors:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {results.errors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {results.errors.length > 10 && (
                    <li>... and {results.errors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}