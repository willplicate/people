import { supabase } from '@/lib/supabase'
import { TurtleTrade, CreateTurtleTradeInput, UpdateTurtleTradeInput } from '@/types/database'

export class TurtleTradeService {
  /**
   * Get all trades for a position
   */
  static async getByPositionId(positionId: string): Promise<TurtleTrade[]> {
    const { data, error } = await supabase
      .from('turtle_trades')
      .select('*')
      .eq('position_id', positionId)
      .order('trade_date', { ascending: false })

    if (error) {
      console.error('Error fetching turtle trades:', error)
      throw error
    }

    return data || []
  }

  /**
   * Create a new trade
   */
  static async create(input: CreateTurtleTradeInput): Promise<TurtleTrade> {
    const { data, error } = await supabase
      .from('turtle_trades')
      .insert(input)
      .select()
      .single()

    if (error) {
      console.error('Error creating turtle trade:', error)
      throw error
    }

    return data
  }

  /**
   * Sell a call option
   */
  static async sellCall(positionId: string, trade: {
    strike: number
    premium: number
    expiry: string
    notes?: string
  }): Promise<TurtleTrade> {
    return this.create({
      position_id: positionId,
      trade_date: new Date().toISOString().split('T')[0], // Today's date
      action: 'sell',
      strike: trade.strike,
      premium: trade.premium,
      expiry: trade.expiry,
      notes: trade.notes || `Sold ${trade.strike} call for $${trade.premium}`
    })
  }

  /**
   * Roll a call to a future date
   */
  static async rollCall(positionId: string, trade: {
    strike: number
    premium: number
    expiry: string
    notes?: string
  }): Promise<TurtleTrade> {
    return this.create({
      position_id: positionId,
      trade_date: new Date().toISOString().split('T')[0],
      action: 'roll_call',
      strike: trade.strike,
      premium: trade.premium,
      expiry: trade.expiry,
      notes: trade.notes || `Rolled call to ${trade.expiry} at ${trade.strike} strike for $${trade.premium}`
    })
  }

  /**
   * Buy to close a call option
   */
  static async buyToClose(positionId: string, trade: {
    strike: number
    premium: number
    notes?: string
  }): Promise<TurtleTrade> {
    return this.create({
      position_id: positionId,
      trade_date: new Date().toISOString().split('T')[0],
      action: 'buy_to_close',
      strike: trade.strike,
      premium: trade.premium,
      notes: trade.notes || `Bought to close ${trade.strike} call for $${trade.premium}`
    })
  }

  /**
   * Update an existing trade
   */
  static async updateTrade(id: string, updates: UpdateTurtleTradeInput): Promise<TurtleTrade> {
    const { data, error } = await supabase
      .from('turtle_trades')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating turtle trade:', error)
      throw error
    }

    return data
  }

  /**
   * Delete a trade
   */
  static async deleteTrade(id: string): Promise<void> {
    const { error } = await supabase
      .from('turtle_trades')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting turtle trade:', error)
      throw error
    }
  }

  /**
   * Get all trades with position info
   */
  static async getAllWithPositions(): Promise<(TurtleTrade & { position: any })[]> {
    const { data, error } = await supabase
      .from('turtle_trades')
      .select(`
        *,
        position:turtle_positions(*)
      `)
      .order('trade_date', { ascending: false })

    if (error) {
      console.error('Error fetching turtle trades with positions:', error)
      throw error
    }

    return data || []
  }
}