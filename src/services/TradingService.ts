import { supabase, TABLES } from '@/lib/supabase'
import {
  TradingSession,
  OptionsTrade,
  TradingChatMessage,
  CreateTradingSessionInput,
  UpdateTradingSessionInput,
  CreateOptionsTradeInput,
  UpdateOptionsTradeInput,
  CreateTradingChatMessageInput,
  TradeStatus
} from '@/types/database'

export class TradingService {
  // ============================================================================
  // TRADING SESSIONS
  // ============================================================================

  /**
   * Create a new trading session
   */
  static async createSession(input: CreateTradingSessionInput): Promise<TradingSession> {
    const { data, error } = await supabase
      .from(TABLES.TRADING_SESSIONS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create trading session: ${error.message}`)
    }

    return data
  }

  /**
   * Get or create today's trading session
   */
  static async getOrCreateTodaySession(userId: string): Promise<TradingSession> {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Try to get existing session for today
    const { data: existing, error: fetchError } = await supabase
      .from(TABLES.TRADING_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', today)
      .single()

    if (!fetchError && existing) {
      return existing
    }

    // Create new session if it doesn't exist
    return this.createSession({
      user_id: userId,
      session_date: today
    })
  }

  /**
   * Get session by ID
   */
  static async getSessionById(id: string): Promise<TradingSession | null> {
    const { data, error } = await supabase
      .from(TABLES.TRADING_SESSIONS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get session: ${error.message}`)
    }

    return data
  }

  /**
   * Get all sessions for a user
   */
  static async getAllSessions(userId: string): Promise<TradingSession[]> {
    const { data, error } = await supabase
      .from(TABLES.TRADING_SESSIONS)
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get sessions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update session notes
   */
  static async updateSession(id: string, updates: UpdateTradingSessionInput): Promise<TradingSession> {
    const { data, error } = await supabase
      .from(TABLES.TRADING_SESSIONS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update session: ${error.message}`)
    }

    return data
  }

  // ============================================================================
  // OPTIONS TRADES
  // ============================================================================

  /**
   * Create a new options trade
   */
  static async createTrade(input: CreateOptionsTradeInput): Promise<OptionsTrade> {
    const { data, error } = await supabase
      .from(TABLES.OPTIONS_TRADES)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create trade: ${error.message}`)
    }

    return data
  }

  /**
   * Get trade by ID
   */
  static async getTradeById(id: string): Promise<OptionsTrade | null> {
    const { data, error } = await supabase
      .from(TABLES.OPTIONS_TRADES)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get trade: ${error.message}`)
    }

    return data
  }

  /**
   * Get all trades for a session
   */
  static async getTradesBySession(sessionId: string): Promise<OptionsTrade[]> {
    const { data, error } = await supabase
      .from(TABLES.OPTIONS_TRADES)
      .select('*')
      .eq('session_id', sessionId)
      .order('trade_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get trades: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all trades for a user
   */
  static async getAllTrades(userId: string): Promise<OptionsTrade[]> {
    const { data, error } = await supabase
      .from(TABLES.OPTIONS_TRADES)
      .select('*')
      .eq('user_id', userId)
      .order('trade_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get trades: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a trade
   */
  static async updateTrade(id: string, updates: UpdateOptionsTradeInput): Promise<OptionsTrade> {
    const { data, error } = await supabase
      .from(TABLES.OPTIONS_TRADES)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update trade: ${error.message}`)
    }

    return data
  }

  /**
   * Close a trade with closing information
   */
  static async closeTrade(
    id: string,
    closingPremium: number,
    closingDate: string
  ): Promise<OptionsTrade> {
    // Get the trade to calculate P&L
    const trade = await this.getTradeById(id)
    if (!trade) {
      throw new Error('Trade not found')
    }

    // Calculate realized P&L
    // For SELL: profit if closing premium < opening premium (bought back cheaper)
    // For BUY: profit if closing premium > opening premium (sold for more)
    const premiumDiff = trade.action === 'SELL'
      ? (trade.premium_per_contract - closingPremium)
      : (closingPremium - trade.premium_per_contract)

    const realizedPL = premiumDiff * trade.number_of_contracts * 100 // Options contracts are 100 shares

    // Update the trade
    return this.updateTrade(id, {
      status: 'CLOSED',
      closing_date: closingDate,
      closing_premium: closingPremium,
      realized_pl: realizedPL
    })
  }

  /**
   * Mark a trade as expired
   */
  static async expireTrade(id: string): Promise<OptionsTrade> {
    // Get the trade to calculate P&L
    const trade = await this.getTradeById(id)
    if (!trade) {
      throw new Error('Trade not found')
    }

    // For expired options:
    // - SELL positions: premium collected is the profit (expired worthless)
    // - BUY positions: premium paid is the loss (expired worthless)
    const realizedPL = trade.action === 'SELL'
      ? trade.premium_per_contract * trade.number_of_contracts * 100
      : -trade.premium_per_contract * trade.number_of_contracts * 100

    return this.updateTrade(id, {
      status: 'EXPIRED',
      closing_date: trade.expiration_date,
      closing_premium: 0,
      realized_pl: realizedPL
    })
  }

  /**
   * Delete a trade
   */
  static async deleteTrade(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.OPTIONS_TRADES)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete trade: ${error.message}`)
    }
  }

  // ============================================================================
  // P&L CALCULATIONS
  // ============================================================================

  /**
   * Calculate total P&L for a session
   */
  static async calculateSessionPL(sessionId: string): Promise<number> {
    const trades = await this.getTradesBySession(sessionId)

    return trades.reduce((total, trade) => {
      return total + (trade.realized_pl || 0)
    }, 0)
  }

  /**
   * Calculate cumulative P&L for a user
   */
  static async calculateTotalPL(userId: string): Promise<number> {
    const trades = await this.getAllTrades(userId)

    return trades.reduce((total, trade) => {
      return total + (trade.realized_pl || 0)
    }, 0)
  }

  /**
   * Get P&L summary statistics
   */
  static async getPLSummary(userId: string) {
    const trades = await this.getAllTrades(userId)

    const closedTrades = trades.filter(t => t.status === 'CLOSED' || t.status === 'EXPIRED')
    const openTrades = trades.filter(t => t.status === 'OPEN')

    const totalPL = closedTrades.reduce((sum, t) => sum + (t.realized_pl || 0), 0)
    const winningTrades = closedTrades.filter(t => (t.realized_pl || 0) > 0)
    const losingTrades = closedTrades.filter(t => (t.realized_pl || 0) < 0)

    const winRate = closedTrades.length > 0
      ? (winningTrades.length / closedTrades.length) * 100
      : 0

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.realized_pl || 0), 0) / winningTrades.length
      : 0

    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + (t.realized_pl || 0), 0) / losingTrades.length
      : 0

    return {
      totalPL,
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      avgWin,
      avgLoss
    }
  }

  // ============================================================================
  // STRATEGY GROUPING
  // ============================================================================

  /**
   * Detect strategy type from a set of legs
   */
  static detectStrategyName(legs: Array<{option_type: string, action: string}>): string {
    if (legs.length === 1) {
      return 'SINGLE_LEG'
    }

    const puts = legs.filter(l => l.option_type === 'PUT')
    const calls = legs.filter(l => l.option_type === 'CALL')

    // All puts = put condor or put spread
    if (puts.length === legs.length) {
      if (legs.length === 4) return 'PUT_CONDOR'
      if (legs.length === 2) return 'PUT_VERTICAL'
      return 'PUT_SPREAD'
    }

    // All calls = call condor or call spread
    if (calls.length === legs.length) {
      if (legs.length === 4) return 'CALL_CONDOR'
      if (legs.length === 2) return 'CALL_VERTICAL'
      return 'CALL_SPREAD'
    }

    // Mix of puts and calls
    if (legs.length === 4) return 'IRON_CONDOR'
    if (legs.length === 2) return 'STRADDLE'

    return 'CUSTOM_STRATEGY'
  }

  /**
   * Get all trades in a strategy group
   */
  static async getTradesByGroup(strategyGroupId: string): Promise<OptionsTrade[]> {
    const { data, error } = await supabase
      .from(TABLES.OPTIONS_TRADES)
      .select('*')
      .eq('strategy_group_id', strategyGroupId)
      .order('strike_price', { ascending: true })

    if (error) {
      throw new Error(`Failed to get trades by group: ${error.message}`)
    }

    return data || []
  }

  /**
   * Expire all trades in a strategy group
   */
  static async expireGroup(strategyGroupId: string): Promise<OptionsTrade[]> {
    const trades = await this.getTradesByGroup(strategyGroupId)
    const expiredTrades = []

    for (const trade of trades) {
      const expired = await this.expireTrade(trade.id)
      expiredTrades.push(expired)
    }

    return expiredTrades
  }

  // ============================================================================
  // CHAT MESSAGES
  // ============================================================================

  /**
   * Save a chat message
   */
  static async saveChatMessage(input: CreateTradingChatMessageInput): Promise<TradingChatMessage> {
    const { data, error } = await supabase
      .from(TABLES.TRADING_CHAT_MESSAGES)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save chat message: ${error.message}`)
    }

    return data
  }

  /**
   * Get chat history for a session
   */
  static async getChatHistory(sessionId: string): Promise<TradingChatMessage[]> {
    const { data, error } = await supabase
      .from(TABLES.TRADING_CHAT_MESSAGES)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to get chat history: ${error.message}`)
    }

    return data || []
  }

  /**
   * Delete all chat messages for a session
   */
  static async clearChatHistory(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TRADING_CHAT_MESSAGES)
      .delete()
      .eq('session_id', sessionId)

    if (error) {
      throw new Error(`Failed to clear chat history: ${error.message}`)
    }
  }
}
