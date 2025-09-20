import { NextRequest, NextResponse } from 'next/server'
import { ExportService } from '@/services/ExportService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = (searchParams.get('format') as 'json' | 'csv') || 'json'

    const exportData = await ExportService.exportAllData(format)

    if (format === 'csv') {
      return new NextResponse(exportData as string, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="personal-crm-export.csv"',
        },
      })
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}