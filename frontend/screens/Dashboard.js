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

  useEffect(() => {
    fetchDashboardData()
    fetchMyJobs()
    fetchApplications()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`${config.BASE_URL}/dashboard-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  const fetchMyJobs = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`${config.BASE_URL}/my-jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMyJobs(data)
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
    }
  }

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`${config.BASE_URL}${config.endpoints.applications}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
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
        fetchApplications() // Refresh applications
        fetchDashboardData() // Refresh stats
      }
    } catch (error) {
      console.error("Error updating application status:", error)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                + Post Job
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your job postings and applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalJobs}</p>
              </div>
              <div className="text-blue-600 text-3xl">💼</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{dashboardData.stats.activeJobs} active</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalApplications}</p>
              </div>
              <div className="text-green-600 text-3xl">👥</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{dashboardData.stats.pendingApplications} pending</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.activeJobs}</p>
              </div>
              <div className="text-purple-600 text-3xl">📈</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Currently hiring</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
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
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("jobs")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "jobs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                My Jobs
              </button>
              <button
                onClick={() => setActiveTab("applications")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "applications"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Applications
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {dashboardData.recentJobs.slice(0, 5).map((job) => (
                    <div key={job._id} className="flex items-center justify-between p-4 border rounded-lg">
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
                  ))}
                </div>
              </div>
            )}

            {activeTab === "jobs" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Your Job Postings</h3>
                  <button
                    onClick={() => onNavigate("post-job")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    + Post New Job
                  </button>
                </div>
                <div className="space-y-4">
                  {myJobs.map((job) => (
                    <div key={job._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
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
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                        <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "applications" && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Applications</h3>
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{application.userId.name}</h4>
                        <p className="text-sm text-gray-600">{application.userId.email}</p>
                        <p className="text-sm text-gray-600">Applied for: {application.jobId.title}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(application.status)}`}>
                            {application.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Resume</button>
                        <select
                          value={application.status}
                          onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  ))}
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
