// Backend API configuration
const config = {
  // Change this to your backend URL when deployed
  BASE_URL: process.env.NODE_ENV === "production" ? "https://your-backend-url.herokuapp.com" : "http://localhost:5000",

  // API endpoints
  endpoints: {
    register: "/register",
    login: "/login",
    jobs: "/jobs",
    apply: "/apply",
    applications: "/applications",
    dashboardData: "/dashboard-data",
    myJobs: "/my-jobs",
  },
}

export default config
