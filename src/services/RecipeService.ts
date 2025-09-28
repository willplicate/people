import { supabase, TABLES } from '@/lib/supabase'
import { PersonalRecipe, CreatePersonalRecipeInput, UpdatePersonalRecipeInput } from '@/types/database'

export class RecipeService {
  /**
   * Get all recipes with optional filtering
   */
  static async getAll(options?: {
    category?: string
    difficulty?: PersonalRecipe['difficulty']
    is_favorite?: boolean
    limit?: number
    offset?: number
  }): Promise<PersonalRecipe[]> {
    let query = supabase
      .from(TABLES.RECIPES)
      .select('*')
      .order('created_at', { ascending: false })

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.difficulty) {
      query = query.eq('difficulty', options.difficulty)
    }

    if (options?.is_favorite !== undefined) {
      query = query.eq('is_favorite', options.is_favorite)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get recipes: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get recipe by ID
   */
  static async getById(id: string): Promise<PersonalRecipe | null> {
    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get recipe: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new recipe
   */
  static async create(recipeData: CreatePersonalRecipeInput): Promise<PersonalRecipe> {
    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .insert(recipeData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create recipe: ${error.message}`)
    }

    return data
  }

  /**
   * Update an existing recipe
   */
  static async update(id: string, updates: UpdatePersonalRecipeInput): Promise<PersonalRecipe> {
    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update recipe: ${error.message}`)
    }

    return data
  }

  /**
   * Delete a recipe
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.RECIPES)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete recipe: ${error.message}`)
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(id: string): Promise<PersonalRecipe> {
    const recipe = await this.getById(id)
    if (!recipe) {
      throw new Error('Recipe not found')
    }

    return this.update(id, {
      is_favorite: !recipe.is_favorite
    })
  }

  /**
   * Get recipes by category
   */
  static async getByCategory(category: string): Promise<PersonalRecipe[]> {
    return this.getAll({ category })
  }

  /**
   * Get favorite recipes
   */
  static async getFavorites(): Promise<PersonalRecipe[]> {
    return this.getAll({ is_favorite: true })
  }

  /**
   * Get all unique categories
   */
  static async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .select('category')
      .not('category', 'is', null)

    if (error) {
      throw new Error(`Failed to get categories: ${error.message}`)
    }

    const categories = [...new Set((data || []).map(item => item.category).filter(Boolean))]
    return categories.sort()
  }

  /**
   * Search recipes by title, ingredients, or instructions
   */
  static async search(query: string): Promise<PersonalRecipe[]> {
    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .select('*')
      .or(`title.ilike.%${query}%,ingredients.ilike.%${query}%,instructions.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to search recipes: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get recipe count
   */
  static async getCount(filters?: {
    category?: string
    difficulty?: PersonalRecipe['difficulty']
    is_favorite?: boolean
  }): Promise<number> {
    let query = supabase
      .from(TABLES.RECIPES)
      .select('*', { count: 'exact', head: true })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }

    if (filters?.is_favorite !== undefined) {
      query = query.eq('is_favorite', filters.is_favorite)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get recipe count: ${error.message}`)
    }

    return count || 0
  }
}