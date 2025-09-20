import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    return NextResponse.json({
      isAuthenticated: !!session?.user,
      hasGoogleAccess: !!session?.accessToken,
      user: session?.user ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image
      } : null
    })

  } catch (error) {
    console.error('Error checking auth status:', error)
    return NextResponse.json(
      { error: 'Failed to check authentication status' },
      { status: 500 }
    )
  }
}