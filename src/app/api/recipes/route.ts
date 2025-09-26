import { NextRequest, NextResponse } from 'next/server'
import { RecipeService } from '@/services/RecipeService'
import { CreatePersonalRecipeInput } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty') as any
    const is_favorite = searchParams.get('is_favorite')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const search = searchParams.get('search')

    let recipes

    if (search) {
      recipes = await RecipeService.search(search)
    } else {
      const options = {
        category: category || undefined,
        difficulty: difficulty || undefined,
        is_favorite: is_favorite ? is_favorite === 'true' : undefined,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      }

      recipes = await RecipeService.getAll(options)
    }

    const totalCount = await RecipeService.getCount({
      category: category || undefined,
      difficulty: difficulty || undefined,
      is_favorite: is_favorite ? is_favorite === 'true' : undefined
    })

    return NextResponse.json({
      recipes,
      totalCount,
      pagination: {
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
        hasMore: recipes.length === (limit ? parseInt(limit) : 50)
      }
    })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const recipeData: CreatePersonalRecipeInput = {
      title: body.title,
      description: body.description,
      ingredients: body.ingredients,
      instructions: body.instructions,
      servings: body.servings,
      prep_time: body.prep_time,
      cook_time: body.cook_time,
      category: body.category,
      difficulty: body.difficulty || 'medium',
      rating: body.rating,
      notes: body.notes,
      tags: body.tags,
      is_favorite: body.is_favorite || false
    }

    const recipe = await RecipeService.create(recipeData)
    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    )
  }
}