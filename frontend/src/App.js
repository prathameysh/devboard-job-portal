"use client"

import { useState, useEffect } from "react"
import Login from "./screens/Login"
import Register from "./screens/Register"
import JobList from "./screens/JobList"
import JobPost from "./screens/JobPost"
import Dashboard from "./screens/Dashboard"
import Applications from "./screens/Applications"
import JobDetail from "./screens/JobDetail"

function App() {
  const [currentScreen, setCurrentScreen] = useState("login")
  const [user, setUser] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem("auth-token")
    const userData = localStorage.getItem("user-data")

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        // ✅ IMPROVED: Validate user object structure
        if (parsedUser && parsedUser.id && parsedUser.role) {
          setUser(parsedUser)
          setCurrentScreen(parsedUser.role === "admin" ? "dashboard" : "jobs")
        } else {
          // Invalid user data structure
          localStorage.removeItem("auth-token")
          localStorage.removeItem("user-data")
        }
      } catch (error) {
        // JSON parsing failed
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user-data")
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    // ✅ IMPROVED: Validate input parameters
    if (!userData || !token) {
      console.error("Invalid login data provided")
      return
    }

    setUser(userData)
    localStorage.setItem("auth-token", token)
    localStorage.setItem("user-data", JSON.stringify(userData))
    setCurrentScreen(userData.role === "admin" ? "dashboard" : "jobs")
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user-data")
    setCurrentScreen("login")
  }

  const navigateTo = (screen, data = null) => {
    // ✅ IMPROVED: Validate screen parameter
    const validScreens = ["login", "register", "jobs", "job-detail", "dashboard", "post-job", "applications"]
    if (!validScreens.includes(screen)) {
      console.error(`Invalid screen: ${screen}`)
      return
    }

    setCurrentScreen(screen)
    if (data) {
      setSelectedJob(data)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "login":
        return <Login onLogin={handleLogin} onNavigate={navigateTo} />
      case "register":
        return <Register onRegister={handleLogin} onNavigate={navigateTo} />
      case "jobs":
        return <JobList user={user} onLogout={handleLogout} onNavigate={navigateTo} />
      case "job-detail":
        return <JobDetail job={selectedJob} user={user} onNavigate={navigateTo} />
      case "dashboard":
        return <Dashboard user={user} onLogout={handleLogout} onNavigate={navigateTo} />
      case "post-job":
        return <JobPost user={user} onNavigate={navigateTo} />
      case "applications":
        return <Applications user={user} onNavigate={navigateTo} />
      default:
        // ✅ IMPROVED: Handle invalid screen states
        console.error(`Unknown screen: ${currentScreen}`)
        return <Login onLogin={handleLogin} onNavigate={navigateTo} />
    }
  }

  return <div className="App">{renderScreen()}</div>
}

export default App
