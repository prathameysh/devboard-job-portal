"use client"

import { useState, useEffect } from "react"
import config from "../config"

const JobList = ({ user, onLogout, onNavigate }) => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    type: "all",
  })

  const [savedJobs, setSavedJobs] = useState(new Set())
  const [appliedJobs, setAppliedJobs] = useState(new Set())

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, filters])

  useEffect(() => {
    if (user && user.role === "user") {
      fetchSavedJobs()
      fetchApplicationStatus()
    }
  }, [user])

  const fetchJobs = async () => {
    try {
      setError("")
      const response = await fetch(`${config.BASE_URL}${config.endpoints.jobs}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.jobs) {
        setJobs(data.jobs)
      } else {
        setJobs([])
        setError("No jobs data received")
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      setError("Failed to load jobs. Please try again later.")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const filterJobs = () => {
    let filtered = [...jobs]

    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm) ||
          job.company.toLowerCase().includes(searchTerm) ||
          (job.description && job.description.toLowerCase().includes(searchTerm)),
      )
    }

    if (filters.location && filters.location.trim()) {
      const locationTerm = filters.location.toLowerCase().trim()
      filtered = filtered.filter((job) => job.location.toLowerCase().includes(locationTerm))
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((job) => job.type === filters.type)
    }

    setFilteredJobs(filtered)
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const clearFilters = () => {
    setFilters({ search: "", location: "", type: "all" })
  }

  const refreshJobs = () => {
    setLoading(true)
    fetchJobs()
  }

  const fetchSavedJobs = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) return

      const response = await fetch(`${config.BASE_URL}${config.endpoints.savedJobs}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const savedJobIds = new Set(data.map((savedJob) => savedJob.jobId._id))
        setSavedJobs(savedJobIds)
      }
    } catch (error) {
      console.error("Error fetching saved jobs:", error)
    }
  }

  const fetchApplicationStatus = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) return

      const response = await fetch(`${config.BASE_URL}${config.endpoints.applications}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const appliedJobIds = new Set(data.map((app) => app.jobId._id))
        setAppliedJobs(appliedJobIds)
      }
    } catch (error) {
      console.error("Error fetching application status:", error)
    }
  }

  const handleSaveJob = async (jobId, isSaved) => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        setError("Please log in to save jobs")
        return
      }

      const url = `${config.BASE_URL}${config.endpoints.saveJob}${isSaved ? `/${jobId}` : ""}`
      const method = isSaved ? "DELETE" : "POST"
      const body = isSaved ? undefined : JSON.stringify({ jobId })

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(method === "POST" && { "Content-Type": "application/json" }),
        },
        ...(body && { body }),
      })

      if (response.ok) {
        if (isSaved) {
          setSavedJobs((prev) => {
            const newSet = new Set(prev)
            newSet.delete(jobId)
            return newSet
          })
        } else {
          setSavedJobs((prev) => new Set([...prev, jobId]))
        }
      } else {
        const data = await response.json()
        setError(data.error || "Failed to save job")
      }
    } catch (error) {
      console.error("Error saving job:", error)
      setError("Failed to save job. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
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
              {user.role === "user" && (
                <button
                  onClick={() => onNavigate("saved-jobs")}
                  className="border border-blue-600 text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  ⭐ My Saved Jobs ({savedJobs.size})
                </button>
              )}
              {user.role === "admin" && (
                <button
                  onClick={() => onNavigate("dashboard")}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Dashboard
                </button>
              )}
              <button onClick={onLogout} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Next Job</h1>
          <p className="text-gray-600">Discover opportunities that match your skills</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button onClick={refreshJobs} className="text-red-800 hover:text-red-900 font-medium">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs or companies..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div key={job._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-lg font-medium text-blue-600">{job.company}</p>
                </div>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">{job.type}</span>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>📍 {job.location}</span>
                <span>📅 {new Date(job.postedAt).toLocaleDateString()}</span>
                {job.salary && <span className="text-green-600 font-medium">💰 {job.salary}</span>}
              </div>

              <p className="text-gray-700 mb-4 line-clamp-2">
                {job.description.length > 150 ? `${job.description.substring(0, 150)}...` : job.description}
              </p>

              <div className="flex space-x-2">
                <button
                  onClick={() => onNavigate("job-detail", job)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
                {user && user.role === "user" && (
                  <>
                    {appliedJobs.has(job._id) ? (
                      <span className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-sm font-medium">
                        ✓ Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSaveJob(job._id, savedJobs.has(job._id))}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          savedJobs.has(job._id)
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {savedJobs.has(job._id) ? "★ Saved" : "☆ Save Job"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💼</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-4">
              {jobs.length === 0 ? "No jobs are currently available." : "Try adjusting your search criteria"}
            </p>
            {jobs.length === 0 && (
              <button onClick={refreshJobs} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Refresh Jobs
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default JobList
