require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cors = require("cors")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 5000

// ✅ IMPROVED: Require JWT_SECRET in production
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is required")
  process.exit(1)
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/devboard"

// Middleware
app.use(cors())
app.use(express.json({ limit: "10mb" })) // ✅ IMPROVED: Add size limit
app.use("/uploads", express.static("uploads"))

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true }) // ✅ IMPROVED: recursive option
}

// ✅ IMPROVED: File upload configuration with better security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    // ✅ IMPROVED: Sanitize filename and add timestamp
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")
    cb(null, Date.now() + "-" + sanitizedName)
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"))
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file per request
  },
})

// ✅ IMPROVED: MongoDB connection with better error handling
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  })

// ✅ IMPROVED: User Schema with validation
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
  },
  passwordHash: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin"],
      message: "Role must be either user or admin",
    },
    default: "user",
  },
  createdAt: { type: Date, default: Date.now },
})

// ✅ IMPROVED: Add index for email lookups
userSchema.index({ email: 1 })

const User = mongoose.model("User", userSchema)

// ✅ IMPROVED: Job Schema with validation
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Job title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"],
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  company: {
    type: String,
    required: [true, "Company name is required"],
    trim: true,
    minlength: [2, "Company name must be at least 2 characters"],
    maxlength: [100, "Company name cannot exceed 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Job description is required"],
    minlength: [10, "Description must be at least 10 characters"],
    maxlength: [5000, "Description cannot exceed 5000 characters"],
  },
  requirements: [
    {
      type: String,
      trim: true,
      maxlength: [200, "Each requirement cannot exceed 200 characters"],
    },
  ],
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true,
    maxlength: [100, "Location cannot exceed 100 characters"],
  },
  type: {
    type: String,
    required: [true, "Job type is required"],
    enum: {
      values: ["Full-time", "Part-time", "Contract", "Internship"],
      message: "Job type must be Full-time, Part-time, Contract, or Internship",
    },
  },
  salary: {
    type: String,
    trim: true,
    maxlength: [50, "Salary cannot exceed 50 characters"],
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Posted by user is required"],
  },
  postedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: {
      values: ["active", "closed"],
      message: "Status must be active or closed",
    },
    default: "active",
  },
})

// ✅ IMPROVED: Add indexes for search performance
jobSchema.index({ title: "text", company: "text", description: "text" })
jobSchema.index({ location: 1 })
jobSchema.index({ type: 1 })
jobSchema.index({ status: 1 })
jobSchema.index({ postedAt: -1 })

const Job = mongoose.model("Job", jobSchema)

// ✅ IMPROVED: Application Schema with validation
const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: [true, "Job ID is required"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  resumeFilePath: {
    type: String,
    required: [true, "Resume file path is required"],
  },
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, "Cover letter cannot exceed 2000 characters"],
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "reviewed", "shortlisted", "rejected"],
      message: "Status must be pending, reviewed, shortlisted, or rejected",
    },
    default: "pending",
  },
  appliedAt: { type: Date, default: Date.now },
})

// ✅ IMPROVED: Add compound index to prevent duplicate applications
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true })
applicationSchema.index({ status: 1 })
applicationSchema.index({ appliedAt: -1 })

const Application = mongoose.model("Application", applicationSchema)

// ✅ IMPROVED: Auth Middleware with better error handling
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" })
      }
      return res.status(403).json({ error: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// ✅ IMPROVED: Admin Middleware with better error handling
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" })
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" })
  }
  next()
}

// ✅ IMPROVED: Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({ error: error.details[0].message })
    }
    next()
  }
}

// Routes

// ✅ IMPROVED: POST /register with better validation
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" })
    }

    // Hash password
    const saltRounds = 12 // ✅ IMPROVED: Increased from default 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
    })
    await user.save()

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: "Server error during registration" })
  }
})

// ✅ IMPROVED: POST /login with better validation and security
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error during login" })
  }
})

// ✅ IMPROVED: GET /jobs with better search and pagination
app.get("/jobs", async (req, res) => {
  try {
    const { search, location, type, page = 1, limit = 10 } = req.query

    // Validate pagination parameters
    const pageNum = Math.max(1, Number.parseInt(page))
    const limitNum = Math.min(50, Math.max(1, Number.parseInt(limit))) // Max 50 items per page

    const query = { status: "active" }

    // Search functionality
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { company: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ]
    }

    // Location filter
    if (location && location.trim()) {
      query.location = { $regex: location.trim(), $options: "i" }
    }

    // Type filter
    if (type && type !== "all" && ["Full-time", "Part-time", "Contract", "Internship"].includes(type)) {
      query.type = type
    }

    const jobs = await Job.find(query)
      .populate("postedBy", "name email")
      .sort({ postedAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean() // ✅ IMPROVED: Use lean() for better performance

    const total = await Job.countDocuments(query)

    res.json({
      jobs,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    })
  } catch (error) {
    console.error("Jobs fetch error:", error)
    res.status(500).json({ error: "Server error while fetching jobs" })
  }
})

// ✅ IMPROVED: POST /jobs with better validation
app.post("/jobs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, company, description, requirements, location, type, salary } = req.body

    // Input validation
    if (!title || !company || !description || !location || !type) {
      return res.status(400).json({
        error: "Title, company, description, location, and type are required",
      })
    }

    if (!["Full-time", "Part-time", "Contract", "Internship"].includes(type)) {
      return res.status(400).json({
        error: "Type must be Full-time, Part-time, Contract, or Internship",
      })
    }

    // Process requirements
    let processedRequirements = []
    if (requirements) {
      if (typeof requirements === "string") {
        processedRequirements = requirements
          .split("\n")
          .map((req) => req.trim())
          .filter((req) => req.length > 0)
      } else if (Array.isArray(requirements)) {
        processedRequirements = requirements.map((req) => req.toString().trim()).filter((req) => req.length > 0)
      }
    }

    const job = new Job({
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      requirements: processedRequirements,
      location: location.trim(),
      type,
      salary: salary ? salary.trim() : undefined,
      postedBy: req.user.userId,
    })

    await job.save()
    await job.populate("postedBy", "name email")

    res.status(201).json(job)
  } catch (error) {
    console.error("Job creation error:", error)
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: "Server error while creating job" })
  }
})

// ✅ IMPROVED: GET /jobs/:id with better error handling
app.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid job ID format" })
    }

    const job = await Job.findById(id).populate("postedBy", "name email").lean()

    if (!job) {
      return res.status(404).json({ error: "Job not found" })
    }

    res.json(job)
  } catch (error) {
    console.error("Job fetch error:", error)
    res.status(500).json({ error: "Server error while fetching job" })
  }
})

// ✅ IMPROVED: POST /apply with better validation and error handling
app.post("/apply", authenticateToken, upload.single("resume"), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body

    // Validate inputs
    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" })
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Invalid job ID format" })
    }

    if (!req.file) {
      return res.status(400).json({ error: "Resume file is required" })
    }

    // Check if job exists and is active
    const job = await Job.findById(jobId)
    if (!job) {
      return res.status(404).json({ error: "Job not found" })
    }

    if (job.status !== "active") {
      return res.status(400).json({ error: "This job is no longer accepting applications" })
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      jobId,
      userId: req.user.userId,
    })

    if (existingApplication) {
      // Clean up uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err)
      })
      return res.status(400).json({ error: "You have already applied for this job" })
    }

    const application = new Application({
      jobId,
      userId: req.user.userId,
      resumeFilePath: req.file.path,
      coverLetter: coverLetter ? coverLetter.trim() : undefined,
    })

    await application.save()
    await application.populate("userId", "name email")
    await application.populate("jobId", "title company")

    res.status(201).json(application)
  } catch (error) {
    console.error("Application error:", error)

    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err)
      })
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: "Server error while submitting application" })
  }
})

// ✅ IMPROVED: GET /applications/:jobId with better validation
app.get("/applications/:jobId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { jobId } = req.params

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: "Invalid job ID format" })
    }

    // Check if job exists and belongs to the admin
    const job = await Job.findOne({ _id: jobId, postedBy: req.user.userId })
    if (!job) {
      return res.status(404).json({ error: "Job not found or access denied" })
    }

    const applications = await Application.find({ jobId })
      .populate("userId", "name email")
      .populate("jobId", "title company")
      .sort({ appliedAt: -1 })
      .lean()

    res.json(applications)
  } catch (error) {
    console.error("Applications fetch error:", error)
    res.status(500).json({ error: "Server error while fetching applications" })
  }
})

// ✅ IMPROVED: GET /applications with better role-based access
app.get("/applications", authenticateToken, async (req, res) => {
  try {
    let query = {}

    if (req.user.role === "admin") {
      // Admin can see applications for their jobs only
      const adminJobs = await Job.find({ postedBy: req.user.userId }).select("_id")
      const jobIds = adminJobs.map((job) => job._id)
      query = { jobId: { $in: jobIds } }
    } else {
      // Users can only see their own applications
      query = { userId: req.user.userId }
    }

    const applications = await Application.find(query)
      .populate("userId", "name email")
      .populate("jobId", "title company")
      .sort({ appliedAt: -1 })
      .lean()

    res.json(applications)
  } catch (error) {
    console.error("Applications fetch error:", error)
    res.status(500).json({ error: "Server error while fetching applications" })
  }
})

// ✅ IMPROVED: PUT /applications/:id with better validation
app.put("/applications/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application ID format" })
    }

    if (!["pending", "reviewed", "shortlisted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" })
    }

    // Find application and check if it belongs to admin's job
    const application = await Application.findById(id).populate("jobId")
    if (!application) {
      return res.status(404).json({ error: "Application not found" })
    }

    if (application.jobId.postedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Update application
    application.status = status
    await application.save()

    await application.populate("userId", "name email")
    await application.populate("jobId", "title company")

    res.json(application)
  } catch (error) {
    console.error("Application update error:", error)
    res.status(500).json({ error: "Server error while updating application" })
  }
})

// ✅ IMPROVED: GET /dashboard-data with better aggregation
app.get("/dashboard-data", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.userId

    // Get admin's jobs
    const adminJobs = await Job.find({ postedBy: adminId }).select("_id")
    const jobIds = adminJobs.map((job) => job._id)

    // Calculate stats
    const [totalJobs, activeJobs, totalApplications, pendingApplications] = await Promise.all([
      Job.countDocuments({ postedBy: adminId }),
      Job.countDocuments({ postedBy: adminId, status: "active" }),
      Application.countDocuments({ jobId: { $in: jobIds } }),
      Application.countDocuments({ jobId: { $in: jobIds }, status: "pending" }),
    ])

    // Get applications by month for chart (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const applicationsByMonth = await Application.aggregate([
      {
        $match: {
          jobId: { $in: jobIds },
          appliedAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$appliedAt" },
            month: { $month: "$appliedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    // Get applications by status for pie chart
    const applicationsByStatus = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ])

    // Get recent jobs with application counts
    const recentJobs = await Job.aggregate([
      { $match: { postedBy: mongoose.Types.ObjectId(adminId) } },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "jobId",
          as: "applications",
        },
      },
      {
        $addFields: {
          applicationCount: { $size: "$applications" },
        },
      },
      { $sort: { postedAt: -1 } },
      { $limit: 10 },
      {
        $project: {
          applications: 0, // Remove applications array from output
        },
      },
    ])

    res.json({
      stats: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
      },
      charts: {
        applicationsByMonth,
        applicationsByStatus,
      },
      recentJobs,
    })
  } catch (error) {
    console.error("Dashboard data error:", error)
    res.status(500).json({ error: "Server error while fetching dashboard data" })
  }
})

// ✅ IMPROVED: GET /my-jobs with better performance
app.get("/my-jobs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const jobs = await Job.aggregate([
      { $match: { postedBy: mongoose.Types.ObjectId(req.user.userId) } },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "jobId",
          as: "applications",
        },
      },
      {
        $addFields: {
          applicationCount: { $size: "$applications" },
        },
      },
      { $sort: { postedAt: -1 } },
      {
        $project: {
          applications: 0, // Remove applications array from output
        },
      },
    ])

    res.json(jobs)
  } catch (error) {
    console.error("My jobs fetch error:", error)
    res.status(500).json({ error: "Server error while fetching jobs" })
  }
})

// ✅ IMPROVED: Global error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error)

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 5MB." })
    }
    return res.status(400).json({ error: "File upload error" })
  }

  res.status(500).json({ error: "Internal server error" })
})

// ✅ IMPROVED: 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
})

// ✅ IMPROVED: Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed")
    process.exit(0)
  })
})
