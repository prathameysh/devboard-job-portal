"use client"

import { useState, useEffect } from "react"
import config from "../config"

const SavedJobs = ({ user, onLogout, onNavigate }) => {
  const [savedJobs, setSavedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSavedJobs()
  }, [])

  const fetchSavedJobs = async () => {
    try {
      setError("")
      const token = localStorage.getItem("auth-token")
      if (!token) {
        setError("Authentication required")
        setLoading(false)
        return
      }

      const response = await fetch(`${config.BASE_URL}${config.endpoints.savedJobs}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSavedJobs(data)
      } else {
        throw new Error("Failed to fetch saved jobs")
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error)
      setError("Failed to load saved jobs. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUnsaveJob = async (jobId) => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`${config.BASE_URL}${config.endpoints.saveJob}/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setSavedJobs((prev) => prev.filter((savedJob) => savedJob.jobId._id !== jobId))
      } else {
        throw new Error("Failed to unsave job")
      }
    } catch (error) {
      console.error("Error unsaving job:", error)
      setError("Failed to unsave job. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading saved jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold">DB</span>
              </div>
              <span className="ml-2 text-2xl font-bold text-gray-900">DevBoard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={() => onNavigate("jobs")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Browse Jobs
              </button>
              <button onClick={onLogout} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Saved Jobs</h1>
          <p className="text-gray-600">Jobs you've saved for later review</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError("")} className="text-red-800 hover:text-red-900 font-medium">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {savedJobs.map((savedJob) => (
            <div key={savedJob._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{savedJob.jobId.title}</h3>
                  <p className="text-lg font-medium text-blue-600">{savedJob.jobId.company}</p>
                </div>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">{savedJob.jobId.type}</span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>📍 {savedJob.jobId.location}</span>
                <span>📅 Posted {new Date(savedJob.jobId.postedAt).toLocaleDateString()}</span>
                <span>⭐ Saved {new Date(savedJob.savedAt).toLocaleDateString()}</span>
                {savedJob.jobId.salary && (
                  <span className="text-green-600 font-medium">💰 {savedJob.jobId.salary}</span>
                )}
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">
                {savedJob.jobId.description.length > 150
                  ? `${savedJob.jobId.description.substring(0, 150)}...`
                  : savedJob.jobId.description}
              </p>

              <div className="flex space-x-2">
                <button
                  onClick={() => onNavigate("job-detail", savedJob.jobId)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View Details & Apply
                </button>
                <button
                  onClick={() => handleUnsaveJob(savedJob.jobId._id)}
                  className="border border-red-300 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Remove from Saved
                </button>
              </div>
            </div>
          ))}
        </div>

        {savedJobs.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">⭐</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved jobs yet</h3>
            <p className="text-gray-600 mb-4">Start browsing jobs and save the ones you're interested in!</p>
            <button
              onClick={() => onNavigate("jobs")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Browse Jobs
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default SavedJobs
