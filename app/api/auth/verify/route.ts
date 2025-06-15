import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token || !token.startsWith("mock-jwt-")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Extract user ID from mock token
    const userId = token.split("-")[2]

    // Mock user data - in real app, fetch from database
    const mockUser = {
      id: userId,
      name: userId === "1" ? "Admin User" : "John Developer",
      email: userId === "1" ? "admin@demo.com" : "user@demo.com",
      role: userId === "1" ? "admin" : "user",
    }

    return NextResponse.json({ user: mockUser })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
