import { PersonalRecipe } from '@/types/database'
import { SpreadsheetItem, StatusColor } from '@/types/unified'

/**
 * Map difficulty to status color
 */
function difficultyToColor(difficulty: PersonalRecipe['difficulty']): StatusColor {
  const colorMap: Record<PersonalRecipe['difficulty'], StatusColor> = {
    easy: 'green',
    medium: 'yellow',
    hard: 'red',
  }
  return colorMap[difficulty]
}

/**
 * Format difficulty label
 */
function formatDifficultyLabel(difficulty: PersonalRecipe['difficulty']): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

/**
 * Format recipe activity text
 */
function formatRecipeActivity(recipe: PersonalRecipe): string {
  const parts: string[] = []

  if (recipe.prep_time) {
    parts.push(`Prep: ${recipe.prep_time}min`)
  }
  if (recipe.cook_time) {
    parts.push(`Cook: ${recipe.cook_time}min`)
  }
  if (recipe.servings) {
    parts.push(`Serves ${recipe.servings}`)
  }

  return parts.length > 0 ? parts.join(' • ') : 'No time info'
}

/**
 * Transform PersonalRecipe to SpreadsheetItem
 */
export function recipeToSpreadsheetItem(recipe: PersonalRecipe): SpreadsheetItem {
  return {
    id: `recipe-${recipe.id}`,
    name: recipe.title,
    type: 'reminder', // Using reminder type for now, could add 'recipe' type
    isFavorite: recipe.is_favorite,
    status: {
      label: formatDifficultyLabel(recipe.difficulty),
      color: difficultyToColor(recipe.difficulty),
    },
    activity: formatRecipeActivity(recipe),
    metadata: recipe,
  }
}

/**
 * Transform recipes to spreadsheet items
 */
export function recipesToSpreadsheetItems(recipes: PersonalRecipe[]): SpreadsheetItem[] {
  return recipes.map(recipeToSpreadsheetItem)
}
