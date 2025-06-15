"use client"

import { useState, useEffect } from "react"
import config from "../config"

const Applications = ({ user, onNavigate }) => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

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

      const response = await fetch(`${config.BASE_URL}/resume/${filename}`, {
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
        console.error("Failed to download resume")
      }
    } catch (error) {
      console.error("Error downloading resume:", error)
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
              <span className="ml-2 text-2xl font-bold text-gray-900">DevBoard</span>
            </div>
            <button
              onClick={() => onNavigate(user.role === "admin" ? "dashboard" : "jobs")}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.role === "admin" ? "All Applications" : "My Applications"}
          </h1>
          <p className="text-gray-600">
            {user.role === "admin" ? "Review and manage job applications" : "Track your job application status"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                <p className="text-gray-600">
                  {user.role === "admin"
                    ? "No applications have been submitted yet."
                    : "You haven't applied to any jobs yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application._id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{application.jobId.title}</h3>
                        <p className="text-gray-600">{application.jobId.company}</p>
                        {user.role === "admin" && (
                          <p className="text-sm text-gray-600 mt-1">
                            Applicant: {application.userId.name} ({application.userId.email})
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}
                      >
                        {application.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-4">
                      Applied on {new Date(application.appliedAt).toLocaleDateString()}
                    </div>

                    {application.coverLetter && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Cover Letter:</h4>
                        <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">{application.coverLetter}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">Resume: {application.resumeFilePath.split("/").pop()}</div>
                      <div className="flex space-x-2">
                        {user.role === "admin" ? (
                          <button
                            onClick={() => downloadResume(application.resumeFilePath)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-3 py-1 rounded"
                          >
                            📄 Download Resume
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500">Resume submitted</span>
                        )}
                        {user.role === "admin" && (
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                            Contact Applicant
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Applications
