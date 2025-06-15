"use client"

import { useState, useEffect } from "react"
import config from "../config"

const JobDetail = ({ job, user, onNavigate }) => {
  const [showApplication, setShowApplication] = useState(false)
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    resume: null,
  })
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState("")
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]
      if (!allowedTypes.includes(file.type)) {
        setMessage("Please upload a PDF, DOC, or DOCX file")
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("File size must be less than 5MB")
        return
      }

      setApplicationData({
        ...applicationData,
        resume: file,
      })
      setMessage("") // Clear any previous error messages
    }
  }

  const handleInputChange = (e) => {
    setApplicationData({
      ...applicationData,
      [e.target.name]: e.target.value,
    })
  }

  const handleApply = async (e) => {
    e.preventDefault()

    if (!applicationData.resume) {
      setMessage("Please upload your resume")
      return
    }

    setApplying(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("jobId", job._id)
      formData.append("coverLetter", applicationData.coverLetter)
      formData.append("resume", applicationData.resume)

      const token = localStorage.getItem("auth-token")
      if (!token) {
        setMessage("Authentication required. Please log in again.")
        setApplying(false)
        return
      }

      const response = await fetch(`${config.BASE_URL}${config.endpoints.apply}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Application submitted successfully!")
        setShowApplication(false)
        setApplicationData({ coverLetter: "", resume: null })
        setHasApplied(true)
        setApplicationStatus("pending")
        // Reset file input
        const fileInput = document.getElementById("resume")
        if (fileInput) fileInput.value = ""
      } else {
        setMessage(data.error || "Application failed")
      }
    } catch (error) {
      console.error("Application error:", error)
      setMessage("Network error. Please check your connection and try again.")
    } finally {
      setApplying(false)
    }
  }

  const checkSavedStatus = async () => {
    if (job && user && user.role === "user") {
      try {
        const token = localStorage.getItem("auth-token")
        if (!token) return

        const response = await fetch(`${config.BASE_URL}${config.endpoints.checkSaved}/${job._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setIsSaved(data.isSaved)
        }
      } catch (error) {
        console.error("Error checking saved status:", error)
      }
    }
    setCheckingStatus(false)
  }

  const handleSaveJob = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) {
        setMessage("Please log in to save jobs")
        return
      }

      const url = `${config.BASE_URL}${config.endpoints.saveJob}${isSaved ? `/${job._id}` : ""}`
      const method = isSaved ? "DELETE" : "POST"
      const body = isSaved ? undefined : JSON.stringify({ jobId: job._id })

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(method === "POST" && { "Content-Type": "application/json" }),
        },
        ...(body && { body }),
      })

      if (response.ok) {
        setIsSaved(!isSaved)
        setMessage(isSaved ? "Job removed from saved list" : "Job saved successfully!")
      } else {
        const data = await response.json()
        setMessage(data.error || "Failed to save job")
      }
    } catch (error) {
      console.error("Error saving job:", error)
      setMessage("Failed to save job. Please try again.")
    }
  }

  useEffect(() => {
    // Check if user already applied for this job
    const checkApplicationStatus = async () => {
      if (job && user && user.role === "user") {
        try {
          const token = localStorage.getItem("auth-token")
          if (!token) {
            setLoading(false)
            return
          }

          const response = await fetch(`${config.BASE_URL}${config.endpoints.checkApplication}/${job._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setHasApplied(data.hasApplied)
            if (data.hasApplied && data.application) {
              setApplicationStatus(data.application.status)
              setMessage(
                `You applied for this position on ${new Date(data.application.appliedAt).toLocaleDateString()}. Status: ${data.application.status}`,
              )
            }
          }
        } catch (error) {
          console.error("Error checking application status:", error)
        }
      }
      setLoading(false)
    }

    checkApplicationStatus()
    checkSavedStatus()
  }, [job, user])

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h2>
          <button
            onClick={() => onNavigate("jobs")}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Jobs
          </button>
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
            <button
              onClick={() => onNavigate("jobs")}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              ← Back to Jobs
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Job Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xl font-medium text-blue-600 mb-4">{job.company}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📍 {job.location}</span>
                <span>📅 Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">{job.type}</span>
              </div>
            </div>
            {job.salary && (
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{job.salary}</div>
                <div className="text-sm text-gray-600">per year</div>
              </div>
            )}
          </div>

          {/* Job Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Job Description</h3>
            <div className="prose max-w-none">
              {job.description.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-3 text-gray-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.includes("success") || message.includes("applied")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* Application Section - Only show for users */}
          {user && user.role === "user" && (
            <div className="border-t pt-6">
              {checkingStatus ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Checking status...</p>
                </div>
              ) : !showApplication ? (
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowApplication(true)}
                    className={`px-6 py-3 rounded-md text-lg font-medium transition-colors ${
                      hasApplied
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    disabled={hasApplied}
                  >
                    {hasApplied ? "✓ Already Applied" : "Apply Now"}
                  </button>
                  <button
                    onClick={handleSaveJob}
                    className={`px-6 py-3 rounded-md text-lg font-medium transition-colors ${
                      isSaved
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {isSaved ? "★ Saved" : "☆ Save Job"}
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Apply for this position</h3>
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
                        Resume *
                      </label>
                      <input
                        id="resume"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        required
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-sm text-gray-600 mt-1">Upload your resume (PDF, DOC, or DOCX, max 5MB)</p>
                    </div>
                    <div>
                      <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Letter
                      </label>
                      <textarea
                        id="coverLetter"
                        name="coverLetter"
                        value={applicationData.coverLetter}
                        onChange={handleInputChange}
                        placeholder="Tell us why you're interested in this position..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={applying}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {applying ? "Submitting..." : "Submit Application"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowApplication(false)
                          setMessage("")
                          setApplicationData({ coverLetter: "", resume: null })
                          const fileInput = document.getElementById("resume")
                          if (fileInput) fileInput.value = ""
                        }}
                        disabled={applying}
                        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Admin View */}
          {user && user.role === "admin" && (
            <div className="border-t pt-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-blue-800 font-medium">Admin View</p>
                <p className="text-blue-700 text-sm">
                  You are viewing this job as an admin. Users can apply to this position.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default JobDetail
