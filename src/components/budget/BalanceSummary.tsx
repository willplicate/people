'use client'

import { MonthlyBalance } from '@/types/database'

interface BalanceSummaryProps {
  balance: MonthlyBalance
}

export default function BalanceSummary({ balance }: BalanceSummaryProps) {
  const isEven = Math.abs(balance.net_balance) < 0.01
  const youOwe = balance.net_balance < 0
  const partnerOwes = balance.net_balance > 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Balance Summary</h3>

      {/* Payment Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-700 font-medium mb-1">Will Paid</div>
          <div className="text-2xl font-bold text-blue-900">
            €{balance.current_user_paid.toFixed(2)}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-700 font-medium mb-1">Jucas Paid</div>
          <div className="text-2xl font-bold text-purple-900">
            €{balance.partner_paid.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Shared Expenses Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Will Owes for Shared</div>
          <div className="text-xl font-semibold text-gray-900">
            €{balance.current_user_owes.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Jucas Owes for Shared</div>
          <div className="text-xl font-semibold text-gray-900">
            €{balance.partner_owes.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Net Balance - Prominent Display */}
      <div className={`rounded-lg p-6 text-center ${
        isEven ? 'bg-green-50 border-2 border-green-200' :
        youOwe ? 'bg-red-50 border-2 border-red-200' :
        'bg-blue-50 border-2 border-blue-200'
      }`}>
        <div className="text-sm font-medium mb-2 text-gray-700">
          Net Balance
        </div>
        <div className={`text-3xl font-bold mb-2 ${
          isEven ? 'text-green-700' :
          youOwe ? 'text-red-700' :
          'text-blue-700'
        }`}>
          {isEven && '✓ Even'}
          {youOwe && `Will Owes €${Math.abs(balance.net_balance).toFixed(2)}`}
          {partnerOwes && `Jucas Owes €${balance.net_balance.toFixed(2)}`}
        </div>
        <div className="text-sm text-gray-600">
          {balance.net_balance_description}
        </div>
      </div>

      {/* Helpful Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Based on shared expenses only. Individual expenses are not included in the balance.
      </div>
    </div>
  )
}
