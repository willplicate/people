import { supabase, TABLES } from '@/lib/supabase'
import {
  Expense,
  ExpenseCategory,
  BudgetMonth,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilters,
  ExpenseWithDetails,
  CategoryTotal,
  MonthlyBalance,
  CreateBudgetMonthInput,
  SplitType
} from '@/types/database'

export class ExpenseService {
  // ============================================================================
  // EXPENSE CATEGORIES
  // ============================================================================

  /**
   * Get all expense categories
   */
  static async getAllCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from(TABLES.EXPENSE_CATEGORIES)
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      throw new Error(`Failed to get expense categories: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string): Promise<ExpenseCategory | null> {
    const { data, error } = await supabase
      .from(TABLES.EXPENSE_CATEGORIES)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get category: ${error.message}`)
    }

    return data
  }

  // ============================================================================
  // BUDGET MONTHS
  // ============================================================================

  /**
   * Get or create the current month's budget period
   */
  static async getOrCreateCurrentMonth(): Promise<BudgetMonth> {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // JavaScript months are 0-indexed

    return this.getOrCreateMonth(year, month)
  }

  /**
   * Get or create a specific month's budget period
   */
  static async getOrCreateMonth(year: number, month: number): Promise<BudgetMonth> {
    // Try to get existing month
    const { data: existing, error: fetchError } = await supabase
      .from(TABLES.BUDGET_MONTHS)
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single()

    if (!fetchError && existing) {
      return existing
    }

    // Create new month if it doesn't exist
    const monthData: CreateBudgetMonthInput = {
      year,
      month,
      is_finalized: false
    }

    const { data, error } = await supabase
      .from(TABLES.BUDGET_MONTHS)
      .insert(monthData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create budget month: ${error.message}`)
    }

    return data
  }

  /**
   * Get budget month by ID
   */
  static async getMonthById(id: string): Promise<BudgetMonth | null> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_MONTHS)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get budget month: ${error.message}`)
    }

    return data
  }

  /**
   * Get all budget months, ordered by year and month descending
   */
  static async getAllMonths(): Promise<BudgetMonth[]> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_MONTHS)
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) {
      throw new Error(`Failed to get budget months: ${error.message}`)
    }

    return data || []
  }

  /**
   * Finalize a budget month (locks it from further edits)
   */
  static async finalizeMonth(monthId: string, userId: string): Promise<BudgetMonth> {
    const { data, error } = await supabase
      .from(TABLES.BUDGET_MONTHS)
      .update({
        is_finalized: true,
        finalized_at: new Date().toISOString(),
        finalized_by: userId
      })
      .eq('id', monthId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to finalize month: ${error.message}`)
    }

    return data
  }

  // ============================================================================
  // EXPENSES
  // ============================================================================

  /**
   * Get all expenses with optional filtering
   */
  static async getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
    let query = supabase
      .from(TABLES.EXPENSES)
      .select('*')
      .order('expense_date', { ascending: false })

    if (filters?.month_id) {
      query = query.eq('month_id', filters.month_id)
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.paid_by_user_id) {
      query = query.eq('paid_by_user_id', filters.paid_by_user_id)
    }

    if (filters?.split_type) {
      query = query.eq('split_type', filters.split_type)
    }

    if (filters?.date_from) {
      query = query.gte('expense_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('expense_date', filters.date_to)
    }

    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get expenses: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get expenses with full details (joined with categories and user emails)
   */
  static async getExpensesWithDetails(filters?: ExpenseFilters): Promise<ExpenseWithDetails[]> {
    const expenses = await this.getExpenses(filters)
    const categories = await this.getAllCategories()

    // Create a map of categories for quick lookup
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]))

    // Enhance expenses with category details
    // Note: User emails would require joining with auth.users, which may need special permissions
    return expenses.map(expense => ({
      ...expense,
      category: categoryMap.get(expense.category_id)!
    }))
  }

  /**
   * Get expense by ID
   */
  static async getExpenseById(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from(TABLES.EXPENSES)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get expense: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new expense
   */
  static async createExpense(
    expenseData: CreateExpenseInput,
    userId: string
  ): Promise<Expense> {
    const { data, error } = await supabase
      .from(TABLES.EXPENSES)
      .insert({
        ...expenseData,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create expense: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing expense
   */
  static async updateExpense(id: string, updates: UpdateExpenseInput): Promise<Expense> {
    const { data, error } = await supabase
      .from(TABLES.EXPENSES)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update expense: ${error.message}`)
    }

    return data
  }

  /**
   * Delete an expense
   */
  static async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.EXPENSES)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete expense: ${error.message}`)
    }
  }

  // ============================================================================
  // ANALYTICS & CALCULATIONS
  // ============================================================================

  /**
   * Get category totals for a specific month
   */
  static async getCategoryTotals(
    monthId: string,
    filters?: { split_type?: SplitType }
  ): Promise<CategoryTotal[]> {
    // Get all expenses for the month
    let expenseFilters: ExpenseFilters = { month_id: monthId }
    if (filters?.split_type) {
      expenseFilters.split_type = filters.split_type
    }

    const expenses = await this.getExpensesWithDetails(expenseFilters)

    // Group by category
    const categoryMap = new Map<string, CategoryTotal>()

    for (const expense of expenses) {
      const categoryId = expense.category_id

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          category_name: expense.category.name,
          category_color: expense.category.color,
          category_icon: expense.category.icon,
          total_amount: 0,
          expense_count: 0,
          paid_by_current_user: 0,
          paid_by_partner: 0,
          shared_amount: 0
        })
      }

      const total = categoryMap.get(categoryId)!
      total.total_amount += expense.amount
      total.expense_count += 1

      // Track who paid
      // Note: This assumes we know the current user ID
      // In practice, you'd pass the current user ID to this method

      if (expense.split_type === 'shared_50_50' || expense.split_type === 'custom') {
        total.shared_amount += expense.amount
      }
    }

    return Array.from(categoryMap.values())
      .sort((a, b) => b.total_amount - a.total_amount)
  }

  /**
   * Calculate the monthly balance (who owes whom)
   */
  static async calculateMonthlyBalance(
    monthId: string,
    currentUserId: string,
    partnerUserId: string
  ): Promise<MonthlyBalance> {
    const month = await this.getMonthById(monthId)
    if (!month) {
      throw new Error('Budget month not found')
    }

    const expenses = await this.getExpenses({ month_id: monthId })

    let currentUserPaid = 0
    let partnerPaid = 0
    let currentUserOwes = 0 // What current user owes for shared expenses
    let partnerOwes = 0 // What partner owes for shared expenses

    for (const expense of expenses) {
      // Track who paid
      if (expense.paid_by_user_id === currentUserId) {
        currentUserPaid += expense.amount
      } else if (expense.paid_by_user_id === partnerUserId) {
        partnerPaid += expense.amount
      }

      // Calculate what each person owes for shared expenses
      if (expense.split_type === 'shared_50_50') {
        const halfAmount = expense.amount / 2

        if (expense.paid_by_user_id === currentUserId) {
          // Current user paid, so partner owes half
          partnerOwes += halfAmount
        } else if (expense.paid_by_user_id === partnerUserId) {
          // Partner paid, so current user owes half
          currentUserOwes += halfAmount
        }
      } else if (expense.split_type === 'custom' && expense.split_percentage) {
        // Custom split based on percentage
        const currentUserShare = (expense.amount * expense.split_percentage) / 100
        const partnerShare = expense.amount - currentUserShare

        if (expense.paid_by_user_id === currentUserId) {
          // Current user paid, partner owes their share
          partnerOwes += partnerShare
        } else if (expense.paid_by_user_id === partnerUserId) {
          // Partner paid, current user owes their share
          currentUserOwes += currentUserShare
        }
      }
      // For 'individual' expenses, no one owes anyone
    }

    // Net balance: positive means partner owes current user, negative means current user owes partner
    const netBalance = partnerOwes - currentUserOwes

    let netBalanceDescription: string
    if (Math.abs(netBalance) < 0.01) {
      netBalanceDescription = 'Even'
    } else if (netBalance > 0) {
      netBalanceDescription = `Partner owes you $${netBalance.toFixed(2)}`
    } else {
      netBalanceDescription = `You owe partner $${Math.abs(netBalance).toFixed(2)}`
    }

    return {
      month_id: monthId,
      year: month.year,
      month: month.month,
      current_user_paid: currentUserPaid,
      partner_paid: partnerPaid,
      current_user_owes: currentUserOwes,
      partner_owes: partnerOwes,
      net_balance: netBalance,
      net_balance_description: netBalanceDescription
    }
  }

  /**
   * Get total spending for a month
   */
  static async getMonthlyTotal(monthId: string): Promise<number> {
    const expenses = await this.getExpenses({ month_id: monthId })
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  /**
   * Get spending by split type for a month
   */
  static async getSpendingBySplitType(monthId: string): Promise<{
    individual: number
    shared: number
    total: number
  }> {
    const expenses = await this.getExpenses({ month_id: monthId })

    let individual = 0
    let shared = 0

    for (const expense of expenses) {
      if (expense.split_type === 'individual') {
        individual += expense.amount
      } else {
        shared += expense.amount
      }
    }

    return {
      individual,
      shared,
      total: individual + shared
    }
  }
}
