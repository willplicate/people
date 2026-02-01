import { supabase, TABLES } from '@/lib/supabase'
import {
  TurtlePosition,
  TurtleTrade,
  TurtleMarketData,
  TurtleAssignment,
  CreateTurtlePositionInput,
  UpdateTurtlePositionInput,
  CreateTurtleTradeInput,
  UpdateTurtleTradeInput,
  CreateTurtleMarketDataInput,
  CreateTurtleAssignmentInput
} from '@/types/database'

export class TurtleService {
  // ============================================================================
  // LEAPS POSITIONS
  // ============================================================================

  /**
   * Create a new LEAPS position
   */
  static async createPosition(input: CreateTurtlePositionInput): Promise<TurtlePosition> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_POSITIONS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create position: ${error.message}`)
    }

    return data
  }

  /**
   * Get all active positions
   */
  static async getActivePositions(): Promise<TurtlePosition[]> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_POSITIONS)
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get active positions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get all positions (including closed)
   */
  static async getAllPositions(): Promise<TurtlePosition[]> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_POSITIONS)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get positions: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get position by ID
   */
  static async getPositionById(id: string): Promise<TurtlePosition | null> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_POSITIONS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get position: ${error.message}`)
    }

    return data
  }

  /**
   * Update a position
   */
  static async updatePosition(id: string, updates: UpdateTurtlePositionInput): Promise<TurtlePosition> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_POSITIONS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update position: ${error.message}`)
    }

    return data
  }

  /**
   * Close a position
   */
  static async closePosition(id: string): Promise<TurtlePosition> {
    return this.updatePosition(id, { status: 'closed' })
  }

  /**
   * Mark position as called away
   */
  static async markPositionCalledAway(id: string): Promise<TurtlePosition> {
    return this.updatePosition(id, { status: 'called_away' })
  }

  /**
   * Delete a position
   */
  static async deletePosition(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TURTLE_POSITIONS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete position: ${error.message}`)
    }
  }

  // ============================================================================
  // WEEKLY TRADES (Short Calls)
  // ============================================================================

  /**
   * Create a new trade (sell weekly call, buy to close, etc.)
   */
  static async createTrade(input: CreateTurtleTradeInput): Promise<TurtleTrade> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_TRADES)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create trade: ${error.message}`)
    }

    return data
  }

  /**
   * Get all trades for a position
   */
  static async getTradesByPosition(positionId: string): Promise<TurtleTrade[]> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_TRADES)
      .select('*')
      .eq('position_id', positionId)
      .order('trade_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get trades: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get recent trades (last 30 days)
   */
  static async getRecentTrades(days: number = 30): Promise<TurtleTrade[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from(TABLES.TURTLE_TRADES)
      .select('*')
      .gte('trade_date', cutoffStr)
      .order('trade_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get recent trades: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update a trade
   */
  static async updateTrade(id: string, updates: UpdateTurtleTradeInput): Promise<TurtleTrade> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_TRADES)
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
   * Delete a trade
   */
  static async deleteTrade(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.TURTLE_TRADES)
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
   * Calculate total premium collected for a position
   */
  static async calculatePositionPremiums(positionId: string): Promise<number> {
    const trades = await this.getTradesByPosition(positionId)

    return trades.reduce((total, trade) => {
      // Add premium for sells, subtract for buys
      if (trade.action === 'sell') {
        return total + trade.premium
      } else if (trade.action === 'buy_to_close') {
        return total - trade.premium
      }
      return total
    }, 0)
  }

  /**
   * Calculate position P&L (premiums + LEAPS value change)
   */
  static async calculatePositionPL(positionId: string): Promise<{
    totalPremiums: number
    leapsValueChange: number
    totalPL: number
  }> {
    const position = await this.getPositionById(positionId)
    if (!position) {
      throw new Error('Position not found')
    }

    const totalPremiums = await this.calculatePositionPremiums(positionId)
    const leapsValueChange = (position.current_value || position.leaps_cost_basis) - position.leaps_cost_basis
    const totalPL = totalPremiums + leapsValueChange

    return {
      totalPremiums,
      leapsValueChange,
      totalPL
    }
  }

  /**
   * Calculate total P&L across all positions
   */
  static async calculateTotalPL(): Promise<{
    totalPremiums: number
    totalLeapsValueChange: number
    totalPL: number
  }> {
    const positions = await this.getAllPositions()

    let totalPremiums = 0
    let totalLeapsValueChange = 0

    for (const position of positions) {
      const pl = await this.calculatePositionPL(position.id)
      totalPremiums += pl.totalPremiums
      totalLeapsValueChange += pl.leapsValueChange
    }

    return {
      totalPremiums,
      totalLeapsValueChange,
      totalPL: totalPremiums + totalLeapsValueChange
    }
  }

  // ============================================================================
  // MARKET DATA
  // ============================================================================

  /**
   * Save market data snapshot
   */
  static async saveMarketData(input: CreateTurtleMarketDataInput): Promise<TurtleMarketData> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_MARKET_DATA)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save market data: ${error.message}`)
    }

    return data
  }

  /**
   * Get latest market data for a symbol
   */
  static async getLatestMarketData(symbol: string): Promise<TurtleMarketData | null> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_MARKET_DATA)
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get market data: ${error.message}`)
    }

    return data
  }

  // ============================================================================
  // ASSIGNMENTS
  // ============================================================================

  /**
   * Record an assignment event
   */
  static async createAssignment(input: CreateTurtleAssignmentInput): Promise<TurtleAssignment> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_ASSIGNMENTS)
      .insert(input)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create assignment: ${error.message}`)
    }

    return data
  }

  /**
   * Get assignments for a position
   */
  static async getAssignmentsByPosition(positionId: string): Promise<TurtleAssignment[]> {
    const { data, error } = await supabase
      .from(TABLES.TURTLE_ASSIGNMENTS)
      .select('*')
      .eq('position_id', positionId)
      .order('assignment_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get assignments: ${error.message}`)
    }

    return data || []
  }

  // ============================================================================
  // POSITION HEALTH CHECKS
  // ============================================================================

  /**
   * Get position health status based on delta and DTE
   */
  static getPositionHealth(position: TurtlePosition): {
    status: 'green' | 'yellow' | 'red'
    warnings: string[]
  } {
    const warnings: string[] = []
    let status: 'green' | 'yellow' | 'red' = 'green'

    // Calculate days to expiry
    const expiryDate = new Date(position.leaps_expiry)
    const today = new Date()
    const daysToExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Check delta
    if (position.current_delta && position.current_delta < 0.70) {
      status = 'red'
      warnings.push(`Delta too low (${position.current_delta.toFixed(2)})`)
    } else if (position.current_delta && position.current_delta < 0.75) {
      if (status !== 'red') status = 'yellow'
      warnings.push(`Delta declining (${position.current_delta.toFixed(2)})`)
    }

    // Check DTE
    if (daysToExpiry < 90) {
      status = 'red'
      warnings.push(`Only ${daysToExpiry} days to expiry`)
    } else if (daysToExpiry < 120) {
      if (status !== 'red') status = 'yellow'
      warnings.push(`${daysToExpiry} days to expiry`)
    }

    return { status, warnings }
  }
}
