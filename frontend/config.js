// Backend API configuration with environment support
const config = {
  // Determine base URL based on environment
  BASE_URL: (() => {
    // For production, use the environment variable
    if (process.env.NODE_ENV === "production" && process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL
    }

    // For development, check if custom API URL is set
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL
    }

    // Client-side detection for development
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "http://localhost:5000"
      }
    }

    // Default fallback
    return "http://localhost:5000"
  })(),

  // API endpoints
  endpoints: {
    register: "/register",
    login: "/login",
    jobs: "/jobs",
    apply: "/apply",
    applications: "/applications",
    dashboardData: "/dashboard-data",
    myJobs: "/my-jobs",
    checkApplication: "/check-application",
    resume: "/resume",
    saveJob: "/save-job",
    savedJobs: "/saved-jobs",
    checkSaved: "/check-saved",
  },

  // App configuration
  app: {
    name: "DevBoard",
    version: "1.0.0",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: [".pdf", ".doc", ".docx"],
    jobsPerPage: 10,
  },
}

// Debug logging in development
if (process.env.NODE_ENV === "development") {
  console.log("API Base URL:", config.BASE_URL)
  console.log("Environment:", process.env.NODE_ENV)
  console.log("REACT_APP_API_URL:", process.env.REACT_APP_API_URL)
}

export default config
