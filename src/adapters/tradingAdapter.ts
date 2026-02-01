import { OptionsTrade } from '@/types/database'
import { SpreadsheetItem, StatusColor } from '@/types/unified'
import { differenceInDays, parseISO, format } from 'date-fns'

/**
 * Determine status color based on trade status and days to expiration
 */
function tradeStatusColor(trade: OptionsTrade): StatusColor {
  if (trade.status === 'CLOSED') return 'green'
  if (trade.status === 'EXPIRED') {
    return (trade.realized_pl || 0) >= 0 ? 'green' : 'red'
  }
  if (trade.status === 'ASSIGNED') return 'purple'

  // For OPEN trades, color based on days to expiration
  const daysToExp = differenceInDays(parseISO(trade.expiration_date), new Date())
  if (daysToExp < 0) return 'red'      // Expired but not marked
  if (daysToExp <= 7) return 'orange'  // Expiring soon
  if (daysToExp <= 30) return 'yellow' // This month
  return 'blue'                         // Normal
}

/**
 * Format trade status label
 */
function formatTradeStatus(trade: OptionsTrade): string {
  if (trade.status === 'CLOSED') return 'Closed'
  if (trade.status === 'EXPIRED') return 'Expired'
  if (trade.status === 'ASSIGNED') return 'Assigned'

  // For OPEN trades, show days to expiration
  const daysToExp = differenceInDays(parseISO(trade.expiration_date), new Date())
  if (daysToExp < 0) return 'Expired!'
  if (daysToExp === 0) return 'Expires Today'
  if (daysToExp === 1) return 'Expires Tomorrow'
  if (daysToExp <= 7) return `${daysToExp}d to exp`
  return `${daysToExp} days to exp`
}

/**
 * Format trade activity text
 */
function formatTradeActivity(trade: OptionsTrade): string {
  // If closed or expired, show P&L
  if ((trade.status === 'CLOSED' || trade.status === 'EXPIRED') && trade.realized_pl !== null) {
    const plSign = (trade.realized_pl || 0) >= 0 ? '+' : ''
    return `P&L: ${plSign}$${(trade.realized_pl || 0).toFixed(2)}`
  }

  // For open trades, show premium collected
  const totalPremium = trade.premium_per_contract * trade.number_of_contracts
  const premiumSign = trade.action === 'SELL' ? '+' : '-'
  return `Premium: ${premiumSign}$${Math.abs(totalPremium).toFixed(2)}`
}

/**
 * Format trade name for display
 */
function formatTradeName(trade: OptionsTrade): string {
  const optionType = trade.option_type === 'CALL' ? 'C' : 'P'
  const action = trade.action === 'BUY' ? 'B' : 'S'

  // If part of a strategy group, show strategy name
  if (trade.strategy_name) {
    const strategyShort = trade.strategy_name
      .replace('PUT_CONDOR', 'Put Condor')
      .replace('CALL_CONDOR', 'Call Condor')
      .replace('IRON_CONDOR', 'Iron Condor')
      .replace('PUT_VERTICAL', 'Put Spread')
      .replace('CALL_VERTICAL', 'Call Spread')
      .replace('STRADDLE', 'Straddle')
      .replace('STRANGLE', 'Strangle')

    return `${trade.ticker_symbol} ${strategyShort} ${format(parseISO(trade.expiration_date), 'MMM d')}`
  }

  // Single leg trade
  return `${trade.ticker_symbol} $${trade.strike_price} ${optionType} ${action}`
}

/**
 * Transform OptionsTrade to SpreadsheetItem
 */
export function tradeToSpreadsheetItem(trade: OptionsTrade): SpreadsheetItem {
  return {
    id: trade.id,
    name: formatTradeName(trade),
    type: 'reminder', // Using 'reminder' type temporarily (could add 'trade' type later)
    isFavorite: trade.status === 'OPEN', // Highlight open positions
    status: {
      label: formatTradeStatus(trade),
      color: tradeStatusColor(trade),
    },
    activity: formatTradeActivity(trade),
    dueDate: parseISO(trade.expiration_date),
    metadata: trade,
  }
}

/**
 * Filter and transform trades to spreadsheet items
 * @param trades - All trades
 * @param statusFilter - Optional filter by status (default: 'OPEN' only)
 */
export function tradesToSpreadsheetItems(
  trades: OptionsTrade[],
  statusFilter: 'OPEN' | 'ALL' = 'OPEN'
): SpreadsheetItem[] {
  let filteredTrades = trades

  if (statusFilter === 'OPEN') {
    filteredTrades = trades.filter(t => t.status === 'OPEN')
  }

  return filteredTrades.map(tradeToSpreadsheetItem)
}

/**
 * Group trades by strategy_group_id and transform to SpreadsheetItems
 * Shows one item per strategy group instead of individual legs
 */
export function groupedTradesToSpreadsheetItems(trades: OptionsTrade[]): SpreadsheetItem[] {
  // Separate single-leg trades from multi-leg strategies
  const singleLegTrades = trades.filter(t => !t.strategy_group_id)
  const multiLegTrades = trades.filter(t => t.strategy_group_id)

  // Group multi-leg trades by strategy_group_id
  const groupedByStrategy = multiLegTrades.reduce((acc, trade) => {
    const groupId = trade.strategy_group_id!
    if (!acc[groupId]) {
      acc[groupId] = []
    }
    acc[groupId].push(trade)
    return acc
  }, {} as Record<string, OptionsTrade[]>)

  // Convert single-leg trades
  const singleLegItems = singleLegTrades.map(tradeToSpreadsheetItem)

  // Convert multi-leg groups (use first leg as representative)
  const multiLegItems = Object.values(groupedByStrategy).map(legs => {
    const representativeLeg = legs[0]
    const totalPL = legs.reduce((sum, leg) => sum + (leg.realized_pl || 0), 0)

    // Calculate total premium for the strategy
    const totalPremium = legs.reduce((sum, leg) => {
      const legPremium = leg.premium_per_contract * leg.number_of_contracts
      return sum + (leg.action === 'SELL' ? legPremium : -legPremium)
    }, 0)

    return {
      id: representativeLeg.strategy_group_id!,
      name: formatTradeName(representativeLeg),
      type: 'reminder' as const,
      isFavorite: representativeLeg.status === 'OPEN',
      status: {
        label: formatTradeStatus(representativeLeg),
        color: tradeStatusColor(representativeLeg),
      },
      activity: representativeLeg.status === 'OPEN'
        ? `Net Credit: $${totalPremium.toFixed(2)}`
        : `P&L: ${totalPL >= 0 ? '+' : ''}$${totalPL.toFixed(2)}`,
      dueDate: parseISO(representativeLeg.expiration_date),
      metadata: {
        ...representativeLeg,
        legs: legs, // Include all legs in metadata
      },
    }
  })

  return [...multiLegItems, ...singleLegItems]
}
