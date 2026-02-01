import UnifiedLayout from '@/components/unified/UnifiedLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Unified CRM - Will Ford',
  description: 'Unified spreadsheet interface for Personal CRM',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <UnifiedLayout>{children}</UnifiedLayout>
}
