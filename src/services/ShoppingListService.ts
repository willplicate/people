import { supabase, TABLES } from '@/lib/supabase'
import { ShoppingList, ShoppingItem, CreateShoppingListInput, UpdateShoppingListInput, CreateShoppingItemInput, UpdateShoppingItemInput } from '@/types/database'

export class ShoppingListService {
  /**
   * Get all shopping lists
   */
  static async getAll(options?: {
    status?: ShoppingList['status']
    limit?: number
    offset?: number
  }): Promise<ShoppingList[]> {
    let query = supabase
      .from(TABLES.SHOPPING_LISTS)
      .select('*')
      .order('created_at', { ascending: false })

    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get shopping lists: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get shopping list by ID
   */
  static async getById(id: string): Promise<ShoppingList | null> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_LISTS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get shopping list: ${error.message}`)
    }

    return data
  }

  /**
   * Get shopping list with items
   */
  static async getWithItems(id: string): Promise<(ShoppingList & { items: ShoppingItem[] }) | null> {
    const [list, items] = await Promise.all([
      this.getById(id),
      ShoppingItemService.getByListId(id)
    ])

    if (!list) return null

    return {
      ...list,
      items
    }
  }

  /**
   * Create a new shopping list
   */
  static async create(listData: CreateShoppingListInput): Promise<ShoppingList> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_LISTS)
      .insert(listData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create shopping list: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing shopping list
   */
  static async update(id: string, updates: UpdateShoppingListInput): Promise<ShoppingList> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_LISTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update shopping list: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a shopping list (and all its items)
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.SHOPPING_LISTS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete shopping list: ${error.message}`)
    }
  }

  /**
   * Mark shopping list as completed
   */
  static async markCompleted(id: string): Promise<ShoppingList> {
    return this.update(id, { status: 'completed' })
  }

  /**
   * Mark shopping list as active
   */
  static async markActive(id: string): Promise<ShoppingList> {
    return this.update(id, { status: 'active' })
  }

  /**
   * Archive shopping list
   */
  static async archive(id: string): Promise<ShoppingList> {
    return this.update(id, { status: 'archived' })
  }

  /**
   * Get shopping list statistics
   */
  static async getStats(): Promise<{
    total: number
    active: number
    completed: number
    archived: number
  }> {
    const lists = await this.getAll()

    return {
      total: lists.length,
      active: lists.filter(l => l.status === 'active').length,
      completed: lists.filter(l => l.status === 'completed').length,
      archived: lists.filter(l => l.status === 'archived').length
    }
  }

  /**
   * Get count of shopping lists
   */
  static async getCount(filters?: {
    status?: ShoppingList['status']
  }): Promise<number> {
    let query = supabase
      .from(TABLES.SHOPPING_LISTS)
      .select('*', { count: 'exact', head: true })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get shopping list count: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Get default shopping list (creates one if it doesn't exist)
   */
  static async getDefaultList(): Promise<ShoppingList> {
    // Try to find an existing active list named "Shopping List"
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_LISTS)
      .select('*')
      .eq('name', 'Shopping List')
      .eq('status', 'active')
      .limit(1)
      .single()

    if (data) {
      return data
    }

    // If no default list exists, create one
    if (error?.code === 'PGRST116') {
      return this.create({
        name: 'Shopping List',
        description: 'Default shopping list for food items',
        status: 'active'
      })
    }

    throw new Error(`Failed to get default shopping list: ${error?.message}`)
  }

  /**
   * Get items for the default shopping list
   */
  static async getItems(listId?: string): Promise<ShoppingItem[]> {
    if (!listId) {
      const defaultList = await this.getDefaultList()
      listId = defaultList.id
    }
    return ShoppingItemService.getByListId(listId)
  }

  /**
   * Add item to the default shopping list
   */
  static async addItem(itemData: CreateShoppingItemInput): Promise<ShoppingItem> {
    return ShoppingItemService.create(itemData)
  }

  /**
   * Update shopping item
   */
  static async updateItem(id: string, updates: UpdateShoppingItemInput): Promise<ShoppingItem> {
    return ShoppingItemService.update(id, updates)
  }

  /**
   * Delete shopping item
   */
  static async deleteItem(id: string): Promise<void> {
    return ShoppingItemService.delete(id)
  }
}

export class ShoppingItemService {
  /**
   * Get all items for a shopping list
   */
  static async getByListId(listId: string, options?: {
    completed?: boolean
    priority?: ShoppingItem['priority']
    category?: string
  }): Promise<ShoppingItem[]> {
    let query = supabase
      .from(TABLES.SHOPPING_ITEMS)
      .select('*')
      .eq('shopping_list_id', listId)
      .order('created_at', { ascending: false })

    if (options?.completed !== undefined) {
      query = query.eq('is_completed', options.completed)
    }

    if (options?.priority) {
      query = query.eq('priority', options.priority)
    }

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get shopping items: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get shopping item by ID
   */
  static async getById(id: string): Promise<ShoppingItem | null> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_ITEMS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get shopping item: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new shopping item
   */
  static async create(itemData: CreateShoppingItemInput): Promise<ShoppingItem> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_ITEMS)
      .insert(itemData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create shopping item: ${error.message}`)
    }

    return data
  }

  /**
   * Create multiple shopping items
   */
  static async createMultiple(itemsData: CreateShoppingItemInput[]): Promise<ShoppingItem[]> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_ITEMS)
      .insert(itemsData)
      .select()

    if (error) {
      throw new Error(`Failed to create shopping items: ${error.message}`)
    }

    return data || []
  }

  /**
   * Update an existing shopping item
   */
  static async update(id: string, updates: UpdateShoppingItemInput): Promise<ShoppingItem> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_ITEMS)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update shopping item: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a shopping item
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.SHOPPING_ITEMS)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete shopping item: ${error.message}`)
    }
  }

  /**
   * Mark item as completed
   */
  static async markCompleted(id: string): Promise<ShoppingItem> {
    return this.update(id, {
      is_completed: true,
      completed_at: new Date().toISOString()
    })
  }

  /**
   * Mark item as not completed
   */
  static async markNotCompleted(id: string): Promise<ShoppingItem> {
    return this.update(id, {
      is_completed: false,
      completed_at: undefined
    })
  }

  /**
   * Get all unique categories from items
   */
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_ITEMS)
      .select('category')
      .not('category', 'is', null)

    if (error) {
      throw new Error(`Failed to get categories: ${error.message}`)
    }

    const categories = [...new Set((data || []).map(item => item.category).filter(Boolean))]
    return categories.sort()
  }

  /**
   * Get shopping item statistics for a list
   */
  static async getStatsForList(listId: string): Promise<{
    total: number
    completed: number
    pending: number
    totalEstimatedPrice: number
    totalActualPrice: number
  }> {
    const items = await this.getByListId(listId)

    const totalEstimatedPrice = items.reduce((sum, item) =>
      sum + (item.estimated_price || 0) * item.quantity, 0)

    const totalActualPrice = items.reduce((sum, item) =>
      sum + (item.actual_price || 0) * item.quantity, 0)

    return {
      total: items.length,
      completed: items.filter(item => item.is_completed).length,
      pending: items.filter(item => !item.is_completed).length,
      totalEstimatedPrice,
      totalActualPrice
    }
  }

  /**
   * Search items by name or description
   */
  static async search(listId: string, query: string): Promise<ShoppingItem[]> {
    const { data, error } = await supabase
      .from(TABLES.SHOPPING_ITEMS)
      .select('*')
      .eq('shopping_list_id', listId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to search shopping items: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get count of items for a list
   */
  static async getCount(listId: string, filters?: {
    completed?: boolean
    priority?: ShoppingItem['priority']
  }): Promise<number> {
    let query = supabase
      .from(TABLES.SHOPPING_ITEMS)
      .select('*', { count: 'exact', head: true })
      .eq('shopping_list_id', listId)

    if (filters?.completed !== undefined) {
      query = query.eq('is_completed', filters.completed)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get shopping item count: ${error.message}`)
    }

    return count || 0
  }
}