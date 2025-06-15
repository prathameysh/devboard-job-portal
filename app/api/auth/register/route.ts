import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = "user" } = await request.json()

    // In real app, validate input and check if user exists
    // For demo, we'll just create a mock user
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
    }

    // Create mock JWT token
    const token = `mock-jwt-${newUser.id}-${Date.now()}`

    return NextResponse.json({
      token,
      user: newUser,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
