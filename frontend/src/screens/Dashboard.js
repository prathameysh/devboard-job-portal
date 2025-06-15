"use client"

import { useState, useEffect } from "react"
import config from "../config"

const Dashboard = ({ user, onLogout, onNavigate }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalJobs: 0,
      activeJobs: 0,
      totalApplications: 0,
      pendingApplications: 0,
    },
    charts: {
      applicationsByMonth: [],
      applicationsByStatus: [],
    },
    recentJobs: [],
  })
  const [myJobs, setMyJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user && user.role === "admin") {
      loadAllData()
    }
  }, [user])

  const loadAllData = async () => {
    setLoading(true)
    setError("")

    try {
      await Promise.all([fetchDashboardData(), fetchMyJobs(), fetchApplications()])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setError("Failed to load dashboard data. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`${config.BASE_URL}/dashboard-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Dashboard data received:", data) // Debug log
      setDashboardData(data)
    } catch (error) {
      console.error("Dashboard data fetch error:", error)
      throw error
    }
  }

  const fetchMyJobs = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`${config.BASE_URL}/my-jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("My jobs data received:", data) // Debug log
      setMyJobs(data)
    } catch (error) {
      console.error("My jobs fetch error:", error)
      throw error
    }
  }

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        throw new Error("No authentication token")
      }

      const response = await fetch(`${config.BASE_URL}${config.endpoints.applications}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setApplications(data)
    } catch (error) {
      console.error("Applications fetch error:", error)
      throw error
    }
  }

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`${config.BASE_URL}/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update local state immediately for better UX
        setApplications((prev) => prev.map((app) => (app._id === applicationId ? { ...app, status: newStatus } : app)))
        // Refresh dashboard stats
        fetchDashboardData()
      } else {
        throw new Error("Failed to update application status")
      }
    } catch (error) {
      console.error("Error updating application status:", error)
      setError("Failed to update application status. Please try again.")
    }
  }

  const deleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`${config.BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Remove job from local state
        setMyJobs((prev) => prev.filter((job) => job._id !== jobId))
        setDashboardData((prev) => ({
          ...prev,
          recentJobs: prev.recentJobs.filter((job) => job._id !== jobId),
        }))
        // Refresh dashboard data
        fetchDashboardData()
      } else {
        throw new Error("Failed to delete job")
      }
    } catch (error) {
      console.error("Error deleting job:", error)
      setError("Failed to delete job. Please try again.")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "reviewed":
        return "bg-blue-100 text-blue-800"
      case "shortlisted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const downloadResume = async (resumePath) => {
    try {
      const token = localStorage.getItem("auth-token")
      const filename = resumePath.split("/").pop()

      const response = await fetch(`${config.BASE_URL}${config.endpoints.resume}/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to download resume")
      }
    } catch (error) {
      console.error("Error downloading resume:", error)
      setError(`Failed to download resume: ${error.message}`)
    }
  }

  const viewJob = (job) => {
    // Navigate to job detail with the job data
    onNavigate("job-detail", job)
  }

  const editJob = (job) => {
    // For now, navigate to job detail - you can implement edit later
    onNavigate("job-detail", job)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              <span className="ml-2 text-2xl font-bold text-gray-900">DevBoard Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={() => onNavigate("post-job")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + Post Job
              </button>
              <button
                onClick={onLogout}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your job postings and applications</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalJobs}</p>
              </div>
              <div className="text-blue-600 text-3xl">💼</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{dashboardData.stats.activeJobs} active</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalApplications}</p>
              </div>
              <div className="text-green-600 text-3xl">👥</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{dashboardData.stats.pendingApplications} pending</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeJobs}</p>
              </div>
              <div className="text-purple-600 text-3xl">📈</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Currently hiring</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingApplications}</p>
              </div>
              <div className="text-orange-600 text-3xl">⏳</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Needs attention</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "jobs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Jobs ({myJobs.length})
              </button>
              <button
                onClick={() => setActiveTab("applications")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "applications"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Applications ({applications.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  <button onClick={loadAllData} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Refresh
                  </button>
                </div>
                <div className="space-y-4">
                  {dashboardData.recentJobs.length > 0 ? (
                    dashboardData.recentJobs.slice(0, 5).map((job) => (
                      <div
                        key={job._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <p className="text-sm text-gray-500">
                            {job.applicationCount} applications • Posted {new Date(job.postedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            job.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📋</div>
                      <p className="text-gray-600">No recent activity</p>
                      <button
                        onClick={() => onNavigate("post-job")}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Post your first job
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "jobs" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Your Job Postings</h3>
                  <button
                    onClick={() => onNavigate("post-job")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    + Post New Job
                  </button>
                </div>
                <div className="space-y-4">
                  {myJobs.length > 0 ? (
                    myJobs.map((job) => (
                      <div
                        key={job._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{job.title}</h4>
                          <p className="text-sm text-gray-600">{job.company}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                job.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {job.status}
                            </span>
                            <span className="text-sm text-gray-600">{job.applicationCount} applications</span>
                            <span className="text-sm text-gray-600">
                              Posted {new Date(job.postedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewJob(job)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => editJob(job)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1 rounded border border-green-200 hover:bg-green-50 transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => deleteJob(job._id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">💼</div>
                      <p className="text-gray-600 mb-4">You haven't posted any jobs yet</p>
                      <button
                        onClick={() => onNavigate("post-job")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Post Your First Job
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "applications" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Applications</h3>
                <div className="space-y-4">
                  {applications.length > 0 ? (
                    applications.map((application) => (
                      <div key={application._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-medium">{application.userId.name}</h4>
                            <p className="text-sm text-gray-600">{application.userId.email}</p>
                            <p className="text-sm text-gray-600">Applied for: {application.jobId.title}</p>
                            {application.coverLetter && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Cover Letter:</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1 max-w-2xl">
                                  {application.coverLetter.length > 200
                                    ? `${application.coverLetter.substring(0, 200)}...`
                                    : application.coverLetter}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(application.status)}`}>
                                {application.status}
                              </span>
                              <span className="text-sm text-gray-600">
                                Applied {new Date(application.appliedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => downloadResume(application.resumeFilePath)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-3 py-1 rounded transition-colors"
                            >
                              📄 Download Resume
                            </button>
                            <a
                              href={`mailto:${application.userId.email}?subject=Regarding your application for ${application.jobId.title}`}
                              className="text-green-600 hover:text-green-800 text-sm font-medium bg-green-50 px-3 py-1 rounded transition-colors"
                            >
                              📧 Contact Applicant
                            </a>
                          </div>
                          <select
                            value={application.status}
                            onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📄</div>
                      <p className="text-gray-600">No applications received yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Applications will appear here when users apply to your jobs
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
