import { type NextRequest, NextResponse } from "next/server"

// Mock user data - in real app, use database
const users = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@demo.com",
    password: "demo123", // In real app, use hashed passwords
    role: "admin",
  },
  {
    id: "2",
    name: "John Developer",
    email: "user@demo.com",
    password: "demo123",
    role: "user",
  },
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Find user
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create mock JWT token (in real app, use proper JWT)
    const token = `mock-jwt-${user.id}-${Date.now()}`

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
