'use client'

import { useState, useEffect } from 'react'
import { ShoppingItem, PersonalRecipe } from '@/types/database'
import { ErrorBoundary, ErrorFallback } from '@/components/ErrorBoundary'
import { ShoppingListService } from '@/services/ShoppingListService'
import { RecipeService } from '@/services/RecipeService'

function ShoppingPageContent() {
  const [activeTab, setActiveTab] = useState<'shopping' | 'recipes'>('shopping')
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [recipes, setRecipes] = useState<PersonalRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [showNewRecipeForm, setShowNewRecipeForm] = useState(false)
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    category: '',
    servings: '',
    prep_time: '',
    cook_time: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors

      // Get shopping items from the default list
      const [shoppingItems, recipes] = await Promise.all([
        ShoppingListService.getItems(),
        RecipeService.getAll()
      ])

      setShoppingItems(shoppingItems || [])
      setRecipes(recipes || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.trim()) return

    try {
      // Get the default list first
      const defaultList = await ShoppingListService.getDefaultList()

      await ShoppingListService.addItem({
        name: newItem.trim(),
        quantity: 1,
        is_completed: false,
        shopping_list_id: defaultList.id
      })

      setNewItem('')
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item')
    }
  }

  const handleToggleItem = async (item: ShoppingItem) => {
    try {
      await ShoppingListService.updateItem(item.id, {
        is_completed: !item.is_completed,
        completed_at: !item.is_completed ? new Date().toISOString() : undefined
      })
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await ShoppingListService.deleteItem(itemId)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  const handleCreateRecipe = async () => {
    try {
      await RecipeService.create({
        ...newRecipe,
        servings: newRecipe.servings ? parseInt(newRecipe.servings) : undefined,
        prep_time: newRecipe.prep_time ? parseInt(newRecipe.prep_time) : undefined,
        cook_time: newRecipe.cook_time ? parseInt(newRecipe.cook_time) : undefined,
        difficulty: 'medium',
        is_favorite: false
      })

      setNewRecipe({
        title: '',
        ingredients: '',
        instructions: '',
        category: '',
        servings: '',
        prep_time: '',
        cook_time: '',
        notes: ''
      })
      setShowNewRecipeForm(false)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recipe')
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return

    try {
      await RecipeService.delete(recipeId)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">🛒 Food & Recipes</h1>
        <p className="mt-2 text-muted-foreground">Simple shopping list and recipe collection</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('shopping')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'shopping'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Shopping List
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'recipes'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Recipes
        </button>
      </div>

      {error && (
        <div className="text-destructive p-4 bg-destructive/10 rounded-lg mb-6">
          Error: {error}
        </div>
      )}

      {/* Shopping List Tab */}
      {activeTab === 'shopping' && (
        <div className="space-y-6">
          {/* Add Item Form */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Add food item..."
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItem.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {/* Shopping Items List */}
          <div className="space-y-2">
            {shoppingItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items yet. Add your first food item!
              </div>
            ) : (
              shoppingItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    item.is_completed
                      ? 'bg-muted/50 border-muted'
                      : 'bg-background border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => handleToggleItem(item)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span
                      className={`text-foreground ${
                        item.is_completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.name}
                      {item.quantity > 1 && (
                        <span className="ml-2 text-sm text-muted-foreground">({item.quantity})</span>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {/* Add Recipe Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewRecipeForm(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80"
            >
              Add Recipe
            </button>
          </div>

          {/* New Recipe Form */}
          {showNewRecipeForm && (
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Add New Recipe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={newRecipe.title}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Recipe title..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <input
                    type="text"
                    value={newRecipe.category}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., dessert, main, appetizer..."
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Servings</label>
                  <input
                    type="number"
                    value={newRecipe.servings}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, servings: e.target.value }))}
                    placeholder="8"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    value={newRecipe.prep_time}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, prep_time: e.target.value }))}
                    placeholder="30"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Cook Time (min)</label>
                  <input
                    type="number"
                    value={newRecipe.cook_time}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, cook_time: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Ingredients</label>
                  <textarea
                    value={newRecipe.ingredients}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, ingredients: e.target.value }))}
                    placeholder="3 egg whites&#10;6 egg yolks&#10;3 + 3 tbsp sugar&#10;8 oz mascarpone cheese..."
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Instructions</label>
                  <textarea
                    value={newRecipe.instructions}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="1. Separate eggs and beat egg whites...&#10;2. In separate bowl, beat egg yolks..."
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                  <textarea
                    value={newRecipe.notes}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Best made a day ahead..."
                    rows={2}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowNewRecipeForm(false)}
                  className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRecipe}
                  disabled={!newRecipe.title.trim() || !newRecipe.ingredients.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/80 disabled:opacity-50"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          )}

          {/* Recipe Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recipes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No recipes yet. Add your first recipe!
              </div>
            ) : (
              recipes.map((recipe) => (
                <div key={recipe.id} className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{recipe.title}</h3>
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  {recipe.description && (
                    <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
                    {recipe.category && (
                      <span className="bg-muted px-2 py-1 rounded">{recipe.category}</span>
                    )}
                    {recipe.servings && (
                      <span className="bg-muted px-2 py-1 rounded">{recipe.servings} servings</span>
                    )}
                    {recipe.prep_time && (
                      <span className="bg-muted px-2 py-1 rounded">{recipe.prep_time}min prep</span>
                    )}
                    {recipe.cook_time && recipe.cook_time > 0 && (
                      <span className="bg-muted px-2 py-1 rounded">{recipe.cook_time}min cook</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Ingredients:</h4>
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                        {recipe.ingredients}
                      </pre>
                    </div>

                    {recipe.instructions && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Instructions:</h4>
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                          {recipe.instructions}
                        </pre>
                      </div>
                    )}

                    {recipe.notes && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Notes:</h4>
                        <p className="text-sm text-muted-foreground">{recipe.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ShoppingPage() {
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <ShoppingPageContent />
    </ErrorBoundary>
  )
}